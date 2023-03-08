
const route = "/api-v1/cluster-membership/";

import express from "express";
import util from "../../services/utility.js";
import sessionManager from "../../services/session-manager.js";
import database from "../../services/database/database.js";
import * as types from "../../services/database/typedef.js";

export default class ClusterMembershipRoute {
    static route = route;

    /** Adds a user as a member of a cluster
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async put(req, res) {

        // Ensure the user is logged in, not rate limited, and provided required props
        const result = {errors: []};
        const requiredProperties = ["id"];
        if (util.rateLimited(req, res, "DELETE", route, 5)) return;
        if (await util.notLoggedIn(req, res)) return;
        if (util.missingRequiredProperties(req, res, requiredProperties)) return;

        // Retrieve the user and cluster from the database
        const username = await sessionManager.getSession(req);
        /** @type {types.Cluster} */
        const cluster = await database.Cluster.findById(req.body.id);
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username});
        if (!cluster) result.errors.push("Failed to identify a cluster with the provided id.");
        if (!profile) result.errors.push("Failed to retrieve the users profile from the database.");
        if (result.errors.length > 0) res.status(422).json(result);

        // Ensure the user is not already a member of the cluster
        if (profile.membershipClusterIds.includes(cluster._id) || cluster.memberIds.includes(profile._id)) {
            result.errors.push("User is already a member of this cluster.");
            return res.status(409).json(result);
        } 

        // Update the user and cluster details
        try {
            profile.membershipClusterIds.push(cluster._id);
            cluster.memberCount++;
            cluster.memberIds.push(profile._id);
            await Promise.all([ profile.save(), cluster.save() ]);
        } catch (err) {
            result.errors.push("Failed to save the changes to the database.");
            return res.status(500).json(result);
        }

        // Return the success
        res.json(result);
    }

    /** Removes a user from being a member of a cluster
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async delete(req, res) {

        // Ensure the user is logged in, not rate limited, and provided required props
        const result = {errors: []};
        const requiredProperties = ["id"];
        if (util.rateLimited(req, res, "DELETE", route, 5)) return;
        if (await util.notLoggedIn(req, res)) return;
        if (util.missingRequiredProperties(req, res, requiredProperties)) return;

        // Retrieve the user and cluster from the database
        const username = await sessionManager.getSession(req);
        /** @type {types.Cluster} */
        const cluster = await database.Cluster.findById(req.body.id);
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username});
        if (!cluster) result.errors.push("Failed to identify a cluster with the provided id.");
        if (!profile) result.errors.push("Failed to retrieve the users profile from the database.");
        if (result.errors.length > 0) res.status(422).json(result);

        // Ensure the user is not already a member of the cluster
        if (!profile.membershipClusterIds.includes(cluster._id) && !cluster.memberIds.includes(profile._id)) {
            result.errors.push("User is not a member of this cluster.");
            return res.status(409).json(result);
        } 

        // Update the user and cluster details
        try {
            const profileIndex = profile.membershipClusterIds.indexOf(cluster._id);
            const clusterIndex = cluster.memberIds.indexOf(profile._id);
            profile.membershipClusterIds.splice(profileIndex, 1);
            cluster.memberIds.splice(clusterIndex, 1);
            cluster.memberCount--;
            await Promise.all([ profile.save(), cluster.save() ]);
        } catch (err) {
            result.errors.push("Failed to save the changes to the database.");
            return res.status(500).json(result);
        }

        // Return the success
        res.json(result);

    }
}