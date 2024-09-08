import { Router } from "express";

import {
    verifyJWT,
    getUserDetails
} from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";

import {
    createCommunity,
    deleteCommunity,
    getChannelCommunity,
    getCommunityById,
    getCurrentUserCommunity,
    updateCommunity
} from "../controllers/community.controller.js";



const communityRouter = Router();


communityRouter.route("/create").post(upload.fields([
    {
        name: "img",
        maxCount:1
    }
]), verifyJWT, createCommunity);

communityRouter.route("/update").post(upload.fields([
    {
        name: "newimg",
        maxCount:1
    }
]),verifyJWT, updateCommunity);

communityRouter.route("/delete").delete(verifyJWT, deleteCommunity);

communityRouter.route("/current").post(verifyJWT, getCurrentUserCommunity);
communityRouter.route("/channel").post(getUserDetails,getChannelCommunity);
communityRouter.route("/get").get(getUserDetails, getCommunityById);


export default communityRouter;