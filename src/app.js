import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { ApiError } from "./utils/apiError.js";

const app = express();


// 

app.set("trust proxy", true);

//APP.use used for middleware and config

app.use(cors({
    origin: process.env.CORE_ORIGIN,
    credentials: true
}));

app.use(express.json({
    limit: "32kb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "32kb"
}));

app.use(express.static("public"));

app.use(cookieParser());


// routes import

import userRouter from './routers/user.routers.js'
import fileRouter from "./routers/file.routers.js";
import adminRouter from "./routers/admin.routers.js";
import videoRouter from "./routers/video.routers.js";
import subscriptionRouter from "./routers/subscription.routers.js";
import playlistRouter from "./routers/playlist.routers.js";
import communityRouter from "./routers/community.routers.js";

//routes

app.get("/", async(_, res) => {
    return res.status(200).json({
        isServerRunning:true,
    })
})

app.use("/api/v1/users", userRouter);

app.use("/api/v1/videos", videoRouter);

app.use("/api/v1/playlist", playlistRouter);

app.use("/api/v1/community", communityRouter)

app.use("/api/v1/file", fileRouter);

app.use("/api/v1/admin", adminRouter);

app.use("/api/v1/subscription", subscriptionRouter);


export { app };