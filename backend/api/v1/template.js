
//TODO: Update the route and param
const route = "/api-v1/template/:param?";

import express from "express";
import logger from "../../services/logger.js";
import database from "../../services/database/database.js";

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