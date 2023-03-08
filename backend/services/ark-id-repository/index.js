
/** 
 * @typedef {Object} Container
 * @property {String} map
 * @property {String} name
 * @property {String} containerId
 * @property {String} image
 */

/** 
 * @typedef {Object} Creature
 * @property {String} name
 * @property {String} link
 * @property {String} image
 * @property {String} category
 * @property {String} tag
 * @property {String} entityId
 * @property {String} blueprint
 */

/** 
 * @typedef {Object} Item
 * @property {String} name
 * @property {String} link
 * @property {String} image
 * @property {String} category
 * @property {String} stackSize
 * @property {String} itemId
 * @property {String} class
 * @property {String} blueprint
 */

/**
 * @typedef {Object} Configuration
 * @property {('gameObject' | 'userObject')} parent
 * @property {String} originalKey
 * @property {String} definedKey
 * @property {String} type
 * @property {String} category
 * @property {Boolean} required
 * @property {*} default
 * @property {String} label
 * @property {String} description
 */

/** @type {Configuration[]} */ const configurations = [];
/** @type {Container[]}*/ import containers from "./local-database/containers.json" assert { type: 'json' };
/** @type {Creature[]}*/ import creatures from "./local-database/creatures.json" assert { type: 'json' };
/** @type {Item[]}*/ import items from "./local-database/items.json" assert { type: 'json' };

const configPath = "./local-database/configs/";
import admin from "./local-database/configs/administration.json" assert { type: "json" };
import breeding from "./local-database/configs/breeding.json" assert { type: "json" };
import cluster from "./local-database/configs/cluster.json" assert { type: "json" };
import consumption from "./local-database/configs/consumption.json" assert { type: "json" };
import confCreatures from "./local-database/configs/creatures.json" assert { type: "json" };
import engrams from "./local-database/configs/engrams.json" assert { type: "json" };
import environment from "./local-database/configs/environment.json" assert { type: "json" };
import equipment from "./local-database/configs/equipment.json" assert { type: "json" };
import looting from "./local-database/configs/looting.json" assert { type: "json" };
import other from "./local-database/configs/other.json" assert { type: "json" };
import players from "./local-database/configs/players.json" assert { type: "json" };
import pvevp from "./local-database/configs/pvevp.json" assert { type: "json" };
import structures from "./local-database/configs/structures.json" assert { type: "json" };
import tribes from "./local-database/configs/tribes.json" assert { type: "json" };
const configs = [admin, breeding, cluster, consumption, confCreatures, engrams, 
    environment, equipment, looting, other, players, pvevp, structures, tribes];
for (const config of configs) configurations.push(...config);


export default class ArkIdRepository {

    static getContainer(property, value) {
        ArkIdRepository.#validate(property, value);
        for (const container of containers) {
            if (container[property] == value)
            return container;
        }
        return {
            "map": "Unknown",
            "name": "Container: " + value,
            "containerId": value,
            "image": "https://ark.wiki.gg/images/thumb/5/52/White_Beacon.png/228px-White_Beacon.png"
        };
    }

    static getAllContainers(property, value) {
        if (property == undefined || value == undefined) return containers;
        const matches = [];
        for (const container of containers) {
            const propValue = container[property]?.toLowerCase();
            value = value?.toLowerCase();
            if (propValue.includes(value))
            matches.push(container);
        }
        return matches;
    }

    static getCreature(property, value) {
        ArkIdRepository.#validate(property, value);
        for (const creature of creatures) {
            if (creature[property] == value)
            return creature;
        }
        return null;
    }

    static getAllCreatures(property, value) {
        if (property == undefined || value == undefined) return creatures;
        const matches = [];
        for (const creature of creatures) {
            const propValue = creature[property]?.toLowerCase();
            value = value?.toLowerCase();
            if (propValue.includes(value))
            matches.push(creature);
        }
        return matches;
    }

    static getItem(property, value) {
        ArkIdRepository.#validate(property, value);
        for (const item of items) {
            if (item[property] == value)
            return item;
        }
        return null;
    }

    static getAllItems(property, value) {
        if (property == undefined || value == undefined) return items;
        const matches = [];
        for (const item of items) {
            const propValue = item[property]?.toLowerCase();
            value = value?.toLowerCase();
            if (propValue.includes(value))
            matches.push(item);
        }
        return matches;
    }

    static getConfig(property, value) {
        ArkIdRepository.#validate(property, value);
        for (const config of configurations) {
            if (config[property] == value)
            return config;
        }
        return null;
    }

    static getAllConfigs(property, value) {
        if (property == undefined || value == undefined) return configurations;
        const matches = [];
        for (const config of configurations) {
            const propValue = config[property]?.toLowerCase();
            value = value?.toLowerCase();
            if (propValue.includes(value))
            matches.push(config);
        }
        return matches;
    }

    static #validate(property, value) {
        if (property == undefined) throw new Error("You must provide a property to check.");
        if (value == undefined) throw new Error("You must provide a value to match against.");
        return true;
    }

}