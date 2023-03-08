
import mongoose from "mongoose";
import logger from "../logger.js";
import profileSchema from "./schemas/profile.js";
import authSchema from "./schemas/auth-user.js";
import emailVerificationSchema from "./schemas/email-verification.js";
import clusterSchema from "./schemas/cluster.js";
import configFileSchema from "./schemas/config-file.js";
import configLootSchema from "./schemas/config-loot-tables.js";
import configGeneralSchema from "./schemas/config-general.js";

export default class ClusterDatabase {

    static AuthUser = mongoose.model("auth-user", authSchema);
    static Profile = mongoose.model("profile", profileSchema);
    static EmailVerification = mongoose.model("email-verification", emailVerificationSchema);
    static Cluster = mongoose.model("cluster", clusterSchema)
    static ConfigFile = mongoose.model("config/file", configFileSchema);
    static ConfigLoot = mongoose.model("config/loot", configLootSchema);
    static ConfigGeneral = mongoose.model("config/general", configGeneralSchema);

    static async connect() {
        const connectionString = process.env.DB_STRING;
        if (!connectionString) throw new Error("No environment variable set for DB_STRING.");
        await mongoose.connect(connectionString).catch(err => {
            logger.error(err);
        });
        logger.info("Successfully connected to the database");
    }
    
}