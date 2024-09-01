import { Router } from "express";

import {
    verifyJWT,
    getUserDetails
} from "../middlewares/auth.middleware.js";
import {
    createCommunity,
    deleteCommunity,
    getChannelCommunity,
    getCommunityById,
    updateCommunity
} from "../controllers/community.controller.js";



const communityRouter = Router();


communityRouter.use("/create").post(verifyJWT, createCommunity);
communityRouter.use("/update").post(verifyJWT, updateCommunity);

communityRouter.use("/delete").delete(verifyJWT, deleteCommunity);

communityRouter.use("/current").post(verifyJWT, createCommunity);
communityRouter.use("/channel").post(getChannelCommunity);
communityRouter.use("/get").get(getUserDetails, getCommunityById);


export default communityRouter;