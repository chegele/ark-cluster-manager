
const route = "/api-v1/cluster/:id?";

import express from "express";
import sessionManager from "../../services/session-manager.js";
import rateLimiter from "../../services/rate-limiter.js";
import database from "../../services/database/database.js";
import * as types from "../../services/database/typedef.js";

export default class ClusterRoute {
    static route = route;

    /** Retrieves the cluster by the provided id
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async get(req, res) {

        // Validate that the required properties are in the request body
        const result = {errors: []};
        if (req.params.id) req.body.id = req.params.id;
        const requiredProperties = ["id"];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body or url.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Attempt to retrieve the cluster from the database
        /** @type {types.Cluster} */ let cluster;
        try {
            const id = req.body.id;
            cluster = await database.Cluster.findOne({_id: id}).select("-memberIds");
            if (!cluster) result.errors.push("A cluster with this id does not exist.");
        } catch(err) {
            if (err.message.includes("Cast to ObjectId failed")) {
                result.errors.push("A cluster with this id does not exist.");
            } else {
                result.errors.push("Unexpected DB error - " + err.message);
            }
        }
        
        // Return the cluster
        if (result.errors.length > 0) return res.status(422).json(result);
        result.cluster = cluster;
        res.json(cluster); 
    }

    /** Creates a new cluster
     * @param {express.Request} req 
     * @param {express.Response} res  
     */
    static async post(req, res) {

        // Ensure the requester has not exceeded the rate limit
        const result = {errors: []};
        const cooldown = rateLimiter.limitRequest(req.hostname, "POST" + route, 6);
        if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
        if (result.errors.length > 0) return res.status(429).json(result);

        // Validate the user has an active session
        const session = await sessionManager.getSession(req);
        if (!session) result.errors.push("You must be logged in to create a new cluster.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Make sure the user has not exceeded the maximum clusters
        const maxClusters = 3;
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username: session});
        if (!profile) return res.status(403).json({errors: ["Failed to retrieve users profile."]});
        if (profile.ownedClusterIds.length >= maxClusters) result.errors.push("Exceeded the maximum aloud clusters.");
        if (result.errors.length > 0) return res.status(410).json(result);

        // Validate the request body and generate the cluster object
        const validationErrors = await verifyClusterCreatorOptions(req.body);
        if (validationErrors ) result.errors.push(...validationErrors);
        if (result.errors.length > 0) return res.status(400).json(result);

        // Generate, save, and return the results
        const clusterObject = buildClusterObject(session, req.body);
        result.cluster = new database.Cluster(clusterObject);
        profile.ownedClusterIds.push(result.cluster._id);
        await profile.save();
        await result.cluster.save();
        res.json(result);
    }

    /** Updates the cluster with the provided changes
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
        const session = await sessionManager.getSession(req);
        if (!session) result.errors.push("You must be logged in to modify a cluster.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Validate the user provided the required properties
        const requiredProperties = ["cluster"];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body or url.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Validate the cluster object meets the schema requirements
        const validationError = await new database.Cluster(req.body.cluster).validateSync();
        if (validationError) result.errors.push(validationError.message);
        if (result.errors.length > 0) return res.status(400).json(result);

        // Attempt to update the cluster
        try {
            const cluster = req.body.cluster;
            const query = {_id: cluster._id, owner: session}
            result.cluster = await database.Cluster.findOneAndUpdate(query, cluster, {upsert: false});
            if (!result.cluster) throw new Error("No matching cluster to update.");
        } catch(err) {
            result.errors.push("Failed to update the cluster - " + err.message);
        }

        // Return the updated cluster
        if (result.errors.length > 0) return res.status(400).json(result);
        res.json(result);
    }

    /** Deactivates the cluster
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async delete(req, res) {

        // Ensure the requester has not exceeded the rate limit
        const result = {errors: []};
        const cooldown = rateLimiter.limitRequest(req.hostname, "DELETE" + route, 6);
        if (cooldown) result.errors.push(`Rate limited: ${cooldown} minutes`);
        if (result.errors.length > 0) return res.status(429).json(result);

        // Validate the user has an active session
        const session = await sessionManager.getSession(req);
        if (!session) result.errors.push("You must be logged in to create a new cluster.");
        if (result.errors.length > 0) return res.status(401).json(result);

        // Validate that the required properties are in the request body
        if (req.params.id) req.body.id = req.params.id;
        const requiredProperties = ["id"];
        for (const property of requiredProperties) {
            if (!req.body[property]) result.errors.push(`Missing ${property} in request body or url.`);
        }
        if (result.errors.length > 0) return res.status(400).json(result);

        // Remove the cluster id from the users profile
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username: session});
        if (!profile) return res.status(403).json({errors: ["Failed to retrieve users profile."]});
        const index = profile.ownedClusterIds.indexOf(req.body.id.toString());
        if (index == -1)  result.errors.push("Cluster does not exist in users profile.");
        else { profile.ownedClusterIds.splice(index, 1) }
        if (result.errors.length > 0) return res.status(410).json(result);
        try { await profile.save() } 
        catch (err) {
            logger.error(err);
            return res.status(556).json({errors: ["Failed to update the users profile."]});
        }

        // Attempt to delete the cluster
        try {
            const query = {_id: req.body.id, owner: session}
            const deleted = await database.Cluster.findOneAndDelete(query);
            if (!deleted) throw new Error("No matching cluster to delete.");
        } catch(err) {
                result.errors.push("Failed to delete the cluster - " + err.message);
        }

        // Return the result
        if (result.errors.length > 0) return res.status(400).json(result);
        res.json(result);
    }

}


/** Validates the user provided cluster creation options
 * @param {types.ClusterCreator} options - The options used to build a new cluster object
 * @returns {null | String[]} - Null or a String array of the errors encountered
 */
async function verifyClusterCreatorOptions(options) {

    // Validate that the required properties exist 
    const errors = [];
    const requiredProperties = ['name', 'pvp', 'platform', 'hostType', "configId"];
    for (const prop of requiredProperties) if (options[prop] == undefined) errors.push(
        `A required property is missing - ${prop}`
    );

    // Validate the required and optional properties are the correct type
    const allProperties = [ {key: "name", type: "string"}, 
        {key: "pvp", type: "boolean"}, {key: "platform", type: "string"}, {key: "hostType", type: "string"},
        {key: "configId", type: "string"}, {key: "description", type: "string"}, {key: "public", type: "boolean"},
        {key: "lastWipe", type: "string"}, {key: "nextWipe", type: "string"}, {key: "body", type: "string"},
        {key: "logo", type: "string"}
    ];
    for (const prop of allProperties) if (options[prop.key] !== undefined) {
        const type = typeof(options[prop.key]);
        if (type != prop.type) errors.push(`The ${prop.key} property is expected to be a ${prop.type}, not ${type}.`);
    }

    // Validate that none of the properties have an excessive length
    for (const prop of allProperties) if (options[prop] && prop.type == 'string') {
        const maxLength = prop.key == "body" ? 2000 : 100;
        const value = options[prop];
        if (value.length > maxLength) errors.push(`${options.name} has a limit of ${maxLength} characters.`);
    }

    // Check to see if options duplicate any current clusters in the database
    if (options.name) {
        const query = {"generalInformation.name": options.name};
        const exists = await database.Cluster.findOne(query);
        if (exists) errors.push(`A cluster with the name ${options.name} already exists.`);
    }

    // Validate ENUM strings are expected values
    const platforms = ['STEAM', 'PLAYSTATION', 'XBOX'];
    const hosts = ['NITRADO', 'SELF_HOSTED', 'OTHER'];
    if (!platforms.includes(options.platform)) errors.push("platform is expected to be one of " + platforms.join(", "));
    if (!hosts.includes(options.hostType)) errors.push("hostType is expected to be one of " + hosts.join(", "));

    if (errors.length > 0) return errors;
    return null;
}

/** Generates a new cluster object with the user provided options
 * @param {String} username - The username from the current session
 * @param {types.ClusterCreator} options - The options used to build a new cluster object
 * @returns {types.ClusterType}
 */
function buildClusterObject(username, options) {
    return {
        owner: username,
        active: true,
        created: new Date(),
        configId: options.configId || "",
        memberCount: 0,
        memberIds: [],
        generalInformation: {
            name: options.name,
            shortDescription: options.description || "",
            pvp: options.pvp,
            public: options.public === undefined ? true : options.public,
            version: "Ark 1.0",
            platform: options.platform,
            lastWipe: options.lastWipe || null,
            nextWipe: options.nextWipe || null,
            hostType: options.hostType,
        },
        homepage: {
            title: options.name,
            logo: options.logo,
            announcements: [],
            body: options.body || ""
        }
    }
}