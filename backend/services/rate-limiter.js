
import logger from "./logger.js";
import NodeCache from "node-cache";

const cooldownIncrement = 5;

/** @type {NodeCache.Options} */
const requestCacheOptions = {
    stdTTL: 60 * 5, // Track requests within a 5 minute window
    checkperiod: 60, // Check to clear expired trackers every minute
}

/** @type {NodeCache.Options} */
const cooldownCacheOptions = {
    stdTTL: 60 * cooldownIncrement, // Reduce the cooldown at the increment rate
    checkperiod: 60 * (cooldownIncrement/3), // Check to reduce offenses every 1/3rd increment
    deleteOnExpire: false, // Prevents deletion to allow custom handling
}

export default class RateLimiter {

    static #expiredEventAdded = false;
    static #requestTracker = new NodeCache(requestCacheOptions);
    static #blacklist = new NodeCache(cooldownCacheOptions);

    /** Adds an event handler to listen for expiring blacklisted ids */
    static #addExpirationHandler() {
        RateLimiter.#blacklist.on("expired", function(key, value) {
            if (value <= 1) return RateLimiter.#blacklist.del(key);
            return RateLimiter.#blacklist.set(key, value - cooldownIncrement);
        });
    }

    /** Records an offense and sets or doubles the cooldown
     * @param {String} limiterId - The identifier and route combined to create an id 
     */
    static #addToBlacklist(limiterId) {
        if (!RateLimiter.#expiredEventAdded) {
            RateLimiter.#addExpirationHandler();
            RateLimiter.#expiredEventAdded = true;
        }
        let cooldown = RateLimiter.#blacklist.get(limiterId);
        if (!cooldown) cooldown = cooldownIncrement; 
        else cooldown = cooldown * 2;
        RateLimiter.#blacklist.set(limiterId, cooldown);
        logger.warn(`Request threshold exceeded, rate limiting ${limiterId} for ${cooldown} minutes`);
    }

    /** Records the request and determines if there is a cooldown
     * @param {String} identifier - The identifier for this request, like username or IP
     * @param {String} route - The route which request count is being tracked for
     * @param {Number} maxRequests - The maximum number of requests to this route in 5 minutes
     * @returns {Number} cooldown - The number in seconds remaining on the cooldown, or 0
     */
    static limitRequest(identifier, route, maxRequests) {
        if (!identifier) throw new Error("You must provide an identifier for tracking the requests.");
        if (!route) throw new Error("You must provide a route to track the requests.");
        if (!maxRequests) throw new Error("You must provide maxRequests for accessing this route.");
        const limiterId = `${identifier} TO ${route}`;
        let requestCount = RateLimiter.#requestTracker.get(limiterId);
        const ttl = RateLimiter.#requestTracker.getTtl(limiterId);
        if (!requestCount) requestCount = 0;
        if (++requestCount > maxRequests) {
            RateLimiter.#addToBlacklist(limiterId);
            requestCount = 0; 
        }
        RateLimiter.#requestTracker.set(limiterId, requestCount, ttl);
        let cooldown = RateLimiter.#blacklist.get(limiterId);
        if (!cooldown) cooldown = 0;
        return cooldown;
    }

}
