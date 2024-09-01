import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { deleteS3File, uploadFileS3 } from "../utils/s3fileUpload.js";
import { deleteLocalFiles } from "../utils/localFile.js";


import { Video } from "../models/video.models.js";
import mongoose from "mongoose";
import { getVideoDuration } from "../utils/getVideoDuration.js";

// uploas video

const uploadVideo = asyncHandler(async (req, res) => {

    const {
        title,
        description
    } = req.body

    const video = req.files?.video ? req.files?.video[0] : null;
    const thumbnail = req.files?.thumbnail ? req.files?.thumbnail[0] : null;

    if (
        [title, description].some((fild) =>
            String(fild).trim().length < 1
        )
    ) {

        deleteLocalFiles([video?.path, thumbnail?.path]);
        throw new ApiError(400, "All Filds are Require.");
    }

    if (!video) {

        deleteLocalFiles([video?.path, thumbnail?.path]);
        throw new ApiError(400, "Video not given.");
    }

    if (!thumbnail) {

        deleteLocalFiles([video?.path, thumbnail?.path]);
        throw new ApiError(400, "Thumbnail not given.");
    }

    if (!String(thumbnail?.mimetype).includes("image/")) {

        deleteLocalFiles([video?.path, thumbnail?.path]);
        throw new ApiError(400, "Thumbnail file must be in image format.");
    }

    if (!String(video?.mimetype).includes("video/")) {

        deleteLocalFiles([video?.path, thumbnail?.path]);
        throw new ApiError(400, "Video file must be in Video format.");
    }

    const videoFileName = video.filename;
    const thumbnailFileName = thumbnail.filename;

    const videoLocalPath = video?.path;
    const thumbnailLocalPath = thumbnail?.path;

    // Extract video duration using ffmpeg
    let videoDuration = 0;

    try {
        videoDuration = await getVideoDuration(videoLocalPath);
    } catch (error) {
        deleteLocalFiles([video?.path, thumbnail?.path]);
        throw new ApiError(500, "Failed to extract video duration.");
    }

    let s3Response = await uploadFileS3(videoLocalPath, videoFileName);

    if (!s3Response) {
        throw new ApiError(500, "Somthing want wrong while uploading video.");
    }

    s3Response = await uploadFileS3(thumbnailLocalPath, thumbnailFileName);

    if (!s3Response) {
        throw new ApiError(500, "Somthing want wrong while uploading video thumbnail.");
    }

    const newVideoContent = await Video.create({
        title: title,
        description: description,
        videoUrl: videoFileName,
        thumbnail: thumbnailFileName,
        owner: new mongoose.Types.ObjectId(req.user._id || ""),
        duration: videoDuration,
        isPublished: true
    });

    return res.status(200).json(
        new ApiResponse(200,
            {
                video: newVideoContent
            },
            "Video uploaded successfully."
        )
    )
});

// get video by id

const getVideoById = asyncHandler(async (req, res) => {

    const vId = req.query?.v || "";

    const uId = req.user?._id || "";

    if (!mongoose.isValidObjectId(vId)) {
        throw new ApiError(400, "video Id not given properly.");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(vId),
                isPublished: true
            }
        },
        // getting channal details
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "channal",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            foreignField: "channal",
                            localField: "_id",
                            as: "subscribers",
                        }
                    },
                    {
                        $addFields: {
                            // count of subscriberes
                            subscriberes: {
                                $size: "$subscribers"
                            },
                            // find is current user subscribed to channalUserName
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [uId, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            avatar: 1,
                            firstName: 1,
                            lastName: 1,
                            username: 1,
                            subscriberes: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        // geetting like details
        {
            $lookup: {
                from: "likes",
                foreignField: "video",
                localField: "_id",
                as: "likelist",
            }
        },
        {
            $addFields: {
                channal: {
                    $first: "$channal"
                },
                likes: {
                    $size: "$likelist"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [uId, "$likelist.likedBy"] },
                        then: true,
                        else: false
                    }
                },
                canUpdate: {
                    $cond: { $eq: ["$owner", new mongoose.Types.ObjectId(uId) || ""] },
                    then: true,
                    else: false
                }
            }

        },
        {
            $project: {
                title: 1,
                description: 1,
                videoUrl: 1,
                thumbnail: 1,
                channal: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                updatedAt: 1,
                likes: 1,
                isLiked: 1,
                canUpdate: 1
            }
        }
    ]);

    if (!video[0]) {
        throw new ApiError(404, "video don't exist");
    }

    return res.status(200).json(
        new ApiResponse(200,
            {
                video: video[0]
            },
            "Video fatched."
        )
    )
});

// edit video details

const updateVideoDetails = asyncHandler(async (req, res) => {

    const vId = req.query?.v || "";

    const uId = req.user?._id || "";

    const {
        newTitle,
        newDescription,
        newIsPublished
    } = req.body;

    if (!mongoose.isValidObjectId(vId)) {
        throw new ApiError(400, "video Id not given properly.");
    }

    const video = await Video.findById(vId);

    if ((!newTitle || !newDescription) || (newTitle.length < 1 && newDescription.length < 1 && newIsPublished === video.isPublished)) {
        throw new ApiError(400, "New filds not given properly.");
    }


    if (String(video.owner) !== String(uId)) {
        throw new ApiError(403, "Unauthorized Request, You dont have permition to do this action.");
    }

    if (newTitle) {
        video.title = newTitle;
    }

    if (newDescription) {
        video.description = newDescription;
    }

    if (newIsPublished !== video.isPublished) {
        video.isPublished = newIsPublished;
    }

    video.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200,
            {
                video: video
            },
            "Video updated sueecssfully."
        )
    )
});

// update thumbnail

const updateVideoThumbnail = asyncHandler(async (req, res) => {

    const thumbnail = req.files?.thumbnail ? req.files?.thumbnail[0] : null;

    const vId = req.query?.v || "";

    const uId = req.user?._id || "";

    if (!mongoose.isValidObjectId(vId)) {

        deleteLocalFiles([thumbnail?.path]);
        throw new ApiError(400, "video Id not given properly.");
    }

    const video = await Video.findById(vId);

    if (String(video.owner) !== String(uId)) {

        deleteLocalFiles([thumbnail?.path]);
        throw new ApiError(403, "Unauthorized Request, You dont have permition to do this action.");
    }

    if (!thumbnail) {

        deleteLocalFiles([thumbnail?.path]);
        throw new ApiError(400, "Thumbnail not given.");
    }

    if (!String(thumbnail?.mimetype).includes("image/")) {

        deleteLocalFiles([thumbnail?.path]);
        throw new ApiError(400, "Thumbnail file must be in image format.");
    }

    const thumbnailFileName = thumbnail.filename;
    const thumbnailLocalPath = thumbnail?.path;

    let s3Response = await uploadFileS3(thumbnailLocalPath, thumbnailFileName);

    if (!s3Response) {
        throw new ApiError(500, "Somthing want wrong while uploading video thumbnail.");
    }

    s3Response = await deleteS3File(video.thumbnail || "");

    if (!s3Response) {
        throw new ApiError(500, "Somthing want wrong while deleteing old video thumbnail.");
    }

    video.thumbnail = thumbnailFileName;

    video.save({ validateBeforeSave: false });


    return res.status(200).json(
        new ApiResponse(200,
            {
                video: video
            },
            "Video thumbnail file updated sueecssfully."
        )
    )

});

// update videofile

const updateVideoFile = asyncHandler(async (req, res) => {

    const newVideo = req.files?.newVideo ? req.files?.newVideo[0] : null;

    const vId = req.query?.v || "";

    const uId = req.user?._id || "";

    if (!mongoose.isValidObjectId(vId)) {

        deleteLocalFiles([newVideo?.path]);
        throw new ApiError(400, "video Id not given properly.");
    }

    const video = await Video.findById(vId);

    if (String(video.owner) !== String(uId)) {

        deleteLocalFiles([newVideo?.path]);
        throw new ApiError(403, "Unauthorized Request, You dont have permition to do this action.");
    }

    if (!newVideo) {

        deleteLocalFiles([newVideo?.path]);
        throw new ApiError(400, "newVideo file not given.");
    }

    if (!String(newVideo?.mimetype).includes("video/")) {

        deleteLocalFiles([video?.path]);
        throw new ApiError(400, "newVideo file must be in video format.");
    }

    const newVideoFileName = newVideo.filename;
    const newVideoLocalPath = newVideo?.path;

    let videoDuration = 0;

    try {
        videoDuration = await getVideoDuration(newVideoLocalPath);
    } catch (error) {
        deleteLocalFiles([newVideoLocalPath]);
        throw new ApiError(500, "Failed to extract video duration.");
    }

    let s3Response = await uploadFileS3(newVideoLocalPath, newVideoFileName);

    if (!s3Response) {
        throw new ApiError(500, "Somthing want wrong while uploading video.");
    }

    s3Response = await deleteS3File(video.videoUrl || "");

    if (!s3Response) {
        throw new ApiError(500, "Somthing want wrong while deleteing old video file.");
    }

    video.videoUrl = newVideoFileName;
    video.duration = videoDuration;

    video.save({ validateBeforeSave: false });


    return res.status(200).json(
        new ApiResponse(200,
            {
                video: video
            },
            "Video file updated sueecssfully."
        )
    )

});

// delete videoContent

const deleteVideoContent = asyncHandler(async (req, res) => {
    const vId = req.query?.v || "";

    const uId = req.user?._id || "";

    if (!mongoose.isValidObjectId(vId)) {
        throw new ApiError(400, "video Id not given properly.");
    }

    const video = await Video.findById(vId);

    if (video.owner !== uId) {
        throw new ApiError(403, "Unauthorized Request, You dont have permition to do this action.");
    }

    const videoDeleteResponse = await deleteS3File(video.videoUrl);

    const thumbnailDeleteResponse = await deleteS3File(video.thumbnail);

    if (!videoDeleteResponse || !thumbnailDeleteResponse) {
        throw new ApiError(500, "Somthing gose wrong while deleting video or thumbnail files.");
    }

    await Video.findByIdAndDelete(vId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Video deleted sueecssfully."
        )
    )

})

// search video

const searchVideos = asyncHandler(async (req, res) => {
    const searchParam = req.query?.search || "";

    if (!searchParam || String(searchParam).trim().length < 1) {
        throw new ApiError(401, "Search parameter not given properly.");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Construct the aggregation pipeline
    const pipeline = [
        {
            $match: {
                $or: [
                    { title: { $regex: searchParam, $options: "i" } },
                    { description: { $regex: searchParam, $options: "i" } }
                ],
                isPublished: true,
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "channal",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            foreignField: "channal",
                            localField: "_id",
                            as: "subscribers",
                        },
                    },
                    {
                        $project: {
                            avatar: 1,
                            firstName: 1,
                            lastName: 1,
                            username: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                foreignField: "video",
                localField: "_id",
                as: "likelist",
            },
        },
        {
            $addFields: {
                channal: { $first: "$channal" },
                likes: { $size: "$likelist" },
            },
        },
        {
            $project: {
                title: 1,
                videoUrl: 1,
                thumbnail: 1,
                channal: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                likes: 1,
            },
        },
    ];

    // Use aggregatePaginate to paginate the results
    const options = { page, limit };

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    res.status(200).json(
        new ApiResponse(
            200,
            { videos: videos },
            "Searched video fetched successfully."
        )
    );
});


// recommended videose

const recommendedVideos = asyncHandler(async (req, res) => {
    res.status(200).json(
        new ApiResponse(
            200,
            {},
            "This endpoint is not rady yet."
        )
    )
})


export {
    uploadVideo,
    getVideoById,
    updateVideoDetails,
    updateVideoThumbnail,
    updateVideoFile,
    deleteVideoContent,
    searchVideos,
    recommendedVideos
}