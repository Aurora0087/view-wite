import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/apiResponse.js";

// toggler for subsceiption

const toggleSubscription = asyncHandler(async (req, res) => {
    const channalId = req.query?.channalId || "";
    const uId = req.user?._id || "";

    // Corrected Object ID validation
    if (!mongoose.isValidObjectId(channalId)) {
        throw new ApiError(400, "Channel ID is not valid.");
    }

    if (!mongoose.isValidObjectId(uId)) {
        throw new ApiError(400, "Invalid user ID. Please try again after login.");
    }

    // Fetch user and channel
    const user = await User.findById(uId);
    if (!user) {
        throw new ApiError(404, "User not found. Please try again after login.");
    }

    const channal = await User.findById(channalId);
    if (!channal) {
        throw new ApiError(404, "Channel does not exist.");
    }

    // Check if user is already subscribed
    const existingSubscription = await Subscription.findOne({
        subscriber: uId,
        channal: channalId,
    });

    if (existingSubscription) {
        // Unsubscribe the user
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json({
            message: "Unsubscribed successfully.",
        });
    } else {
        // Subscribe the user
        await Subscription.create({
            subscriber: uId,
            channal: channalId,
        });
        return res.status(200).json(
            new ApiResponse(200,
                {
                },
                "Subscribed successfully."
            )
        );
    }
});

// get subscribers list

const getSubscribers = asyncHandler(async (req, res) => {

    const uId = req.user?._id;

    if (!mongoose.isValidObjectId(uId)) {
        throw new ApiError(400, "Invalid user ID. Please try again after login.");
    }

    const subscriptions = await Subscription.aggregate([

        {
            $match: {
                channal: new mongoose.Types.ObjectId(uId),
            },
        },
        {
            $lookup: {
                from: "users", // Lookup details of channels (subscribedTo)
                localField: "channal",
                foreignField: "_id",
                as: "subscribedTo",
            },
        },
        {
            $lookup: {
                from: "users", // Lookup details of subscribers
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
            },
        },
        {
            $addFields: {
                subscribers: {
                    $map: {
                        input: "$subscribers",
                        as: "subscriber",
                        in: {
                            _id: "$$subscriber._id",
                            avatar: "$$subscriber.avatar",
                            firstName: "$$subscriber.firstName",
                            lastName: "$$subscriber.lastName",
                            username: "$$subscriber.username",
                            isSubscriber: {
                                $cond: {
                                    if: { $in: [uId, "$subscribedTo._id"] },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $project: {
                subscribers: 1, // Only return the subscribers field
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscribers: subscriptions.length > 0 ? subscriptions[0].subscribers : [],
            },
            "Subscribers fetched successfully."
        )
    );
});

// get subscribed channal list

const getSubscribedTo = asyncHandler(async (req, res) => {

    const uId = req.user?._id;

    if (!mongoose.isValidObjectId(uId)) {
        throw new ApiError(400, "Invalid user ID. Please try again after login.");
    }

    const subscriptions = await Subscription.aggregate([

        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(uId),
            },
        },
        {
            $lookup: {
                from: "users", // Lookup details of channels (subscribedTo)
                localField: "channal",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            firstName: 1,
                            lastName: 1,
                            username: 1,
                        }
                    }
                ]
            },
        },
        {
            $project: {
                subscribedTo: 1, // Only return the subscribedTo field
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                subscribedTo: subscriptions.length > 0 ? subscriptions[0].subscribedTo : [],
            },
            "subscribed channal fetched successfully."
        )
    );
});


export {
    toggleSubscription,
    getSubscribers,
    getSubscribedTo
}