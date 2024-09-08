import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { Community } from "../models/community.models.js";
import { Comment } from "../models/comment.models.js";

import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import mongoose from "mongoose";



// toggle like video

const toggleLikeVideo = asyncHandler(async (req, res) => {
    const uId = req.user._id || "";
    const { videoId = "" } = req.query;

    // Validate video ID
    if (!mongoose.isValidObjectId(videoId)) {
        return res.status(400).json(new ApiResponse(400, {}, "VideoId not given properly."));
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json(new ApiResponse(404, {}, "Video doesn't exist."));
    }

    try {
        // Check if the video is already liked by the user
        const isLiked = await Like.findOne({
            likedBy: new mongoose.Types.ObjectId(uId),
            video: new mongoose.Types.ObjectId(videoId),
        });

        let liked = true;

        if (isLiked) {
            // If already liked, remove the like
            await Like.findByIdAndDelete(isLiked._id);
            liked = false;
        } else {
            // If not liked, create a new like
            await Like.create({
                likedBy: new mongoose.Types.ObjectId(uId),
                video: new mongoose.Types.ObjectId(videoId),
            });
            liked = true;
        }

        // Count the total number of likes for the video
        const likeCount = await Like.countDocuments({
            video: new mongoose.Types.ObjectId(videoId),
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: liked, likeCount: likeCount },
                "Done"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                {},
                "An error occurred while toggling the like status."
            )
        );
    }
});

// toggle like community

const toggleLikeCommunity = asyncHandler(async (req, res) => {
    const uId = req.user._id || "";
    const { communityId = "" } = req.query;

    // Validate community ID
    if (!mongoose.isValidObjectId(communityId)) {
        return res.status(400).json(new ApiResponse(400, {}, "CommunityId not given properly."));
    }

    // Check if community exists
    const community = await Community.findById(communityId);
    if (!community) {
        return res.status(404).json(new ApiResponse(404, {}, "Community doesn't exist."));
    }

    try {
        // Check if the community is already liked by the user
        const isLiked = await Like.findOne({
            likedBy: new mongoose.Types.ObjectId(uId),
            community: new mongoose.Types.ObjectId(communityId),
        });

        let liked = true;

        if (isLiked) {
            // If already liked, remove the like
            await Like.findByIdAndDelete(isLiked._id);
            liked = false;
        } else {
            // If not liked, create a new like
            await Like.create({
                likedBy: new mongoose.Types.ObjectId(uId),
                community: new mongoose.Types.ObjectId(communityId),
            });
            liked = true;
        }

        // Count the total number of likes for the community
        const likeCount = await Like.countDocuments({
            community: new mongoose.Types.ObjectId(communityId),
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: liked, likeCount: likeCount },
                "Done"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                {},
                "An error occurred while toggling the like status for the community."
            )
        );
    }
});


// toggle like comment

const toggleLikeComment = asyncHandler(async (req, res) => {
    const uId = req.user._id || "";
    const { commentId = "" } = req.query;

    // Validate comment ID
    if (!mongoose.isValidObjectId(commentId)) {
        return res.status(400).json(new ApiResponse(400, {}, "CommentId not given properly."));
    }

    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        return res.status(404).json(new ApiResponse(404, {}, "Comment doesn't exist."));
    }

    try {
        // Check if the comment is already liked by the user
        const isLiked = await Like.findOne({
            likedBy: new mongoose.Types.ObjectId(uId),
            comment: new mongoose.Types.ObjectId(commentId),
        });

        let liked = true;

        if (isLiked) {
            // If already liked, remove the like
            await Like.findByIdAndDelete(isLiked._id);
            liked = false;
        } else {
            // If not liked, create a new like
            await Like.create({
                likedBy: new mongoose.Types.ObjectId(uId),
                comment: new mongoose.Types.ObjectId(commentId),
            });
            liked = true;
        }

        // Count the total number of likes for the comment
        const likeCount = await Like.countDocuments({
            comment: new mongoose.Types.ObjectId(commentId),
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: liked, likeCount: likeCount },
                "Done"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                {},
                "An error occurred while toggling the like status for the comment."
            )
        );
    }
});


export {
    toggleLikeComment,
    toggleLikeCommunity,
    toggleLikeVideo
}