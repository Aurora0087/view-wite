import { Router } from "express";

import {
    getUserDetails,
    verifyJWT
} from "../middlewares/auth.middleware.js";
import {
    deleteComment,
    getCommunityComments,
    getParentCommentReplies,
    getVideoComments,
    postCommunityComment,
    postReplyToComment,
    postVideoComment,
    updateComment
} from "../controllers/comment.controller.js";


const commentRouter = Router();


commentRouter.route("/post/video").post(verifyJWT, postVideoComment);
commentRouter.route("/post/community").post(verifyJWT, postCommunityComment);
commentRouter.route("/post/comment").post(verifyJWT, postReplyToComment);


commentRouter.route("/get/video").get(getUserDetails, getVideoComments);
commentRouter.route("/get/community").get(getUserDetails, getCommunityComments);
commentRouter.route("/get/comment").get(getUserDetails, getParentCommentReplies);

commentRouter.route("/update").post(verifyJWT, updateComment);

commentRouter.route("/delete").delete(verifyJWT, deleteComment);

export default commentRouter;