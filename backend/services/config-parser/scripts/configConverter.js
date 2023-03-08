
/** @typedef {"string" | "number" | "boolean" | "object" | "itemArray" | "objectArray"} SettingsTypes */

/** @typedef {Object} ConfigSetting
 * @property {String} key
 * @property {String} value
 * @property {String} remainder
 */

export default class ConfigConverter {

    static TRUTHY = ["true", "t", "yes", "y"];
    static FALSY = ["false", "f", "no", "n"];

    /** Converts the provided configuration string into a javascript object
     * @param {String} configString - The string representation of the configuration file 
     * @returns {Object}
     */
    static convertConfig(configString) {
        const config = {};
        const lines = configString.split(/\r\n|\n|\r/);
        for (const line of lines) {
            const next = ConfigConverter.#extractNextSetting(line, "=", ",");
            if (!next) continue;
            let type = ConfigConverter.#settingType(next.value);
            if (type == "object") {
                if (config[next.key] && !Array.isArray(config[next.key])) config[next.key] = [config[next.key]];
                const parsedObject = ConfigConverter.#parseConfigObject(next.value);
                config[next.key] ? config[next.key].push(parsedObject) : config[next.key] = parsedObject;
            }
            if (type == "objectArray") config[next.key] = ConfigConverter.#parseObjectArray(next.value);
            if (type == "itemArray") config[next.key] = ConfigConverter.#parseItemArray(next.value, ",");
            if (type == "number") config[next.key] = ConfigConverter.#parseNumber(next.value);
            if (type == "boolean") config[next.key] = ConfigConverter.#parseBoolean(next.value);
            if (type == "string") config[next.key] = ConfigConverter.#parseString(next.value);
        }
        return config;
    }

    /** Parses and formats a Settings Configuration object into a JS object
     * @param {String} content - The String content to be parsed
     * @returns {Object}
     */
    static #parseConfigObject(content) {
        const config = {};
        while (true) {
            const next = ConfigConverter.#extractNextSetting(content, "=", ",");
            if (!next) break;
            let type = ConfigConverter.#settingType(next.value);
            if (type == "object") type = ConfigConverter.#objectType(next.value);
            //console.log(next.key + "(" + type + ") :" + next.value);
            if (type == "object" && config[next.key]) {
                if (!Array.isArray(config[next.key])) config[next.key] = [config[next.key]];
                config[next.key].push(ConfigConverter.#parseConfigObject(next.value));
            } else if (type == "object") config[next.key] = ConfigConverter.#parseConfigObject(next.value);
            if (type == "objectArray") config[next.key] = ConfigConverter.#parseObjectArray(next.value);
            if (type == "itemArray") config[next.key] = ConfigConverter.#parseItemArray(next.value, ",");
            if (type == "number") config[next.key] = ConfigConverter.#parseNumber(next.value);
            if (type == "boolean") config[next.key] = ConfigConverter.#parseBoolean(next.value);
            if (type == "string") config[next.key] = ConfigConverter.#parseString(next.value);
            content = next.remainder;
        }
        return config;
    }

    /** Parses and formats a objectArray configuration value
     * @param {String} objectArray 
     * @returns {Object}
     */
    static #parseObjectArray(objectArray) {
        objectArray = objectArray.slice(1, -1);
        let parsedObjects = [];
        while (true) {
            const next = ConfigConverter.#extractBlock(objectArray, "(", ")");
            if (!next) break;
            parsedObjects.push(ConfigConverter.#parseConfigObject(next.block));
            objectArray = next.remainder;
        }
        return parsedObjects;
    }

    /** Parses and formats an itemArray configuration value
     * @param {String} itemArray 
     * @param {String} separator 
     * @returns {*[]}
     */
    static #parseItemArray(itemArray, separator) {
        itemArray = itemArray.replace(/\(|\)|"|\n */g, "")
        const parsedItems = [];
        for (let item of itemArray.split(separator)) {
            item.replace(separator, "");
            if (!item || item == "") continue
            let type = ConfigConverter.#settingType(item);
            if (type == "number") parsedItems.push(ConfigConverter.#parseNumber(item));
            if (type == "boolean") parsedItems.push(ConfigConverter.#parseBoolean(item));
            if (type == "string") parsedItems.push(ConfigConverter.#parseString(item));
        }
        return parsedItems;
    }

    /** Parses and formats a Number configuration value
     * @param {String} value - The value to parse as a number
     * @returns {Number}
     */
    static #parseNumber(value) {
        return parseFloat(value.replace(/,/g, ""));
    }
    
    /** Parses and formats a Boolean configuration value
     * @param {String} value -The value to parse as a boolean 
     * @returns {Boolean}
     */
    static #parseBoolean(value) {
        if (ConfigConverter.TRUTHY.includes(value)) return true;
        return false;
    }
    
    /** Parses and formats a String configuration value
     * @param {String} value - The value to parse as a string
     * @returns {String}
     */
    static #parseString(value) {
        return value.replace(/"/g, "").trim();
    }
    

    /** Gets the setting type of the provided value 
     * @param {String} value - The value to determine the type for
     * @returns {SettingsTypes}
     */
    static #settingType(value) {
        const numberPattern = /^\b\d[\d,.]*\b$/;
        value = value.toLowerCase();
        if (value.match(numberPattern)) return "number";
        if (ConfigConverter.TRUTHY.includes(value)) return "boolean";
        if (ConfigConverter.FALSY.includes(value)) return "boolean";
        if (value.startsWith("(")) return "object";
        return "string";
    }

    /** Gets the object type of the provided value
     * @param {String} content - The value to determine the type for
     * @returns {SettingsTypes}
     */
    static #objectType(content) {
        if (!content || content == "") throw new Error("You must provide content.");
        if (!content.startsWith("(") || !content.endsWith(")")) throw new Error("The content does not appear to be an array");
        if (content.startsWith("((") && content.endsWith("))")) return "objectArray";
        if (!content.includes("=")) return "itemArray";
        return "object";
    }

    /** Extracts the first configuration setting in a string and returns the key, value, and remainder
     * @param {String} content - The content to extract the configuration setting from
     * @param {String} delimiter - The symbol separating a setting key from the value 
     * @param {String} separator - The symbol representing the end of a key value pair
     * @return {ConfigSetting} - The key, value, and remainder
     */
    static #extractNextSetting(content, delimiter, separator) {
        if (content == "") return null;
        if (!content || content == undefined) throw new Error("You must provide content.");
        if (!delimiter || delimiter == "") throw new Error("You must provide a delimiter which separates the key and value.");
        if (!separator || separator == "") throw new Error("You must provide a separator which represents the end of a setting."); 
        if (!content.includes(delimiter)) return null;
        content = content.replace("[", "").replace("]", "");
        const keyPattern = new RegExp("\\w*" + delimiter);
        const key = content.match(keyPattern)?.[0].replace(delimiter, "");
        const keyIndex = content.indexOf(key);
        const valueStartIndex = keyIndex + key.length + delimiter.length;
        let value = content.substring(valueStartIndex);
        if (value.startsWith("(")) {
            const block = ConfigConverter.#extractBlock(value, "(", ")");
            value = block.block;
        } else {
            const valuePattern = new RegExp("[^\)" + separator + "]*");
            value = value.match(valuePattern)?.[0];
        }
        let remainderIndex = content.indexOf(value) + value.length;
        if (content.includes) remainderIndex+= separator.length;
        const remainder = content.substring(remainderIndex);
        return {
            key: key[0]?.toLowerCase() + key.slice(1), 
            value, 
            remainder
        };
    }

    /** Extracts the first configuration block in a string and returns the block and remainder
     * @param {String} contentBlock - The content to extract the content block from
     * @param {String} openingSymbol - The symbol the represents the beginning of a content block
     * @param {String} closingSymbol - The symbol the represents the end of a content block
     */
    static #extractBlock(contentBlock, openingSymbol, closingSymbol) {
        if (!openingSymbol || openingSymbol == "") throw new Error("You must provide an opening symbol.");
        if (!closingSymbol || closingSymbol == "") throw new Error("You must provide a closing symbol.");
        if (!contentBlock || contentBlock == "") return;
        if (!contentBlock.includes(openingSymbol)) return;
        if (!contentBlock.includes(closingSymbol)) return;
        let firstFound = false;
        let symbols = 0;
        const startIndex = contentBlock.indexOf(openingSymbol);
        let endIndex = 0;
        for(let i=startIndex; endIndex==0; i++) {
            if (i > contentBlock.length) throw new Error("Reached end of content before closing symbol.");
            let c = contentBlock[i];
            if (c == openingSymbol && !firstFound) firstFound = true;
            if (c == openingSymbol) symbols++;
            if (c == closingSymbol) symbols--;
            if (symbols == 0 && firstFound) endIndex = i;
        }
        const beginning = contentBlock.substring(0, startIndex);
        const middle = contentBlock.substring(startIndex, endIndex+1);
        const end = contentBlock.substring(endIndex+1);
        return {
            block: middle,
            remainder: beginning + end
        }
    }

}