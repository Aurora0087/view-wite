import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { deleteLocalFiles } from "../utils/localFile.js";
import { deleteS3File, uploadFileS3 } from "../utils/s3fileUpload.js";

import mongoose from "mongoose";
import { Community } from "../models/community.models.js";


// create community

const createCommunity = asyncHandler(async (req, res) => {


    const {
        text
    } = req.body;

    const uId = req.user._id || "";

    const communityImage = req.files?.img ? req.files?.img[0] : null;
    const communityImageFileName = "";

    if (!text && !communityImage) {
        return res.status(400).json(
            new ApiResponse(
                400,
                {},
                "Fildes not given properly."
            )
        )
    }

    if (communityImage) {

        const communityImageLocalPath = communityImage?.path;

        if (!String(communityImage?.mimetype).includes("image/")) {

            deleteLocalFiles([communityImageLocalPath]);
            return res.status(400).json(
                new ApiResponse(
                    400,
                    {},
                    "Image filed not given properly."
                )
            )
        }

        // upload avater image on s3
        const s3Response = await uploadFileS3(communityImageLocalPath, communityImage.filename);

        communityImageFileName = communityImage.filename;

        if (!s3Response) {
            return res.status(500).json(
                new ApiResponse(
                    500,
                    {},
                    "Somthing goes wrong while uploading image."
                )
            )
        }
    }

    const newCommunity = await Community.create({
        owner: new mongoose.Types.ObjectId(uId),
        text: text || "",
        image: communityImageFileName
    });

    if (!newCommunity) {
        return res.status(500).json(
            new ApiResponse(
                500,
                {},
                "Somthing goes wrong while creating new community post."
            )
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                community: newCommunity
            },
            "Community Posted successfully."
        )
    )
});

// update community

const updateCommunity = asyncHandler(async (req, res) => {
    const {
        text,
        communityId = ""
    } = req.body;

    const uId = req.user._id || "";

    const communityImage = req.files?.newimg ? req.files?.newimg[0] : null;

    if (!mongoose.isValidObjectId(communityId)) {

        deleteLocalFiles([communityImageLocalPath]);
        return res.status(400).json(
            new ApiResponse(
                400,
                {},
                "CommunityId not given properly."
            )
        )
    }
    const community = await Community.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(communityId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "ownerChannel",
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
                from: "comments",
                foreignField: "community",
                localField: "_id",
                as: "comments"
            }
        },
        {
            $lookup: {
                from: "likes",
                foreignField: "community",
                localField: "_id",
                as: "likes"
            }
        },
        {
            $addFields: {
                commentCount: {
                    $size: "$comments"
                },
                likeCount: {
                    $size: "$likes"
                },
                channal: {
                    $first: "$ownerChannel"
                }
            }
        },
        {
            $project: {
                commentCount: 1,
                likeCount: 1,
                channal: 1,
                owner: 1,
                text: 1,
                image: 1,
                createdAt: 1,
            }
        }
    ]);

    if (!community || community.length() === 0) {

        if (communityImage) deleteLocalFiles([communityImage.path]);
        return res.status(404).json(
            new ApiResponse(
                404,
                {},
                "CommunityId not found."
            )
        )
    }

    if ((String(community[0]?.owner || "404") !== String(new mongoose.Types.ObjectId(uId) || ""))) {

        deleteLocalFiles([communityImageLocalPath]);
        return res.status(403).json(
            new ApiResponse(
                403,
                {},
                "You are not authorized to update this."
            )
        )
    }

    let communityImageFileName = community[0]?.image || "";

    if (communityImage) {

        const communityImageLocalPath = communityImage?.path;

        if (!String(communityImage?.mimetype).includes("image/")) {

            deleteLocalFiles([communityImageLocalPath]);
            return res.status(400).json(
                new ApiResponse(
                    400,
                    {},
                    "Image filed not given properly."
                )
            )
        }

        // upload avater image on s3
        let s3Response = await uploadFileS3(communityImageLocalPath, communityImage.filename);

        communityImageFileName = communityImage.filename;

        if (community[0].image !== "") {
            await deleteS3File(community[0].image)
        }

        if (!s3Response) {
            return res.status(500).json(
                new ApiResponse(
                    500,
                    {},
                    "Somthing goes wrong while uploading image."
                )
            )
        }
    }

    await Community.findByIdAndUpdate(communityId, { text, image: communityImageFileName }, { new: true });

    community[0].text = text;
    community[0].image = communityImageFileName;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                community: community[0]
            },
            "Community Updated successfully."
        )
    )

});

// delete community

const deleteCommunity = asyncHandler(async (req, res) => {

    const { communityId = "" } = req.query;
    const uId = req.user?._id || "";

    // Validate community ID
    if (!mongoose.isValidObjectId(communityId)) {
        return res.status(400).json(new ApiResponse(400, {}, "Invalid Community ID."));
    }

    // Find the community by ID
    const community = await Community.findById(communityId);

    if (!community) {
        return res.status(404).json(new ApiResponse(404, {}, "Community not found."));
    }

    // Check if the user is the owner of the community
    if (String(community.owner) !== String(uId)) {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to delete this community."));
    }

    // Remove the community's image from storage if exists
    if (community.image) {
        await deleteFileFromS3(community.image); // Assuming deleteFileFromS3 is a helper function to delete from S3
    }

    // Delete the community
    await community.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Community deleted successfully."));
});


// get current user community

const getCurrentUserCommunity = asyncHandler(async (req, res) => {
    const uId = req.user?._id; // Get the user ID from the authenticated request

    if (!uId) {
        return res.status(400).json(new ApiResponse(400, {}, "User not authenticated."));
    }

    const { page = 1, limit = 10 } = req.query; // Pagination parameters

    try {
        // Create the aggregation pipeline
        const pipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(uId)
                }
            },
            {
                $lookup: {
                    from: "users", // Lookup the user data for owner details
                    foreignField: "_id",
                    localField: "owner",
                    as: "ownerChannel",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "comments", // Lookup for comment details
                    foreignField: "community",
                    localField: "_id",
                    as: "comments"
                }
            },
            {
                $lookup: {
                    from: "likes", // Lookup for like details
                    foreignField: "community",
                    localField: "_id",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    commentCount: {
                        $size: "$comments"
                    },
                    likeCount: {
                        $size: "$likes"
                    },
                    channel: {
                        $first: "$ownerChannel"
                    }
                }
            },
            {
                $project: {
                    text: 1,
                    image: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    commentCount: 1,
                    likeCount: 1,
                    channel: 1
                }
            }
        ];

        // Use mongooseAggregatePaginate to paginate results
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };

        const communities = await Community.aggregatePaginate(Community.aggregate(pipeline), options);

        if (!communities.docs.length) {
            return res.status(404).json(new ApiResponse(404, {}, "No communities found for the current user."));
        }

        return res.status(200).json(
            new ApiResponse(200, { communities }, "Communities fetched successfully.")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, {}, "An error occurred while fetching communities."));
    }
});


// get channal community

const getChannelCommunity = asyncHandler(async (req, res) => {
    const { channelId = "", page = 1, limit = 10 } = req.query; // Extract pagination parameters from the query

    // Validate channel ID
    if (!mongoose.isValidObjectId(channelId)) {
        return res.status(400).json(new ApiResponse(400, {}, "Invalid Channel ID."));
    }

    try {
        // Create the aggregation pipeline
        const pipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "users", // Lookup the user data for owner details
                    foreignField: "_id",
                    localField: "owner",
                    as: "ownerChannel",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "comments", // Lookup for comment details
                    foreignField: "community",
                    localField: "_id",
                    as: "comments"
                }
            },
            {
                $lookup: {
                    from: "likes", // Lookup for like details
                    foreignField: "community",
                    localField: "_id",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    commentCount: {
                        $size: "$comments"
                    },
                    likeCount: {
                        $size: "$likes"
                    },
                    channel: {
                        $first: "$ownerChannel"
                    }
                }
            },
            {
                $project: {
                    text: 1,
                    image: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    commentCount: 1,
                    likeCount: 1,
                    channel: 1
                }
            }
        ];

        // Pagination options
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };

        // Use mongooseAggregatePaginate to paginate results
        const communities = await Community.aggregatePaginate(Community.aggregate(pipeline), options);

        if (!communities.docs.length) {
            return res.status(404).json(new ApiResponse(404, {}, "No public communities found for this channel."));
        }

        return res.status(200).json(
            new ApiResponse(200, { communities }, "Public communities fetched successfully.")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, {}, "An error occurred while fetching communities."));
    }
});



// get community by id

const getCommunityById = asyncHandler(async (req, res) => {

    const { communityId } = req.query;
    const uId = req.user?._id; // Get the user ID of the current logged-in user

    // Validate community ID
    if (!mongoose.isValidObjectId(communityId)) {
        return res.status(400).json(new ApiResponse(400, {}, "Invalid Community ID."));
    }

    try {
        // Find the community by ID
        const community = await Community.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(communityId),
                },
            },
            {
                $lookup: {
                    from: "users", // Lookup the user data for owner details
                    foreignField: "_id",
                    localField: "owner",
                    as: "ownerChannel",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "comments", // Lookup for comment details
                    foreignField: "community",
                    localField: "_id",
                    as: "comments",
                },
            },
            {
                $lookup: {
                    from: "likes", // Lookup for like details
                    foreignField: "community",
                    localField: "_id",
                    as: "likes",
                },
            },
            {
                $addFields: {
                    commentCount: { $size: "$comments" },
                    likeCount: { $size: "$likes" },
                    channel: { $first: "$ownerChannel" },
                    canUpdate: {
                        $cond: { $eq: ["$owner", new mongoose.Types.ObjectId(uId) || ""] },
                        then: true,
                        else: false
                    }
                }
            },
            {
                $project: {
                    text: 1,
                    image: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    commentCount: 1,
                    likeCount: 1,
                    channel: 1,
                    isPublic: 1,
                    owner: 1,
                    canUpdate:1
                },
            },
        ]);

        // If the community does not exist or is empty
        if (!community || community.length === 0) {
            return res.status(404).json(
                new ApiResponse(404, {}, "Community not found.")
            );
        }

        // Check if the user is the owner or if the community is public
        if (
            String(community[0]?.owner) !== String(uId) &&
            !community[0]?.isPublic
        ) {
            return res.status(403).json(
                new ApiResponse(403, {}, "You are not authorized to view this community.")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, { community: community[0] }, "Community fetched successfully.")
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while fetching the community.")
        );
    }
});


export {
    createCommunity,
    updateCommunity,
    deleteCommunity,
    getCurrentUserCommunity,
    getChannelCommunity,
    getCommunityById
};