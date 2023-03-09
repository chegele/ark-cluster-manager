
import express from "express";
import mongoose from "mongoose";
import sanitize from "mongo-sanitize";
import logger from "./logger.js";

export default class CustomMiddleware {

    /** 
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @param {express.NextFunction} next
     */
    static setClientIp(req, res, next) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.hostname;
        req.clientIp = ip;
        next();
    }

    /** 
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @param {express.NextFunction} next
     */
    static logRequest(req, res, next) {
        const method = req.method;
        const route = req.path;
        const ip = req.clientIp;
        logger.info(`${ip} : (${method}) ${route}`);
        next();
    }

    /** 
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @param {express.NextFunction} next
     */
    static sanitizeBody(req, res, next) {
        if (!req.body) next();
        req.body = sanitize(req.body);
        next();
    }

    /** 
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @param {express.NextFunction} next
     */
     static headerMethod(req, res, next) {
        const headerMethod = req.headers?.method;
        if (req.method == "PUT" && headerMethod) {
            req.method = headerMethod.toUpperCase();
        }
        next();
    }

    /** 
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @param {express.NextFunction} next
     */
    static idValidation(req, res, next) {
        let id = req.body.id;
        if (id !== undefined) {
            const ObjectId = mongoose.Types.ObjectId;
            if (id.length != 24) id = id.padStart(24, "0");
            if (!ObjectId.isValid(id)) {
                const result = {errors: ['Invalid id provided, expected a 24 character long hex string.']};
                return res.status(400).json(result);
            }
            req.body.id = new ObjectId(id);
        }
        next();
    }
}