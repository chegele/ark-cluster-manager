
import logger from "./logger.js";
import S3 from "@aws-sdk/client-s3";

const S3Client = S3.S3Client;
const PutCommand = S3.PutObjectCommand;
const GetCommand = S3.GetObjectCommand;
const DeleteCommand = S3.DeleteObjectCommand;

export default class FileManager {

    static #client = new S3Client();

    /** Attempts to create or overwrite a saved file 
     * @param {String} directory - The location of the file
     * @param {String} name - The name of the file 
     * @param {String | Object} data - The data to be saved to the file
     * @returns {Boolean} - True if the file is successfully uploaded
     */
    static async create(directory, name, data) {
        console.log("a");
        if (!directory || !name || !data) throw new Error("You must provide a directory, name, and data.");
        if (typeof(data) == "object") data = JSON.stringify(data, undefined, 2);
        if (typeof(data) != "string") throw new Error("Data is expected to be a string or parsable object.");
        if (data == "") throw new Error("Data can not be an empty string.");
        try {
            console.log("b");
            const command = new PutCommand(FileManager.#generateCommandOptions(directory, name, data)); 
            console.log("c");
            const result = await FileManager.#client.send(command);
            console.log("d");
            const code = result.$metadata.httpStatusCode;
            console.log("e");
            if (code != 200) throw new Error("Failed to upload the file, received a response code of " + code);
        } catch (err) {
            console.log("ERROR FOUND HERE");
            err.message = `Failed to upload a file to s3 \n ${directory}/${name} \n ${err.message}`;
            logger.error(err);
            return false;
        }
        console.log("f");
        return true;
    }

    /** Attempts to retrieve the content of a saved file 
     * @param {String} directory - The location of the file
     * @param {String} name - The name of the file 
     * @return {String} - The body of the file as a string
     */
    static async read(directory, name) {
        if (!directory || !name) throw new Error("You must provide a directory and file name.");
        try {
            const command = new GetCommand(FileManager.#generateCommandOptions(directory, name)); 
            const result = await FileManager.#client.send(command);
            const code = result.$metadata.httpStatusCode;
            if (code != 200) throw new Error("Failed to retrieve the file, received a response code of " + code);
            if (!result.Body) throw new Error("Failed to retrieve the file, no body was returned.");
            return result.Body.transformToString();
        } catch (err) {
            err.message = `Failed to retrieve a file from s3 \n ${directory}/${name} \n ${err.message}`;
            logger.error(err);
            return null;
        }
    }

    /** Attempts to delete  a saved file 
     * @param {String} directory - The location of the file
     * @param {String} name - The name of the file 
     * @returns {Boolean} - True if the file was successfully deleted
     */
    static async delete(directory, name) {
        if (!directory || !name) throw new Error("You must provide a directory and file name.");
        try {
            const command = new DeleteCommand(FileManager.#generateCommandOptions(directory, name)); 
            const result = await FileManager.#client.send(command);
            const code = result.$metadata.httpStatusCode;
            if (code != 204) throw new Error("Failed to delete the file, received a response code of " + code);
            return true;
        } catch (err) {
            err.message = `Failed to delete a file from s3 \n ${directory}/${name} \n ${err.message}`;
            logger.error(err);
            return false;
        }
    }

    /** Generates the parameters required to send an S3 command
     * @param {String} directory - The name of the bucket to interact with
     * @param {String} name - The name of the file to interact with
     * @param {String} [data] - The data to write to a file
     */
    static #generateCommandOptions(directory, name, data) {
        return {
            Bucket: directory,
            Key: name,
            Body: data
        }
    }
}