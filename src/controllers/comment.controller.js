import { Comment } from "../models/comment.models.js";
import { Community } from "../models/community.models.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import mongoose from "mongoose";



// post video comment

const postVideoComment = asyncHandler(async (req, res) => {
    const uId = req.user._id || "";

    const {
        videoId,
        text
    } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        return res.status(400).json(
            new ApiResponse(
                400,
                "VideoId not given properly."
            )
        )
    }

    const video = await Video.findById(videoId);

    if (!video) {
        return res.status(404).json(
            new ApiResponse(
                404,
                "Video not found."
            )
        )
    }

    if (text.length < 1) {
        return res.status(401).json(
            new ApiResponse(
                401,
                "Text atlast need 1 charecter."
            )
        )
    }

    const newComment = await Comment.create(
        {
            owner: new mongoose.Types.ObjectId(uId),
            video: new mongoose.Types.ObjectId(video._id),
        }
    );

    if (!newComment) {
        return res.status(500).json(
            new ApiResponse(
                500,
                "Somthing goes wrong while creating new comment."
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                newComment
            },
            "Comment created successfully."
        )
    )


});



// get videos comments

const getVideoComments = asyncHandler(async (req, res) => {
    const uId = req.user?._id || "";
    const { videoId, page = 1, limit = 10 } = req.query;

    // Validate video ID
    if (!mongoose.isValidObjectId(videoId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid videoId provided.")
        );
    }

    // Find the video by ID
    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json(
            new ApiResponse(404, "Video not found.")
        );
    }

    // Create aggregation pipeline
    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(video._id)
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "parentComment",
                as: "childComments"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channels",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likeLists"
            }
        },
        {
            $addFields: {
                childCommentCount: { $size: "$childComments" },
                likeCount: { $size: "$likeLists" },
                isLiked: {
                    $in: [new mongoose.Types.ObjectId(uId), "$likeLists.likedBy"]
                },
                channel: { $first: "$channels" },
                canUpdate: {
                    $eq: ["$owner", new mongoose.Types.ObjectId(uId)]
                }
            }
        },
        {
            $project: {
                childCommentCount: 1,
                channel: 1,
                canUpdate: 1,
                text: 1,
                isDeleted: 1,
                likeCount: 1,
                isLiked: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ]);

    // Apply pagination using mongoose-aggregate-paginate-v2
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(
            200,
            { comments },
            "Comments fetched successfully."
        )
    );
});



// post parentComment comment

const postReplyToComment = asyncHandler(async (req, res) => {
    const uId = req.user._id || "";
    const { parentCommentId, text } = req.body;

    // Validate the parentCommentId
    if (!mongoose.isValidObjectId(parentCommentId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid parentCommentId provided.")
        );
    }

    // Find the parent comment
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
        return res.status(404).json(
            new ApiResponse(404, "Parent comment not found.")
        );
    }

    // Validate text length
    if (text.length < 1) {
        return res.status(400).json(
            new ApiResponse(400, "Text must have at least 1 character.")
        );
    }

    // Create the new reply comment
    const newReply = await Comment.create({
        owner: new mongoose.Types.ObjectId(uId),
        text: text,
        parentComment: new mongoose.Types.ObjectId(parentCommentId)
    });

    if (!newReply) {
        return res.status(500).json(
            new ApiResponse(500, "Something went wrong while creating the reply.")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { newReply }, "Reply created successfully.")
    );
});


// get parentComment comments

const getParentCommentReplies = asyncHandler(async (req, res) => {
    const uId = req.user?._id || "";
    const { parentCommentId, page = 1, limit = 10 } = req.query;

    // Validate parentCommentId
    if (!mongoose.isValidObjectId(parentCommentId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid parentCommentId provided.")
        );
    }

    // Find the parent comment
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
        return res.status(404).json(
            new ApiResponse(404, "Parent comment not found.")
        );
    }

    // Create aggregation pipeline for replies
    const aggregate = Comment.aggregate([
        {
            $match: {
                parentComment: new mongoose.Types.ObjectId(parentCommentId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channels",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likeLists"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likeLists" },
                isLiked: {
                    $in: [new mongoose.Types.ObjectId(uId), "$likeLists.likedBy"]
                },
                channel: { $first: "$channels" },
                canUpdate: {
                    $eq: ["$owner", new mongoose.Types.ObjectId(uId)]
                }
            }
        },
        {
            $project: {
                channel: 1,
                canUpdate: 1,
                text: 1,
                isDeleted: 1,
                likeCount: 1,
                isLiked: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ]);

    // Apply pagination
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const replies = await Comment.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(
            200,
            { replies },
            "Replies fetched successfully."
        )
    );
});



// post community comment

const postCommunityComment = asyncHandler(async (req, res) => {
    const uId = req.user._id || "";
    const { communityId, text } = req.body;

    // Validate the communityId
    if (!mongoose.isValidObjectId(communityId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid communityId provided.")
        );
    }

    // Find the community post
    const community = await Community.findById(communityId);
    if (!community) {
        return res.status(404).json(
            new ApiResponse(404, "Community post not found.")
        );
    }

    // Validate text length
    if (text.length < 1) {
        return res.status(400).json(
            new ApiResponse(400, "Text must have at least 1 character.")
        );
    }

    // Create the new community comment
    const newCommunityComment = await Comment.create({
        owner: new mongoose.Types.ObjectId(uId),
        text: text,
        community: new mongoose.Types.ObjectId(communityId)
    });

    if (!newCommunityComment) {
        return res.status(500).json(
            new ApiResponse(500, "Something went wrong while creating the community comment.")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { newCommunityComment }, "Community comment created successfully.")
    );
});

// get community comments

const getCommunityComments = asyncHandler(async (req, res) => {

    const uId = req.user?._id || "";
    const { communityId, page = 1, limit = 10 } = req.query;

    // Validate communityId
    if (!mongoose.isValidObjectId(communityId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid communityId provided.")
        );
    }

    // Find the community post
    const community = await Community.findById(communityId);
    if (!community) {
        return res.status(404).json(
            new ApiResponse(404, "Community post not found.")
        );
    }

    // Create aggregation pipeline for community comments
    const aggregate = Comment.aggregate([
        {
            $match: {
                community: new mongoose.Types.ObjectId(communityId)
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "parentComment",
                as: "childComments"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channels",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likeLists"
            }
        },
        {
            $addFields: {
                childCommentCount: { $size: "$childComments" },
                likeCount: { $size: "$likeLists" },
                isLiked: {
                    $in: [new mongoose.Types.ObjectId(uId), "$likeLists.likedBy"]
                },
                channel: { $first: "$channels" },
                canUpdate: {
                    $eq: ["$owner", new mongoose.Types.ObjectId(uId)]
                }
            }
        },
        {
            $project: {
                childCommentCount: 1,
                channel: 1,
                canUpdate: 1,
                text: 1,
                isDeleted: 1,
                likeCount: 1,
                isLiked: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ]);

    // Apply pagination
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(
            200,
            { comments },
            "Community comments fetched successfully."
        )
    );
});





// update video comment

const updateComment = asyncHandler(async (req, res) => {

    const uId = req.user._id || "";

    const {
        commentId,
        newText
    } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
        return res.status(400).json(
            new ApiResponse(
                400,
                "commentId not given properly."
            )
        )
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        return res.status(404).json(
            new ApiResponse(
                404,
                "comment not found."
            )
        )
    }

    if (!comment.owner.equals(uId)) {
        return res.status(403).json(
            new ApiResponse(403, "You are not authorized to modify this comment.")
        );
    }

    if (newText.length < 1) {
        return res.status(401).json(
            new ApiResponse(
                401,
                "Text atlast need 1 charecter."
            )
        )
    }

    comment.text = newText;

    await comment.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                newComment: comment
            },
            "Comment updated successfully."
        )
    )
})

// delete video comment

const deleteComment = asyncHandler(async (req, res) => {
    
    const uId = req.user?._id || "";
    const { commentId } = req.query;

    // Validate comment ID
    if (!mongoose.isValidObjectId(commentId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid commentId provided.")
        );
    }

    // Find the comment by ID
    const comment = await Comment.findById(commentId);
    if (!comment) {
        return res.status(404).json(
            new ApiResponse(404, "Comment not found.")
        );
    }

    // Check if the user is the owner of the comment
    if (!comment.owner.equals(uId)) {
        return res.status(403).json(
            new ApiResponse(403, "You are not authorized to modify this comment.")
        );
    }

    // Check for child comments
    const childComments = await Comment.find({ parentComment: comment._id });

    if (childComments.length === 0) {
        // Delete the comment if there are no child comments
        await comment.deleteOne();  // Corrected to use deleteOne method
    } else {
        // Mark the comment as deleted but retain the children
        comment.owner = null;
        comment.isDeleted = true;

        await comment.save();  // Corrected to call save() as a function
    }

    return res.status(200).json(
        new ApiResponse(200, "Comment deleted successfully.")
    );
});



export {
    getCommunityComments,
    getParentCommentReplies,
    getVideoComments,

    postCommunityComment,
    postReplyToComment,
    postVideoComment,

    deleteComment,
    updateComment,
}