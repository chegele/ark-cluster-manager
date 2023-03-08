
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/

import crypto from "crypto";
import fs from "fs/promises";
import SES from "@aws-sdk/client-ses";
import logger from "./logger.js";
import database from "./database/database.js";

const SESClient = SES.SESClient;
const SendTemplatedEmailCommand = SES.SendTemplatedEmailCommand;
const UpdateTemplateCommand = SES.UpdateTemplateCommand;

export default class EmailValidator {

    static #emailDomain = "brealms.com";
    static #keyExpirationTime = 1000 * 60 * 60 * 2;
    static #emailClient = new SESClient();

    /** Initiates the email verification process by generating a key and send it to the address.
     * @param {String} username - The name to address the user by in the email
     * @param {String} email - The email address being verified
     * @returns {Boolean} True if the verification request was sent
     */
    static async requestEmailVerification(username, email) {
        try {
            const now = new Date();
            const key = crypto.randomUUID().replace(/-/g, "");
            let document = await database.EmailVerification.findOne({email});
            if (!document) document = new database.EmailVerification({email});
            document.key = key;
            document.expires = new Date(now.getTime() + EmailValidator.#keyExpirationTime);
            await document.save();
            await EmailValidator.#sendValidationEmail(username, email, key);
            return true;
        } catch (err) {
            err.message = " FAILED TO SEND VERIFICATION REQUEST - " + err.message;
            logger.error(err);
            return false;
        }
    }

    /** Initiates the password reset verification process by generating a key and sending it to the address.
     * @param {String} username - The name to address the user by in the email
     * @param {String} email - The email address being verified
     * @returns {Boolean} True if the verification request was sent
     */
     static async requestResetVerification(username, email) {
        try {
            const now = new Date();
            const key = crypto.randomUUID().replace(/-/g, "");
            let document = await database.EmailVerification.findOne({email});
            if (!document) document = new database.EmailVerification({email});
            document.key = key;
            document.expires = new Date(now.getTime() + EmailValidator.#keyExpirationTime);
            await document.save();
            await EmailValidator.#sendResetEmail(username, email, key);
            return true;
        } catch (err) {
            err.message = " FAILED TO SEND VERIFICATION REQUEST - " + err.message;
            logger.error(err);
            return false;
        }
    }

    /** Completes the verification process by ensuring the provided key matches the sent key
     * @param {String} email - The email address being verified
     * @param {String} key - The key the user if verifying with
     * @returns {Boolean} true if the verification was completed successfully 
     */
    static async completeVerification(email, key) {
        try {
            const document = await database.EmailVerification.findOne({email});
            if (!document) return false;
            if (document.expires < new Date()) return false;
            if (document.key != key) return false;
            await document.deleteOne();
            return true;
        } catch (err) {
            err.message = " FAILED TO COMPLETE VERIFICATION - " + err.message;
            logger.error(err);
            return false;
        }
    }

    /** Checks to see if there is an active verification key pending use
     * @param {String} email - The email address the key was sent to
     * @returns {Boolean} True if the email has an active key to be used 
     */
    static async verificationInProgress(email) {
        try {
            const document = await database.EmailVerification.findOne({email});
            if (!document) return false;
            if (document.expires < new Date()) return false;
            return true;
        } catch (err) {
            return false;
        }
    }

    /** Updates the email verification email template */
    static async updateVerificationTemplate() {
        try {
            logger.info("Updating the email verification SES template...");
            const templateName = "emailValidator";
            const subject = "Ark-Cluster Email Verification Request";
            const html = (await fs.readFile("./misc/aws-ses-templates/email-verification.html")).toString();
            const text = "{{username}},\r\nYour verification code is {{code}}.";
            const input = EmailValidator.#generateTemplate(templateName, subject, html, text);
            const command = new UpdateTemplateCommand(input);
            const response = await EmailValidator.#emailClient.send(command);
            const code = response?.$metadata?.httpStatusCode;
            if (!code == 200) throw new Error("Unexpected response code, " + code);
            logger.info("Successfully updated the email template!");
        } catch (err) {
            err.message = "FAILED TO UPDATE TEMPLATE - " + err.message;
            logger.error(err);
        }
    }

    /** Updates the password reset email template */
    static async updatePasswordResetTemplate() {
        try {
            logger.info("Updating the password reset SES template...");
            const templateName = "passwordReset";
            const subject = "Ark-Cluster Password Reset Request";
            const html = (await fs.readFile("./misc/aws-ses-templates/password-reset.html")).toString();
            const text = "{{username}},\r\nYour password reset code is {{code}}.";
            const input = EmailValidator.#generateTemplate(templateName, subject, html, text);
            const command = new UpdateTemplateCommand(input);
            const response = await EmailValidator.#emailClient.send(command);
            const code = response?.$metadata?.httpStatusCode;
            if (!code == 200) throw new Error("Unexpected response code, " + code);
            logger.info("Successfully updated the email template!");
        } catch (err) {
            err.message = "FAILED TO UPDATE TEMPLATE - " + err.message;
            logger.error(err);
        }
    }

    /** Sends a email address validation request to the specified address
     * @param {String} username - The username to display in the email communication
     * @param {String} email - The email address to send the verification request
     * @param {String} validationCode - The key used to authenticate the verification
     */
     static async #sendValidationEmail(username, email, validationCode) {
        try {
            logger.debug("Sending email verification request...");
            const source = `"Ark-Cluster Verification" <verification@${EmailValidator.#emailDomain}>`;
            const bindings = {};
            bindings.username = username;
            bindings.code = validationCode;
            bindings.link = `http://ark-cluster.com/verify?code=${validationCode}`;
            bindings.unsubscribe = `http://ark-cluster.com/unsubscribe?email=${email}`;
            const input = EmailValidator.#emailFromTemplate(source, email, "emailValidator", bindings);
            const command = new SendTemplatedEmailCommand(input);
            const response = await EmailValidator.#emailClient.send(command);
            const code = response?.$metadata?.httpStatusCode;
            if (!code == 200) throw new Error("Unexpected response code, " + code);
            logger.debug("Successfully sent the email!");
        } catch (err) {
            err.message = "FAILED TO SEND A VERIFICATION EMAIL - " + err.message;
            logger.error(err);
        }
    }

    /** Sends a password reset validation request to the specified address
     * @param {String} username - The username to display in the email communication
     * @param {String} email - The email address to send the verification request
     * @param {String} validationCode - The key used to authenticate the verification
     */
     static async #sendResetEmail(username, email, validationCode) {
        try {
            logger.debug("Sending password reset verification request...");
            const source = `"Ark-Cluster Verification" <verification@${EmailValidator.#emailDomain}>`;
            const bindings = {};
            bindings.username = username;
            bindings.code = validationCode;
            bindings.link = `http://ark-cluster.com/rest-password?username=${username}&email=${email}&key=${validationCode}`;
            bindings.unsubscribe = `http://ark-cluster.com/unsubscribe?email=${email}`;
            const input = EmailValidator.#emailFromTemplate(source, email, "passwordReset", bindings);
            const command = new SendTemplatedEmailCommand(input);
            const response = await EmailValidator.#emailClient.send(command);
            const code = response?.$metadata?.httpStatusCode;
            if (!code == 200) throw new Error("Unexpected response code, " + code);
            logger.debug("Successfully sent the email!");
        } catch (err) {
            err.message = "FAILED TO SEND A VERIFICATION EMAIL - " + err.message;
            logger.error(err);
        }
    }

    /** Generates the command options for creating a new email template in AWS SES
     * @param {String} name - The name to save this email template as
     * @param {String} subject - The subject line to display for emails sent using this template
     * @param {String} htmlVersion - The HTML version of this email including parameter bindings
     * @param {String} textVersion - The plain text version of this email including parameter bindings
     */
    static #generateTemplate(name, subject, htmlVersion, textVersion) {
        return {
            "Template": {
              "TemplateName": name,
              "SubjectPart": subject,
              "HtmlPart": htmlVersion,
              "TextPart": textVersion
            }
          }
    }

    /** Generates the command options for sending an email from a template
     * @param {String} source - The email address the email will be sent from
     * @param {String} destinations - The email(s) that will be sent an email
     * @param {String} templateName - The name of the template stored in AWS SES
     * @param {Object} data - An object containing key value pairs for filling in the template 
     */
    static #emailFromTemplate(source, destinations, templateName, data) {
        if (!Array.isArray(destinations)) destinations = [destinations];
        return {
            Source: source,
            Destination: {ToAddresses: destinations},
            Template: templateName,
            TemplateData: JSON.stringify(data)
        }
    }

}
