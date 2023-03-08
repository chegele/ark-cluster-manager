
import fs from "fs/promises";
import LootTableParser from "./scripts/lootTableParser.js";
import GeneralParser from "./scripts/generalParser.js";
import ConfigConverter from "./scripts/configConverter.js";
import * as types from "../database/typedef.js";

export default class ArkConfigParser {

    static generalParser = GeneralParser;

    /** Reads the content of a configuration file and returns as a string.
     * @param {String} path - The path to the configuration file.
     * @returns {String} - The content of the configuration file.
     */
     static async readConfigFile(path) {
        if (!path) throw new Error("You must provide a path to the configuration file.");
        try {
            await fs.access(path);
            const file = await fs.readFile(path);
            const content = file.toString();
            if (!content || content == "") throw new Error("No content returned while reading the file.");
            return content;
        } catch(err) {
            let errorMessage = "Failed to read the configuration file.";
            errorMessage += "\n  Path: " + path + "\n  Error: " + err.message;
            throw new Error(errorMessage);
        }
    }

    /** Converts the provided configuration string into a JS object
     * @param {String} configString - The raw configuration string
     * @param {('game.ini' | 'gameUserSettings.ini')} type
     * @returns {Object} - The converted configuration object
     */
    static convertConfig(configString, type) {
        const type1Text = "[/script/shootergame.shootergamemode]";
        const type2Text = "[/Script/ShooterGame.ShooterGameUserSettings]";
        const badConfigError = "The provided configuration does not have the expected labels.";
        if (!configString || configString == "") throw new Error("You must provide a configuration string to parse.");
        if (type == "game.ini" && !configString.includes(type1Text)) throw new Error(badConfigError);
        if (type == "gameUserSettings.ini" && !configString.includes(type2Text)) throw new Error(badConfigError);
        const configObject = ConfigConverter.convertConfig(configString);
        if (Object.keys(configObject).length < 1) throw new Error("Failed to parse any properties from the configuration.");
        return configObject;
    }

    /** Extracts an structured the fields of interests from configuration objects
     * @param {Object} gameIniObject - The object representation of a game.ini file
     * @param {Object} gameUserObject - The object representation of a gameUserSettings.ini file
     */
    static parseObjects(gameIniObject, gameUserObject) {
        if (!gameIniObject || !gameUserObject) throw new Error("You must provide both configuration files.");
        if (Object.keys(gameIniObject).length < 1) throw new Error("The game.ini config object has no properties.");
        if (Object.keys(gameUserObject).length < 1) throw new Error("The gameUserSettings.ini object has no properties.");
        const result = {config: {}, stats: []};
        const {generalConfig, generalStats} = GeneralParser.parse(gameIniObject, gameUserObject);
        result.config.general = generalConfig;
        result.config.lootTables = LootTableParser.parse(gameIniObject.configOverrideSupplyCrateItems);
        // Decided to skip this for the first iteration
        // Need to do lootTable stats
        // Stats need to be modified so show percent of users lines that were extracted
        // Currently it shows percent of known configs that existed in users config

         //TODO: These are not converting properly
        /* PerLevelStatsMultiplier_DinoTamed[0]=3
            PerLevelStatsMultiplier_DinoTamed[1]=5
            PerLevelStatsMultiplier_DinoTamed[3]=75
            PerLevelStatsMultiplier_DinoTamed[7]=15
            PerLevelStatsMultiplier_DinoTamed[8]=2.5
            PerLevelStatsMultiplier_Player[0]=3
            PerLevelStatsMultiplier_Player[1]=5
            PerLevelStatsMultiplier_Player[3]=5
            PerLevelStatsMultiplier_Player[7]=15
            PerLevelStatsMultiplier_Player[8]=5
            PerLevelStatsMultiplier_Player[9]=3
            PerLevelStatsMultiplier_Player[10]=7
            PerLevelStatsMultiplier_Player[11]=5
        */
        result.stats.push(...generalStats);
        return result;
    }

    /** Extracts and structures the fields of interest from the configuration files
     * @param {String} gameIniPath - The full path to the game.ini configuration file
     * @param {String} gameUserPath - The full path to the gameUserSettings.ini file
     * @returns {types.parsedConfig} - The parsed configuration objects
     */
    static async parseFiles(gameIniPath, gameUserPath) {
        if (!gameIniPath || !gameUserPath) throw new Error("You must provide a path to both configuration files.");
        const gameIniString = await ArkConfigParser.readConfigFile(gameIniPath);
        const gameUserString = await ArkConfigParser.readConfigFile(gameUserPath);
        const gameIniObject = ArkConfigParser.convertConfig(gameIniString, 'game.ini');
        const gameUserObject = ArkConfigParser.convertConfig(gameUserString, 'gameUserSettings.ini');
        const parsedConfig = ArkConfigParser.parseObjects(gameIniObject, gameUserObject);
        return parsedConfig;
    }

}