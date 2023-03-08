
import repo from "../../ark-id-repository/index.js";
import logger from "../../logger.js";

export default class BasicParser {

    /** Extracts and categorizes general settings from configuration files
     * @param {Object} gameObject - The converted game.ini configuration
     * @param {Object} userObject - The converted gameUserSettings.ini configuration
     */
    static parse(gameObject, userObject) {
        const configuration = {gameObject, userObject};
        const configProperties = repo.getAllConfigs(); 
        const general = {}, stats = {}, totals = [];
        for (const prop of configProperties) {
            if (!stats[prop.category]) stats[prop.category] = {total: 0, success: 0};
            stats[prop.category].total++;
            const result = BasicParser.#addProperty(configuration, prop, general);
            if (!result) {
                if (prop.required) throw new Error("Missing required property - " + prop.originalKey);
                continue;
            }
            stats[prop.category].success++;
        }
        for (const prop in stats) {
            const next = stats[prop];
            const percent = Math.floor(100 * next.success / next.total);
            totals.push({category: prop, percent})
        }
        return {generalConfig: general, generalStats: totals};
    }

    /** Appends a property to the parsed configuration object
     * @param {Object} config - The object representation of the configuration
     * @param {import("../../ark-id-repository/index.js").Configuration} prop 
     * @param {Object} parsedObject - The object to append the property to
     * @returns {Boolean} - True if the property was properly extracted from the config
     */
    static #addProperty(config, prop, parsedObject) {
        try {
            if (!parsedObject[prop.category]) parsedObject[prop.category] = {}
            const category = parsedObject[prop.category];
            const key = prop.definedKey || prop.originalKey;
            const value = config?.[prop.parent]?.[prop.originalKey] || prop.default;
            if (value == undefined) return false;
            category[key] = value;
            return true;
        } catch (err) { logger.error(err); }
        return false;
    }

    /** Creates an array of properties with full details
     * @param {Object} generalConfig - The general configuration object
     */
    static generateDetails(generalConfig) {
        const properties = [];
        for (const category in generalConfig) for (const key in generalConfig[category]) {
            const value = generalConfig[category][key];
            let config = repo.getConfig("definedKey", key);
            if (!config) config = repo.getConfig("originalKey", key);
            if (!config) continue;
            properties.push({
                key, value,
                category: config.category,
                label: config.label,
                type: config.type,
                description: `${config.originalKey} - ${config.description}`
            });
        }
        return {properties};
    }

}