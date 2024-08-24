import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

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


// rputes import

import userRouter from './routers/user.routers.js'
import fileRouter from "./routers/file.routers.js";

//routes

app.get("/", (req, res) => {
    res.status(200).json({
        isServerRunning:true,
    })
})
app.use("/api/v1/users", userRouter);
app.use("/api/v1/file", fileRouter);

export { app };