
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { Playlist } from "../models/playlist.models.js";
import mongoose from "mongoose";
import { Video } from "../models/video.models.js";


//create playlist

const createPlaylist = asyncHandler(async (req, res) => {

    const uId = req.user?._id;

    const {
        playlistTitle,
        playlistDescription,
        playlistIsPublic,
    } = req.body;

    if ((String(playlistTitle).length < 1 && !playlistIsPublic)) {
        throw new ApiError(
            400,
            "Property not given properly."
        )
    }

    const isPlayListExist = await Playlist.findOne(
        {
            owner: uId,
            title: playlistTitle,
        }
    );

    if (isPlayListExist) {
        throw new ApiError(
            401,
            "Playlist alreay exist with this Title."
        )
    }

    const newPlayList = await Playlist.create({
        owner: uId,
        title: playlistTitle,
        description: playlistDescription || "",
        ispublic: playlistIsPublic
    });

    if (!newPlayList) {
        throw new ApiError(
            500,
            "Somthing goes wrong while creating playlist."
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                newPlayList
            },
            "Playlist Created sueecssfully."
        )
    )
});

// add videos in Playlist

const addVideos = asyncHandler(async (req, res) => {

    const { videoList, playListId } = req.body;
    const uId = req.user?._id || "";

    // Validate playlist ID
    if (!mongoose.isValidObjectId(playListId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    // Validate video list
    if (!Array.isArray(videoList) || videoList.length === 0) {
        throw new ApiError(400, "Video list not provided or empty.");
    }

    // Check if the playlist exists
    const playList = await Playlist.findById(playListId);

    if (!playList) {
        throw new ApiError(400, "Playlist does not exist.");
    }

    // Check if the user is the owner of the playlist
    if (!playList.owner.equals(uId)) {
        throw new ApiError(403, "You are not authorized to modify this playlist.");
    }

    // Filter out invalid video IDs
    const validVideoIds = videoList.filter(id => mongoose.isValidObjectId(id));

    if (validVideoIds.length === 0) {
        throw new ApiError(400, "No valid video IDs provided.");
    }

    // Check if each video ID exists in the database
    const existingVideoIds = await Promise.all(
        validVideoIds.map(async (id) => {
            const isVideoExist = await Video.findById(id);
            return isVideoExist ? id : null;
        })
    );

    // Filter out null values (non-existent videos)
    const filteredVideoIds = existingVideoIds.filter(id => id !== null);

    if (filteredVideoIds.length === 0) {
        throw new ApiError(400, "None of the provided video IDs exist.");
    }

    // Update the playlist with new valid video IDs and remove duplicates
    playList.videos.push(...filteredVideoIds);
    playList.videos = [...new Set(playList.videos.map(String))].map(id => new mongoose.Types.ObjectId(id));

    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, { playlist: playList }, "Videos added successfully.")
    );
});

// arrange videoLists in playlist

const arrangeVideoLists = asyncHandler(async (req, res) => {

    const { playListId, newOrder } = req.body;
    const uId = req.user?._id || "";

    // Validate playlist ID
    if (!mongoose.isValidObjectId(playListId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    // Validate new order
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
        throw new ApiError(400, "New order list not provided or empty.");
    }

    // Check if the playlist exists
    const playList = await Playlist.findById(playListId);

    if (!playList) {
        throw new ApiError(404, "Playlist does not exist.");
    }

    // Check if the user is the owner of the playlist
    if (!playList.owner.equals(uId)) {
        throw new ApiError(403, "You are not authorized to modify this playlist.");
    }

    // Ensure all IDs in the new order are valid ObjectIDs
    const validNewOrder = newOrder.filter((id) => {
        if (!mongoose.isValidObjectId(id)) {
            return
        }
        return new mongoose.Types.ObjectId(id);
    });
    if (validNewOrder.length !== newOrder.length) {
        throw new ApiError(400, "Invalid video IDs provided.");
    }

    // Update the playlist with the new order of video IDs
    playList.videos = validNewOrder;

    // Save the updated playlist
    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, { playlist: playList }, "Video list order updated successfully.")
    );
});


//Remove videos from playlist

const removeVideos = asyncHandler(async (req, res) => {

    const { videoList, playListId } = req.body;
    const uId = req.user?._id || "";

    // Validate playlist ID
    if (!mongoose.isValidObjectId(playListId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    // Validate video list
    if (!Array.isArray(videoList) || videoList.length === 0) {
        throw new ApiError(400, "Video list not provided or empty.");
    }

    // Check if the playlist exists
    const playList = await Playlist.findById(playListId);

    if (!playList) {
        throw new ApiError(400, "Playlist does not exist.");
    }

    // Check if the user is the owner of the playlist
    if (!playList.owner.equals(uId)) {
        throw new ApiError(403, "You are not authorized to modify this playlist.");
    }

    // Filter out invalid video IDs
    const validVideoIds = videoList.filter(id => mongoose.isValidObjectId(id));

    if (validVideoIds.length === 0) {
        throw new ApiError(400, "No valid video IDs provided.");
    }

    // Remove the specified videos from the playlist
    playList.videos = playList.videos.filter(
        videoId => !validVideoIds.includes(videoId.toString())
    );

    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, { playlist: playList }, "Videos removed successfully.")
    );
});


// remove all videos from playlist

const removeAllVideos = asyncHandler(async (req, res) => {
    const { playListId } = req.body;
    const uId = req.user?._id || "";

    // Validate playlist ID
    if (!mongoose.isValidObjectId(playListId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    // Check if the playlist exists
    const playList = await Playlist.findById(playListId);

    if (!playList) {
        throw new ApiError(400, "Playlist does not exist.");
    }

    // Check if the user is the owner of the playlist
    if (!playList.owner.equals(uId)) {
        throw new ApiError(403, "You are not authorized to modify this playlist.");
    }

    // Clear all videos from the playlist
    playList.videos = [];

    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, { playlist: playList }, "All videos removed successfully.")
    );
});

// edit playlist details

const updatePlaylistDetails = asyncHandler(async (req, res) => {
    const {
        playListId,
        title,
        description,
        isPublic
    } = req.body;
    const uId = req.user?._id || "";

    // Validate playlist ID
    if (!mongoose.isValidObjectId(playListId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    // Check if the playlist exists
    const playList = await Playlist.findById(playListId);

    if (!playList) {
        throw new ApiError(400, "Playlist does not exist.");
    }

    // Check if the user is the owner of the playlist
    if (!playList.owner.equals(uId)) {
        throw new ApiError(403, "You are not authorized to modify this playlist.");
    }

    // Update only fields that are different
    let isUpdated = false;

    if (title && title !== playList.title) {
        playList.title = title;
        isUpdated = true;
    }

    if (description && description !== playList.description) {
        playList.description = description;
        isUpdated = true;
    }

    if (typeof isPublic === "boolean" && isPublic !== playList.ispublic) {
        playList.ispublic = isPublic;
        isUpdated = true;
    }

    if (!isUpdated) {
        return res.status(400).json(
            new ApiResponse(400, {}, "No changes were made to the playlist.")
        );
    }

    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, { playlist: playList }, "Playlist details updated successfully.")
    );
});


// delete playlist

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playListId } = req.body;
    const uId = req.user?._id || "";

    // Validate playlist ID
    if (!mongoose.isValidObjectId(playListId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    // Check if the playlist exists
    const playList = await Playlist.findById(playListId);

    if (!playList) {
        throw new ApiError(404, "Playlist does not exist.");
    }

    // Check if the user is the owner of the playlist
    if (!playList.owner.equals(uId)) {
        throw new ApiError(403, "You are not authorized to delete this playlist.");
    }

    // Delete the playlist
    await Playlist.findByIdAndDelete(playListId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully.")
    );
});


// get all currentUser playlist

const currentUserPlaylist = asyncHandler(async (req, res) => {
    const uId = req.user?._id;

    // Validate user ID
    if (!uId || !mongoose.isValidObjectId(uId)) {
        throw new ApiError(400, "Invalid User ID.");
    }

    // Fetch all playlists for the current user
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(uId)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "owner",
                            as: "channals",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            channal: {
                                $first: "$channals"
                            }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            videoUrl: 1,
                            duration: 1,
                            isPublished: 1,
                            channal: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        }
                    }
                ]
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                ispublic: 1,
                videoDetails: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ]);

    // Check if any playlists are found
    if (!playlists || playlists.length === 0) {
        throw new ApiError(404, "No playlists found for the current user.");
    }

    return res.status(200).json(
        new ApiResponse(200, { playlists }, "Current user's playlists fetched successfully.")
    );
});

// get channals puplic playList

const getChannalPlaylist = asyncHandler(async (req, res) => {
    const { channelId } = req.query; // Assume channelId is passed in the URL params
    
    // Validate channel ID
    if (!mongoose.isValidObjectId(String(channelId))) {
        throw new ApiError(400, "Invalid Channel ID.");
    }

    // Find public playlists for the specified channel
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                ispublic: true
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "owner",
                            as: "channals",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            channal: {
                                $first: "$channals"
                            }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            videoUrl: {
                                $cond: {
                                    if: "$isPublished",
                                    then: "$videoUrl",
                                    else: "$$REMOVE"
                                }
                            },
                            duration: 1,
                            isPublished: 1,
                            channal: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        }
                    }
                ]
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                ispublic: 1,
                videoDetails: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ]);

    if (!playlists.length) {
        return res.status(404).json(
            new ApiResponse(404, {}, "No public playlists found for this channel.")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { playlists }, "Public playlists fetched successfully.")
    );
});

// get playlist by id

const getPlaylist = asyncHandler(async (req, res) => {

    const { playlistId } = req.query; // Assume playlistId is passed in the URL params
    const uId = req.user?._id || "";

    // Validate playlist ID
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    // Find the playlist by ID and populate video details
    const playlists = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "owner",
                            as: "channals",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            channal: {
                                $first: "$channals"
                            }
                        }
                    },
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            videoUrl: {
                                $cond: {
                                    if: "$isPublished",
                                    then: "$videoUrl",
                                    else: "$$REMOVE"
                                }
                            },
                            duration: 1,
                            isPublished: 1,
                            channal: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
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
                ispublic: 1,
                videoDetails: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                canUpdate:1
            }
        }
    ]);

    if (!playlists[0]) {
        return res.status(404).json(
            new ApiResponse(404, {}, "Playlist not found.")
        );
    }
    

    // Check if the user is the owner or if the playlist is public
    if ((String(playlists[0]?.owner || "404") === String(new mongoose.Types.ObjectId(uId) || "")) || playlists[0]?.ispublic) {
        return res.status(200).json(
            new ApiResponse(200, { playlists:playlists[0] ||[] }, "Playlist fetched successfully.")
        );
    } else {
        return res.status(403).json(
            new ApiResponse(403, {}, "You are not authorized to view this playlist.")
        );
    }
});


export {
    createPlaylist,
    addVideos,
    arrangeVideoLists,
    removeVideos,
    removeAllVideos,
    updatePlaylistDetails,
    deletePlaylist,
    currentUserPlaylist,
    getChannalPlaylist,
    getPlaylist
};