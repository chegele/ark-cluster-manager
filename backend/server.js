
import "dotenv/config.js";
import fs from "fs/promises";
import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import fileUpload from "express-fileupload";
import logger from "./services/logger.js";
import middleware from "./services/middleware.js";
import database from "./services/database/database.js";

const port = 3000;
const appDirectory = "../frontend/dist/ark-cluster/";
const appOptions = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['html', 'js', 'scss', 'css'],
    index: false,
    maxAge: '1y',
    redirect: true,
  }

const app = express();
await database.connect();

//TODO: Remove this in prod
app.use(cors({origin: ["http://localhost:4200", /http:\/\/192\.168\.2.*:4200/], credentials: true}));
app.use(express.json());
app.use(middleware.headerMethod);
app.use(middleware.logRequest);
app.use(middleware.sanitizeBody);
app.use(middleware.idValidation);
app.use(fileUpload({
    abortOnLimit: true, 
    limits: { fileSize: 1024 * 1024 * 20 }
}));
app.use(cookieSession({
    name: "session",
    secret: "TODO: Secret here please",
    maxAge: 1000 * 60 * 60 * 12,
    //TODO: Update this for prod
    sameSite: false
}));

const routes_v1 = await fs.readdir("./api/v1");
for (const filename of routes_v1) {
    if (!filename.endsWith(".js")) continue;
    const path = "./api/v1/" + filename;
    const module = (await import(path)).default;
    if (module.get) app.get(module.route, module.get);
    if (module.post) app.post(module.route, module.post);
    if (module.put) app.put(module.route, module.put);
    if (module.delete) app.delete(module.route, module.delete);
    logger.info(`Loaded v1 endpoint - ${module.route}`);
}

app.use(express.static(appDirectory, appOptions));
app.all('*', function (req, res) {
    res.status(200).sendFile(`/`, {root: appDirectory});
});

app.listen(port, () => {
    logger.info("Server started on port " + port);
});
