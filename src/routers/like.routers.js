import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleLikeComment, toggleLikeCommunity, toggleLikeVideo } from "../controllers/like.controller.js";

const likeRouter = Router();

likeRouter.route("/video").post(verifyJWT, toggleLikeVideo);
likeRouter.route("/community").post(verifyJWT, toggleLikeCommunity);
likeRouter.route("/comment").post(verifyJWT, toggleLikeComment);

export default likeRouter;