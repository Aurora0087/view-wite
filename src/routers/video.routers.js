import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { getUserDetails, verifyJWT } from "../middlewares/auth.middleware.js";

import { deleteVideoContent, getVideoById, recommendedVideos, searchVideos, updateVideoDetails, updateVideoFile, updateVideoThumbnail, uploadVideo } from "../controllers/video.controller.js";


const videoRouter = Router();



videoRouter.route("/upload").post(upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), verifyJWT, uploadVideo);

videoRouter.route("/watch").get(getUserDetails, getVideoById);

videoRouter.route("/update/details").post(verifyJWT, updateVideoDetails);

videoRouter.route("/update/thumbnail").post(upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    }
]),verifyJWT, updateVideoThumbnail);

videoRouter.route("/update/video").post(upload.fields([
    {
        name: "newVideo",
        maxCount: 1
    }
]), verifyJWT, updateVideoFile);

videoRouter.route("/delete").post(verifyJWT, deleteVideoContent);

videoRouter.route("/search").post(searchVideos);

videoRouter.route("/reccomended").post(recommendedVideos);

export default videoRouter;