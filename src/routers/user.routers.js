import { Router } from "express";

import {
    registerUser,
    loginUser,
    logOut,
    incomingRefreshToken,
    changePassword,
    getCurrentUser,
    updateCurrentUser,
    updateAvatar,
    updateCoverImage,
    getChannalInfo,
    getUserWatchHistory
} from "../controllers/use.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const userRouter = Router();



userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

userRouter.route("/login").post(loginUser);

userRouter.route("/refreshToken").get(incomingRefreshToken);


//secure Route

userRouter.route("/logout").post(verifyJWT, logOut);

userRouter.route("/changePassword").post(verifyJWT, changePassword);

userRouter.route("/updateDetails").post(verifyJWT, updateCurrentUser);

userRouter.route("/updateAvatar").post(
    upload.fields([
    {
        name: "avatar",
        maxCount:1
    }
]), verifyJWT, updateAvatar);

userRouter.route("/updateCoverImage").post(
    upload.fields([
    {
        name: "coverImage",
        maxCount:1
    }
]), verifyJWT, updateCoverImage);

userRouter.route("/current").get(verifyJWT, getCurrentUser);
userRouter.route("/history").get(verifyJWT, getUserWatchHistory);

userRouter.route("/channal").get(verifyJWT, getChannalInfo);

export default userRouter;