
const route = "/api-v1/config/:id?";

import express from "express";
import * as fileType from "istextorbinary";
import util from "../../services/utility.js";
import logger from "../../services/logger.js";
import fileManager from "../../services/file-manager.js";
import sessionManager from "../../services/session-manager.js";
import database from "../../services/database/database.js";
import configParser from "../../services/config-parser/index.js";
import * as types from "../../services/database/typedef.js";

const categories = {
    file: {
        properties: ['_id', 'owner', 'uploaded', 'name', 'description']
    },
    general: {
        name: "general",
        collection: database.ConfigGeneral,
        transform: configParser.generalParser.generateDetails
    },
    lootTables: {
        name: "lootTables",
        collection: database.ConfigLoot,
        transform: null
    }
}

export default class ConfigRoute {
    static route = route;


    /** Retrieves a specified section of a parsed configuration
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async get(req, res) {

        // Ensure the user is not rate limited and provided the required props
        const result = {errors: []};
        const requiredProperties = ["id", "category"];
        if (util.rateLimited(req, res, "GET", route, 25)) return;
        if (util.missingRequiredProperties(req, res, requiredProperties)) return;

        // Validate the user provided a valid category name
        const category = categories[req.body.category];
        if (category == undefined) result.errors.push(`${req.body.category} is not a valid config category.`);
        if (result.errors.length > 0) return res.status(400).json(result);

        // Attempt to retrieve the base configuration object
        /** @type {types.ConfigFile} */
        const configFile = await database.ConfigFile.findOne({_id: req.body.id});
        if (!configFile) result.errors.push("Unable to identify a configuration with the id " + req.body.id);
        if (result.errors.length > 0) return res.status(422).json(result);

        // If user is requesting the file, validate owner and return details
        if (category == categories.file) {
            //TODO: Disabled ownership verification for retrieving cluster summary
            // if (await util.notLoggedIn(req, res, configFile.owner)) return;
            result.file = {};
            for (const prop of category.properties) result.file[prop] = configFile[prop];
            return res.json(result);
        }

        // Attempt to extract the category id from the configFile object
        const configId = configFile.parsed[category.name];
        if (!configId) {
            result.config = {}
            return res.json(result);
        }

        // Attempt to retrieve the config section
        const config = await category.collection.findOne({_id: configId});
        if (!config) result.errors.push("Failed to retrieve the configuration category from the database.");
        if (result.errors.length > 0) return res.status(422).json(result);

        // Perform retrieval time transformation and return the config
        result.config = category.transform ? category.transform(config) : config;
        return res.json(result);
    }


    /** Creates a new game configuration for use with cluster pages
     * @param {express.Request} req 
     * @param {express.Response} res  
     */
    static async post(req, res) {

        // Ensure the user is logged in, not rate limited, and provided required props
        console.log("1");
        const result = {errors: []};
        const requiredProperties = ["name", "description"];
        if (util.rateLimited(req, res, "POST", route, 5)) return;
        if (await util.notLoggedIn(req, res)) return;
        if (util.missingRequiredProperties(req, res, requiredProperties)) return;

        // Make sure the user has not exceeded that maximum number of configurations
        console.log("2");
        const maxConfigs = 3;
        const session = await sessionManager.getSession(req);
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username: session});
        if (!profile) result.errors.push("Failed to load user profile.");
        if (profile.configurations.length >= maxConfigs) result.errors.push(`User is only allowed ${maxConfigs} configurations.`);
        if (result.errors.length > 0) return res.status(410).json(result);

        // Validate files are uploaded
        console.log("3");
        const requiredFiles = ["game", "gameUserSettings"];
        for (const file of requiredFiles) if (!req.files?.[file]) result.errors.push(`Missing the ${file} file.`);
        if (result.errors.length > 0) return res.status(400).json(result);

        // Validate the files are text based
        console.log("4");
        const gameIniData = req.files.game.data;
        const gameUserData = req.files.gameUserSettings.data;
        if (fileType.isBinary(null, gameIniData)) result.errors.push("The game.ini file has invalid content.");
        if (fileType.isBinary(null, gameUserData)) result.errors.push("The gameUserSettings.ini file has invalid content.");
        if (result.errors.length > 0) return res.status(422).json(result);

        // Generate the tracking document and validate the user does not have the name already in use
        console.log("5");
        const owner = await sessionManager.getSession(req);
        const inUse = await database.ConfigFile.findOne({owner, name: req.body.name});
        if (inUse) return res.status(409).json({errors: ["A configuration with this name already exists."]});
        const configDocument = new database.ConfigFile({
            owner,
            name: req.body.name,
            uploaded: new Date(),
            description: req.body.description,
            rawGameIni: { awsBucket: "ark-cluster-raw-configs" },
            rawGameUser: { awsBucket: "ark-cluster-raw-configs" },
            parsedGameIni: { awsBucket: "ark-cluster-json-configs" },
            parsedGameUser: { awsBucket: "ark-cluster-json-configs" },
            parsed: {}
        });

        // Attempt to convert the configuration files
        console.log("6");
        let rawGameIni, parsedGameIni, rawGameUser, parsedGameUser;
        let halfPoint = false;
        try {
            rawGameIni = gameIniData.toString();
            parsedGameIni = configParser.convertConfig(rawGameIni, "game.ini");
            halfPoint = true;
            rawGameUser = gameUserData.toString();
            parsedGameUser = configParser.convertConfig(rawGameUser, "gameUserSettings.ini");
        } catch(err) {
            const file = halfPoint ? "gameUserSettings.ini" : "game.ini";
            logger.warn(`Failed to parse a ${file} - ` + err.stack);
            result.errors.push(`Failed to parse the ${file} configuration.`); 
            return res.status(422).json(result);
        }

        // Save the sectioned configurations to the database
        console.log("7");
        const parsed = configParser.parseObjects(parsedGameIni, parsedGameUser);
        const sections = [
            {name:"general", model: database.ConfigGeneral, config: parsed.config.general},
            {name:"lootTables", model: database.ConfigLoot, config: parsed.config.lootTables},
        ];
        for (const section of sections) try {
            const document = new section.model(section.config);
            document.parent = configDocument._id;
            configDocument.parsed[section.name] = document._id;
            await document.save();
        } catch (err) {
            logger.error(err);
            return res.status(555).json({errors: ["Failed to save the parsed configuration."]});
        }

        // Upload the configuration files to AWS S3
        console.log("8");
        const files = [
            {directory: "ark-cluster-raw-configs", name: `game/${configDocument._id}.ini`, data: rawGameIni},
            {directory: "ark-cluster-raw-configs", name: `user/${configDocument._id}.ini`, data: rawGameUser},
            {directory: "ark-cluster-json-configs", name: `game/${configDocument._id}.json`, data: parsedGameIni},
            {directory: "ark-cluster-json-configs", name: `user/${configDocument._id}.json`, data: parsedGameUser}
        ];
        for (const file of files) await fileManager.create(file.directory, file.name, file.data);
        configDocument.rawGameIni.fileName = `game/${configDocument._id}.ini`;
        configDocument.rawGameUser.fileName = `user/${configDocument._id}.ini`;
        configDocument.parsedGameIni.fileName = `game/${configDocument._id}.json`;
        configDocument.parsedGameUser.fileName = `user/${configDocument._id}.json`;

        // Save the ConfigFile to the database
        console.log("9");
        try {
            await configDocument.save();
        } catch (err) {
            logger.error(err);
            return res.status(556).json({errors: ["Failed to save the config document to the database."]});
        }

        // Update the user profile with the new config
        console.log("10");
        profile.configurations.push(configDocument._id);
        try {
            await profile.save();
        } catch (err) {
            logger.error(err);
            return res.status(556).json({errors: ["Failed to update the users profile."]});
        }
        
        // Return the parsing stats
        console.log("11");
        res.json({id: configDocument._id, stats: parsed.stats});
    }


    /** Deletes the raw and parsed game configuration files
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

        // Retrieve the configFile object from the database
        /** @type {types.ConfigFile} */
        const configFile = await database.ConfigFile.findById(req.body.id);
        if (!configFile) result.errors.push("Unable to identify a configuration file with the id " + req.body.id);
        if (result.errors.length > 0) return res.status(422).json(result);

        // Validate that the configuration is not in use by a cluster
        const cluster = await database.Cluster.findOne({ configId: configFile._id });
        if (cluster) result.errors.push("This configuration is still in use by " + cluster._id);
        if (result.errors.length > 0) return res.status(409).json(result);

        // Remove the profile form the users configuration
        if (await util.notLoggedIn(req, res, configFile.owner)) return;
        /** @type {types.Profile} */
        const profile = await database.Profile.findOne({username: configFile.owner});
        if (!profile) result.errors.push("Failed to load user profile.");
        const index = profile.configurations.indexOf(configFile._id.toString());
        if (index == -1)  result.errors.push("Configuration does not exist in users profile.");
        else { profile.configurations.splice(index, 1) }
        if (result.errors.length > 0) return res.status(410).json(result);
        try { await profile.save() } 
        catch (err) {
            logger.error(err);
            return res.status(556).json({errors: ["Failed to update the users profile."]});
        }

        // Attempt to delete the db config categories
        for (const prop in categories) try {
            const category = categories[prop];
            const id = configFile.parsed[category.name];
            if (!id) continue;
            await category.collection.findByIdAndDelete(id);
        } catch (err) {
            logger.error(`Failed to delete the ${category.name} category for ${req.body.id} \n ${err.stack}`);
            result.errors.push(`Failed to delete the ${category.name} category for ${req.body.id}`);
            res.status(199);
        }

        // Attempt to delete the AWS config files
        const files = [configFile.rawGameIni, configFile.parsedGameIni, configFile.rawGameUser, configFile.parsedGameUser];
        for (const file of files) try {
            const success = await fileManager.delete(file.awsBucket, file.fileName);
            if (!success) throw new Error("Failed to delete the aws s3 file.");
        } catch (err) {
            logger.error(`Failed to delete the ${category.name} category for ${req.body.id} \n ${err.stack}`);
            result.errors.push(`Failed to delete the ${category.name} category for ${req.body.id}`);
            res.status(199);
        }

        // Delete the configuration file
        try {
            await configFile.delete();
        } catch (err) {
            logger.error(`Failed to delete the primary config for ${req.body.id} \n ${err.stack}`);
            result.errors.push(`Failed to delete the primary config for ${req.body.id}`);
            res.status(500);
        }

        // Return the results, reporting any errors
        res.json(result);
    }

}