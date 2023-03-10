
import crypto from "crypto";
import express from "express";
import LRUCache from "lru-cache";
import logger from "./logger.js";
import database from "./database/database.js";
import * as types from "./database/typedef.js";


export default class SessionManager {

    static #maxConcurrentSessions = 3;
    static #sessionDuration = 1000 * 60 * 60 * 12;
    static #maxAssociatedAddresses = 100;
    static #maxInvalidKeyUses = 25;
    static #sessionCache = new LRUCache({max: 5000 });
    static #badSessions = new LRUCache({max: 5000, ttl: 1000 * 60 * 60 * 24});

    /** Retrieves the username from the current session
     * @param {express.Request} req - The express request object containing the session cookie
     * @returns {String | null} - The username for the current session or null 
     */
    static async getSession(req) {
        const invalidKeys = SessionManager.#badSessions.get(req.clientIp);
        if (invalidKeys > SessionManager.#maxInvalidKeyUses) return null;
        const username = req.session.user;
        const currentKey = req.session.key;
        if (!username || !currentKey) return null;
        /** @type {types.Session[]} */
        const sessions = SessionManager.#sessionCache.get(req.session.user);
        if (sessions && SessionManager.#validateKey(sessions, currentKey)) return username;
        /** @type {types.AuthUser} */
        const user = await database.AuthUser.findOne({username});
        if (!user || !user.sessions || user.sessions.length < 1) return SessionManager.#invalidKeyUsed(req);
        if (SessionManager.#validateKey(user.sessions, currentKey)) {
            SessionManager.#sessionCache.set(username, sessions);
            return username;
        }
        return SessionManager.#invalidKeyUsed(req);
    }

    /** Overwrites or creates a new session for the provided user
     * @param {express.Request} req - The express request object
     * @param {String} username - The use to create a new session for
     * @return {String | null} error - Any errors encountered while creating the session
     */
    static async createSession(req, username) {
        /** @type {types.AuthUser} */
        const user = await database.AuthUser.findOne({username});
        if (!user) return "Session Error - Unable to retrieve user from the database.";
        user.sessions = SessionManager.#removeExcessSessions(user.sessions);
        const session = SessionManager.#sessionObject(req.clientIp);
        user.sessions.push(session);
        SessionManager.#sessionCache.set(username, user.sessions);
        SessionManager.#appendAddress(user, req.clientIp);
        await user.save();
        req.session.user = username;
        req.session.key = session.key;
    } 

    /** Ends a session for the provided user
     * @param {express.Request} req - The express request object
     */
    static endSession(req) {
        req.session.user = null;
        req.session.key = null;
        req.session = null;
    }

    /** If more than max aloud, removes expired sessions OR the oldest session from the array
     * @param {types.Session[]} sessions - An array of session objects
     * @return {types.Session[]} - sessions reduced by all expired or the 1 oldest 
     */
    static #removeExcessSessions(sessions) {
        if (sessions.length < SessionManager.#maxConcurrentSessions) return sessions;
        const originalSize = sessions.length
        sessions = SessionManager.#removeExpired(sessions);
        if (sessions.length < originalSize) return sessions;
        while (sessions.length >= SessionManager.#maxConcurrentSessions) {
            SessionManager.#removeOldest(sessions);
        }
        return sessions;
    }

    /** Removes expired sessions from the array
     * @param {types.Session[]} sessions - An array of session objects
     * @return {types.Session[]} - sessions cleared of all expired objects
     */
    static #removeExpired(sessions) {
        const today = new Date();
        return sessions.filter(session => session.expires > today);
    }

    /** Removes the oldest session from the array
     * @param {types.Session[]} sessions - An array of session objects
     * @return {types.Session[]} - sessions cleared of all expired objects
     */
    static #removeOldest(sessions) {
        let oldestDate = new Date();
        let oldestIndex = -1;
        for (let i=0; i<sessions.length; i++) {
            if (sessions[i].created < oldestDate) {
                oldestDate = sessions[i].created;
                oldestIndex = i;
            }
        }
        sessions.splice(oldestIndex, 1);
    }

    /** Generates a new session object for storing in the database
     * @param {String} ip - The ip address of the requesting host 
     * @returns {types.Session}
     */
    static #sessionObject(ip) {
        const now = new Date();
        return {
            key: crypto.randomUUID(),
            address: ip,
            created: now,
            expires: new Date(now.getTime() + SessionManager.#sessionDuration)
        }
    }

    /** Appends an IP address to a users associations if not exceeding limit
     * @param {types.AuthUser} user 
     * @param {String} address 
     */
    static #appendAddress(user, address) {
        const maximum = SessionManager.#maxAssociatedAddresses;
        const warning = SessionManager.#maxAssociatedAddresses / 2;
        if (user.associatedAddresses.includes(address)) return;
        const length = user.associatedAddresses.length
        if (length > maximum)  return logger.warn(`HEAVY IP VARIATION - ${user.username} has exceeded the maximum tracked addresses.`);
        if (length > warning) logger.warn(`High ip variation - ${user.username} has sent requests from ${length} addresses.`);
        user.associatedAddresses.push(address);
    }

    /** Checks to see if the sessions has a valid match to the key
     * @param {types.Session[]} sessions 
     * @param {String} key 
     * @returns {Boolean}
     */
    static #validateKey(sessions, key) {
        const session = sessions.find(s => s.key == key);
        if (!session) return false;
        const now = new Date();
        if (session.expires < now) return false;
        return true;
    }

    /** Records the use of an invalid session key by IP
     * @param {express.Request} req - The express request object
     */
    static #invalidKeyUsed(req) {
        const address = req.clientIp;
        const currentCount = SessionManager.#badSessions.get(address) || 0;
        if (currentCount > SessionManager.#maxInvalidKeyUses) 
        logger.warn(`Bad Session - IP ${address} has failed to authenticate with ${currentCount} session keys.`);
        SessionManager.endSession();
        SessionManager.#badSessions.set(address, currentCount + 1);
        return null;
    }

}
