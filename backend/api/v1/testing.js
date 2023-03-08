
//TODO: Update the route and param
const route = "/api-v1/testing";

import express from "express";
import logger from "../../services/logger.js";
import limiter from "../../services/rate-limiter.js";
import SessionManager from "../../services/session-manager.js";
import database from "../../services/database/database.js";
import verifyEmail from "../../services/email-validator.js";
import fileManager from "../../services/file-manager.js";
import configParser from "../../services/config-parser/index.js";

//TODO: Change the class name
export default class ClassNameHere {
    static route = route;

    /** //TODO: Describe what get does
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static async get(req, res) {
        logger.info("(get) " + route);
        res.send("done");
    }

    /** //TODO: Describe what post does
     * @param {express.Request} req 
     * @param {express.Response} res  
     */
    static post(req, res) {
        logger.info("(post) " + route);
        res.send("done");
    }

    /** //TODO: Describe what put does
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static put(req, res) {
        logger.info("(put) " + route);
        res.send("done");
    }

    /** //TODO: Describe what delete does
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    static delete(req, res) {
        logger.info("(delete) " + route);
        res.send("done");
    }

}