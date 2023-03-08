
import express from "express";
import sessionManager from "./session-manager.js"
import rateLimiter from "./rate-limiter.js";

export default class Utility {

    /** Checks to see if any required properties are missing
     * If missing properties, a 400 response is sent with errors
     * @param {express.Request} req - The express request object
     * @param {express.Response} res - The express response object
     * @param {String[]} properties - An array of property names to validate
     * @returns {Boolean} true if there were missing properties
     */
    static missingRequiredProperties(req, res, properties) {
        const result = {errors: []};
        for (const property of properties) if (!req.body[property]) {
            result.errors.push(`Missing ${property} in request body.`);
        }
        if (result.errors.length == 0) return false;
        res.status(400).json(result);
        return true;
    }

    /** Checks to see if the user has an active session
     * If incorrect or no active session, a 401 or 403 response is sent with errors
     * @param {express.Request} req - The express request object 
     * @param {express.Response} res - The express response object 
     * @param {String} [username] - Optionally specify the user they must be logged in as
     * @returns {Boolean} - True if there incorrect or no user logged in
     */
    static async notLoggedIn(req, res, username) {
        const result = {errors: []};
        const session = await sessionManager.getSession(req);
        if (!session) {
            result.errors.push("You must be logged in to perform this action.");
            res.status(401)
        } else if (username && session != username) {
            result.errors.push("User is not authorized to perform this action.");
            res.status(403);
        }
        if (result.errors.length == 0) return false;
        res.json(result);
        return true;
    }

    /** Checks to see if the user is currently being rate limited
     * If being limited, a 429 response code is sent with the error
     * @param {express.Request} req - The express request object
     * @param {express.Response} res - The express response object
     * @param {('GET' | 'POST' | 'PUT' | 'DELETE')} method 
     * @param {String} route - The route user is interacting with
     * @param {Number} limit - The maximum number of calls within the timer
     * @returns {Boolean} - True if the user is being rate limited 
     */
    static rateLimited(req, res, method, route, limit) {
        const result = {errors: []};
        const cooldown = rateLimiter.limitRequest(req.hostname, method + route, limit);
        if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
        if (result.errors.length == 0) return false;
        res.status(429).json(result);
        return true;
    }

}