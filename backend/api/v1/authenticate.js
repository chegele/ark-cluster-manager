
const route = "/api-v1/authenticate";

import crypto from "crypto";
import express from "express";
import logger from "../../services/logger.js";
import sessionManager from "../../services/session-manager.js";
import rateLimiter from "../../services/rate-limiter.js";
import emailVerification from "../../services/email-validator.js";
import database from "../../services/database/database.js";
import * as types from "../../services/database/typedef.js";

export default class AuthenticateRoute {
    static route = route;


    /** Attempts to login and create a new session
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async get(req, res) {

        // Ensure the requester has not exceeded the rate limit
        const result = {user: null, errors: []};
        const cooldown = rateLimiter.limitRequest(req.hostname, "GET" + route, 6);
        if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
        if (result.errors.length > 0) return res.status(429).json(result);

        // Validate the user does not already have an active session
        const session = await sessionManager.getSession(req);
        if (session) {
            result.errors.push("You are already logged into an active session.");
            const profile = await database.Profile.findOne({username: session});
            result.user = profile ? profile : null;
            return res.status(403).json(result);
        }

        // Validate that the required properties are in the request body
        const user = req.body.username;
        const password = req.body.password;
        const emailKey = req.body.key;
        const requiredProperties = ["username", "password"];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Retrieve the authentication user
        /** @type {types.AuthUser} */
        const authUser = await database.AuthUser.findOne({username: user});
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username: user});
        if (!authUser || !profile) result.errors.push("An account with this username does not exist.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Validate the users credentials 
        const salt = authUser.salt;
        const generatedHash = crypto.createHash("sha256").update(password + salt).digest("base64");
        if (generatedHash != authUser.hash) result.errors.push("The username and password do not match.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Ensure the user is activated or send email verification
        if (!authUser.verified) {
            if (emailKey) {
                const matches = await emailVerification.completeVerification(profile.email, emailKey);
                if (!matches) result.errors.push("Incorrect email verification key.");
                if (result.errors.length > 0) return res.status(401).json(result);
                authUser.verified = true;
                await authUser.save();
            } else {
                const emailSent = await emailVerification.verificationInProgress(profile.email);
                if (!emailSent) await emailVerification.requestEmailVerification(user, profile.email);
                result.errors.push("You must provide the key sent to your email for first time login.");
                return res.status(401).json(result);
            }
        }

        // Create the users session and return the profile
        await sessionManager.createSession(req, user);
        result.user = profile;
        res.json(result);
    }


    /** Creates a new auth-user AND user profile
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async post(req, res) {

        // Ensure the requester has not exceeded the rate limit
        const result = {user: null, errors: []};
        const cooldown = rateLimiter.limitRequest(req.hostname, "POST" + route, 6);
        if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
        if (result.errors.length > 0) return res.status(429).json(result);

        // Validate the user does not already have an active session
        const session = await sessionManager.getSession(req);
        if (session) result.errors.push("You are already logged into an active session.");
        if (result.errors.length > 0) return res.status(403).json(result);

        // Validate that the required properties are in the request body
        const requiredProperties = ["username", "email", "password"];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Verify that the properties meet the complexity requirements
        const user = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        if (user.length < 5) result.errors.push("The username must be at least 5 characters.");
        if (user.length > 24) result.errors.push("The username must be less than 24 characters.");
        if (!validateEmail(email)) result.errors.push("The email does not have the expected structure.")
        if (password.length < 6) result.errors.push("The password must have at least 6 characters.");
        if (password.length > 24) result.errors.push("The password must be less than 24 characters.");
        if (!validatePassword(password)) result.errors.push("The password must include uppercase, lowercase, and a symbol.");
        if (result.errors.length > 0) return res.status(422).json(result);

        // Verify that the user does not already exist 
        let authUserExists = await database.AuthUser.findOne({username: user});
        let profileExists = await database.Profile.findOne({$or: [{username: user}, {email: email}]});
        if (authUserExists || profileExists) result.errors.push("The username or email address is already in use.");
        if (result.errors.length > 0) return res.status(409).json(result);

        // Create and validate the user
        const salt = crypto.randomBytes(128).toString('base64');
        const hash = crypto.createHash("sha256").update(password + salt).digest("base64");
        const profile = new database.Profile({ username: user, email: email });
        const authUser = new database.AuthUser({ username: user, salt, hash });
        try {
            await profile.save();
            await authUser.save();
        } catch (err) {
            logger.error(err);
            result.errors.push("Error saving user to the database.");
            return res.status(500).json(result);
        }

        // Return the profile
        logger.info("Created new user - " + profile.username);
        result.user = profile;
        res.json(result);
    }


    /** Updates the password for an authentication user
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async put(req, res) {

        // Ensure the requester has not exceeded the rate limit
        const result = {errors: []};
        const cooldown = rateLimiter.limitRequest(req.hostname, "PUT" + route, 6);
        if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
        if (result.errors.length > 0) return res.status(429).json(result);

        // Validate the user has an active session
        const username = await sessionManager.getSession(req);
        if (!username) result.errors.push("You must have an active session, please log in.");
        if (result.errors.length > 0) return res.status(403).json(result);

        // Validate that the required properties are in the request body
        const oldPassword = req.body.oldPassword;
        const newPassword = req.body.newPassword;
        const requiredProperties = ["oldPassword", 'newPassword'];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Verify that the properties meet the complexity requirements
        if (newPassword.length < 6) result.errors.push("The password must have at least 6 characters.");
        if (newPassword.length > 24) result.errors.push("The password must be less than 24 characters.");
        if (!validatePassword(newPassword)) result.errors.push("The password must include uppercase, lowercase, and a symbol.");
        if (result.errors.length > 0) return res.status(422).json(result);

        // Retrieve the authentication user
        /** @type {types.AuthUser} */
        const authUser = await database.AuthUser.findOne({username});
        if (!authUser) result.errors.push("An account with this username does not exist.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Validate the users old password
        const generatedHash = crypto.createHash("sha256").update(oldPassword + authUser.salt).digest("base64");
        if (generatedHash != authUser.hash) result.errors.push("The oldPassword does not match the current password.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Update the password and return ok
        authUser.salt = crypto.randomBytes(128).toString('base64');
        authUser.hash = crypto.createHash("sha256").update(newPassword + authUser.salt).digest("base64");
        await authUser.save();
        res.json(result);
    }


    //TODO: This has no current use. Repurposed the delete endpoint as a logout
    // /** Deletes the currently logged in user
    //  * TODO: (after launch) Update this to deactivate instead of delete 
    //  * @param {express.Request} req 
    //  * @param {express.Response} res 
    //  */
    // static async delete(req, res) {

    //     // Ensure the requester has not exceeded the rate limit
    //     const result = {errors: []};
    //     const cooldown = rateLimiter.limitRequest(req.hostname, "DELETE" + route, 5);
    //     if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
    //     if (result.errors.length > 0) return res.status(429).json(result);

    //     // Validate the user has an active session
    //     const username = await sessionManager.getSession(req);
    //     if (!username) result.errors.push("You must have an active session, please log in.");
    //     if (result.errors.length > 0) return res.status(401).json(result);

    //     // Validate that the required properties are in the request body
    //     const reason = req.body.reason;
    //     const code = req.body.code;
    //     const requiredProperties = ["reason", 'code'];
    //     for (const property of requiredProperties) {
    //         if (!req.body[property]) result.errors.push(`Missing ${property} in request body.`);
    //     }
    //     if (result.errors.length > 0) return res.status(400).json(result);

    //     // Retrieve the authentication user and profile
    //     /** @type {types.AuthUser} */
    //     const authUser = await database.AuthUser.findOne({username});
    //     /** @type {types.Profile} */
    //     const profile = await database.Profile.findOne({username});
    //     if (!authUser || !profile) result.errors.push("An account with this username does not exist.");
    //     if (result.errors.length > 0) return res.status(422).json(result);

    //     // Complete the deletion and return ok
    //     logger.warn(`Account deletion, ${username} (${code}) - ${reason}`);
    //     await authUser.delete();
    //     await profile.delete();
    //     sessionManager.endSession(req);
    //     res.json(result);
    // }

    /** Ends the session for the currently logged in user
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async delete(req, res) {

        // Validate the user has an active session
        const result = {errors: []};
        const username = await sessionManager.getSession(req);
        if (!username) result.errors.push("You do not have an active session to end.");
        if (result.errors.length > 0) return res.status(403).json(result);

        // End the current session and return the results
        sessionManager.endSession(req);
        res.json(result);
    }

}

/** Validates that the provided string is an email address
 * @param {String} email 
 * @returns {Boolean}
 */
function validateEmail(email) {
    var expression = /\S+@\S+\.\S+/;
    return expression.test(email);
}

/** Validates that the password meets the complexity requirements
 * @param {String} pass
 * @returns {Boolean} 
 */
function validatePassword(pass) {
    const symbols = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    let hasLowerCase = false;
    let hasUpperCase = false;
    let hasSymbol = false;
    for (const char of pass) {
        if (symbols.includes(char)) {
            hasSymbol = true;
            continue;
        }
        if (char.toLowerCase() === char) hasLowerCase = true;
        if (char.toUpperCase() === char) hasUpperCase = true;
    }
    return hasLowerCase && hasUpperCase && hasSymbol;
}