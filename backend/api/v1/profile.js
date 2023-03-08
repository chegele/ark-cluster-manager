
const route = "/api-v1/profile/:username?";

import express from "express";
import sessionManager from "../../services/session-manager.js";
import rateLimiter from "../../services/rate-limiter.js";
import database from "../../services/database/database.js";
import * as types from "../../services/database/typedef.js";

export default class ProfileRoute {
    static route = route;

    /** Retrieves the user by id
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async get(req, res) {

        // Validate that the required properties are in the request body
        const result = {errors: []};
        if (req.params.username) req.body.username = req.params.username;
        const requiredProperties = ["username"];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body or url.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Check to see if the user has an active session, and are viewing their own profile
        const username = req.params.username;
        const session = await sessionManager.getSession(req);
        const isOwner = session == username;

        // Validate that the username matches an active profile
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username});
        if (!profile) result.errors.push("An account with this username does not exist.");
        if (result.errors.length > 0) return res.status(422).json(result);

        // Populate the response profile object
        if (isOwner) { 
            result.profile = profile;
        } else {
            result.profile = {};
            const publicProperties = ["username", "ownedClusterIds", "membershipClusterIds"];
            for (const prop of publicProperties) result.profile[prop] = profile[prop];
        }
        
        // Return the results
        res.json(result);
    }

    /** Updates the user
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async put(req, res) {

        // Ensure the requester has not exceeded the rate limit
        const result = {errors: []};
        const cooldown = rateLimiter.limitRequest(req.hostname, "PUT" + route, 10);
        if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
        if (result.errors.length > 0) return res.status(429).json(result);

        // Validate that the required properties are in the request body
        const action = req.body.action;
        const value = req.body.value;
        const requiredProperties = ["action", "value"];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body or url.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Validate that the request action is permitted
        const permittedActions = ["updateEmail", "joinCluster", "leaveCluster"];
        if (!permittedActions.includes(action)) result.errors.push(`${action} is not a permitted action.`);
        if (result.errors.length > 0) return res.status(400).json(result);

        // Validate that the user has an active session and is the owner of the profile
        const username = await sessionManager.getSession(req);
        if (!username) result.errors.push(`You must be logged in to modify your profile.`);
        if (result.errors.length > 0) return res.status(401).json(result);

        // Validate that the username matches an active profile
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username});
        if (!profile) result.errors.push("An account with this username does not exist.");
        if (result.errors.length > 0) return res.status(422).json(result);

        // Update the profile to use the provided email address
        if (action == "updateEmail") {
            if (validateEmail(value)) {
                profile.email = value;
            } else {
                result.errors.push("The email does not have an expected pattern.");
            }
        }

        // Update the profile to be a member of the cluster
        if (action == "joinCluster" && !profile.membershipClusterIds.includes(value)) {
            profile.membershipClusterIds.push(value);
        }

        // Update the profile to no longer be a member of the cluster
        if (action == "leaveCluster") {
            const index = profile.membershipClusterIds.indexOf(value);
            if (index != -1) profile.membershipClusterIds.splice(index, 1);
        }

        // Cancel the change if any errors were encountered
        if (result.errors.length > 0) return res.status(422).json(result);

        // Save the changes and return ok
        await profile.save();
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