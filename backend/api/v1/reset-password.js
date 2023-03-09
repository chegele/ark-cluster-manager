
const route = "/api-v1/reset-password";

import crypto from "crypto";
import express from "express";
import sessionManager from "../../services/session-manager.js";
import rateLimiter from "../../services/rate-limiter.js";
import emailVerification from "../../services/email-validator.js";
import database from "../../services/database/database.js";
import * as types from "../../services/database/typedef.js";

export default class ResetPasswordRoute {
    static route = route;

    /** 1st call - Send the user a password reset key via email
     *  2nd call - Updates the users password if valid key provided
     * @param {express.Request} req 
     * @param {express.Response} res  
     */
    static async post(req, res) {

        // Ensure the requester has not exceeded the rate limit
        const result = {errors: []};
        const cooldown = rateLimiter.limitRequest(req.clientIp, "POST" + route, 6);
        if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
        if (result.errors.length > 0) return res.status(429).json(result);

        // Validate the user does not already have an active session
        const session = await sessionManager.getSession(req);
        if (session) result.errors.push("You are already logged into an active session.");
        if (result.errors.length > 0) return res.status(403).json(result);

        // Validate that the required properties are in the request body
        const username = req.body.username;
        const email = req.body.email;
        const key = req.body.key;
        const password = req.body.password;
        const requiredProperties = ["username", 'email'];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Validate that the user and email match an active profile
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username});
        if (!profile) result.errors.push("An account with this username does not exist.");
        if (profile && profile.email != email) result.errors.push("The provided email is incorrect.");
        if (result.errors.length > 0) return res.status(422).json(result);

        // Send the user the verification key if not done already
        if (!key) {
            const emailSent = await emailVerification.verificationInProgress(email);
            if (!emailSent) await emailVerification.requestResetVerification(username, email);
            result.errors.push("You must provide the reset key that was sent to your email.");
            return res.status(401).json(result);
        }

        // Verify that the password meets the complexity requirements 
        if (!password) result.errors.push("You must specify the password to update the account with.");
        if (password?.length < 6) result.errors.push("The password must have at least 6 characters.");
        if (password?.length > 24) result.errors.push("The password must be less than 24 characters.");
        if (!validatePassword(password)) result.errors.push("The password must include uppercase, lowercase, and a symbol.");
        if (result.errors.length > 0) return res.status(422).json(result);

        // Retrieve the authentication user
        /** @type {types.AuthUser} */
        const authUser = await database.AuthUser.findOne({username});
        if (!authUser) result.errors.push("An account with this username does not exist.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Verify the users reset key
        const matches = await emailVerification.completeVerification(email, key);
        if (!matches) result.errors.push("Incorrect password reset key.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Update the password and return ok
        authUser.salt = crypto.randomBytes(128).toString('base64');
        authUser.hash = crypto.createHash("sha256").update(password + authUser.salt).digest("base64");
        await authUser.save();
        res.json(result);
    }

}

/** Validates that the password meets the complexity requirements
 * @param {String} pass
 * @returns {Boolean} 
 */
 function validatePassword(pass) {
    if (!pass) return false;
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