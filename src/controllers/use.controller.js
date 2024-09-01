import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { deleteS3File, uploadFileS3 } from "../utils/s3fileUpload.js";
import { deleteLocalFiles } from "../utils/localFile.js";

import mongoose from "mongoose";



const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// httpcokie
const cookieOption = {
    httpOnly: true,
    secure: true
};

// funtion for generateTokens and save in db

async function generateAccessTokenAndRefreshToken(uid) {
    try {
        const user = await User.findById(uid);

        const accesToken = await user.generateAccessToken();

        const refreshToken = await user.generateRefreshToken();

        // set new refreshToken in user db

        user.refreshToken = refreshToken;

        user.lastOnline = Date.now();

        await user.save({ validateBeforeSave: false });

        return { accesToken, refreshToken };

    } catch (error) {
        console.log(error);

        throw new ApiError(500, "Somthing went wrong while generating token.");
    }
};

// registering new user
const registerUser = asyncHandler(async (req, res) => {

    const {
        firstName,
        lastName,
        username,
        email,
        password } = req.body

    const avatar = req.files?.avatar ? req.files?.avatar[0] : null;
    const coverImage = req.files?.coverImage ? req.files?.coverImage[0] : null;

    // see all require filds given by client

    if (
        [firstName, lastName, email, username, password].some((fild) =>
            String(fild).trim().length < 1
        )
    ) {

        deleteLocalFiles([avatar?.path, coverImage?.path]);
        throw new ApiError(400, "All Filds are Require.")
    }

    if (!emailRegex.test(email)) {

        deleteLocalFiles([avatar?.path, coverImage?.path]);
        throw new ApiError(400, "Invalid email address")
    }


    // cheack user exist with username or email yes{return user exist} no{next}

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });


    if (existedUser) {

        deleteLocalFiles([avatar?.path, coverImage?.path]);
        throw new ApiError(409, "User with username or email already exist.")
    }

    // cheack avater image

    if (!avatar) {

        deleteLocalFiles([avatar?.path, coverImage?.path]);
        throw new ApiError(400, "Avatar image not given.");
    }

    const avatarLocalPath = avatar?.path;
    const coverImageLocalPath = coverImage?.path;

    if (!String(avatar?.mimetype).includes("image/")) {

        deleteLocalFiles([avatar?.path, coverImage?.path]);
        throw new ApiError(400, "Avatar image must be in image format.");
    }

    // upload avater image on s3
    let s3Response = await uploadFileS3(avatarLocalPath, avatar.filename);

    // storing aws obj key
    const avatarFileName = avatar.filename;
    let coverImageFileName = "";

    if (coverImage) {


        if (!String(coverImage?.mimetype).includes("image/")) {
            deleteLocalFiles([coverImage?.path]);
            throw new ApiError(400, "Cover image must be in image format.");
        }

        // upload cover image on s3
        s3Response = await uploadFileS3(coverImageLocalPath, coverImage.filename);

        coverImageFileName = coverImage.filename;
    }


    // register user

    const createdUser = await User.create({
        avatar: avatarFileName || "",
        coverImage: coverImageFileName,
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email,
        password: password,
    });

    const newUser = await User.findById(createdUser._id).select(
        "-password -refreshToken -emailVerificationToken -role "
    )

    if (!newUser) {
        throw new ApiError(500, "Somthing want wrong while registering new user.")
    }

    // sent varification email to email address


    // giv response

    return res.status(201).json(
        new ApiResponse(200, newUser, "User Registered sccess fully.")
    )

});

// login user

const loginUser = asyncHandler(async (req, res) => {

    //get username / email and password

    const { username, password } = req.body

    //validate username / email and password

    if (!username || !password) {
        throw new ApiError(400, "Username/Email or Password not given properly.")
    }

    if (
        [username, password].some((fild) => String(fild).trim().length < 1)
    ) {

        throw new ApiError(400, "Username/Email or Password can't empty.")
    }


    //user exist with username or email

    const user = await User.findOne({
        $or: [{ username: username }, { email: username }]
    });

    if (!user) {
        throw new ApiError(404, "User do not exist.");
    }

    //check password

    const isPasswordValid = await user.isPasswordCurrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password incorrect.")
    }


    //genarete tokens

    const { accesToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    //send token cookices

    return res
        .status(200)
        .cookie("accesToken", accesToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(
            new ApiResponse(200,
                {
                    userName: user.userName,
                },
                "User Login Successfully."
            )
        );
});

/*const adminLoginUser = asyncHandler(async (req, res) => {

    //get username / email and password

    const { username, password } = req.body

    //validate username / email and password

    if (!username || !password) {
        throw new ApiError(400, "Username/Email or Password not given properly.")
    }

    if (
        [username, password].some((fild) => String(fild).trim().length < 1)
    ) {

        throw new ApiError(400, "Username/Email or Password can't empty.")
    }


    //user exist with username or email

    const user = await User.findOne({
        $and:[{role:"ADMIN"},{ $or: [{ username: username }, { email: username }]}]
    });

    if (!user) {
        throw new ApiError(404, "User do not exist or ur not admin.");
    }

    //check password

    const isPasswordValid = await user.isPasswordCurrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password incorrect.")
    }


    //genarete tokens

    const { accesToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    //send token cookices

    return res
        .status(200)
        .cookie("accesToken", accesToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(
            new ApiResponse(200,
                {
                    userName: user.userName,
                },
                "User Login as admin Successfully."
            )
        );
});
*/

// logout

const logOut = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .clearCookie("accesToken", cookieOption)
        .clearCookie("refreshToken", cookieOption)
        .json(
            new ApiResponse(200,
                {},
                "User Logout Successfully."
            )
        );
});

// refreshTokens

const incomingRefreshToken = asyncHandler(async (req, res) => {

    const token = req.cookies?.refreshToken || req.body?.refreshToken || "";

    if (token.length < 1) {
        throw new ApiError(401, "You dont have RefreshToken, try to login again.");
    }

    // decoding token

    const decodedToken = await jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);


    // validating

    if (!decodedToken) {
        throw new ApiError(401, "Invalid refeshToken, try to login again.")
    }

    const user = await User.findById(decodedToken?.uid || "").select(
        "-password "
    );

    if (!user) {
        throw new ApiError(401, "Invalid refeshToken, try to login again.")
    }

    console.log(token);


    if (token !== user.refreshToken) {
        throw new ApiError(401, "RefreshToken expired or using old token, try to login again.")
    }

    // generate new tokens

    const { accesToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    //send token cookices

    return res
        .status(200)
        .cookie("accesToken", accesToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(
            new ApiResponse(200,
                {
                    userName: user.userName,
                },
                "User'd Token Refresher Successfully."
            )
        );


});

// change password

const changePassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword, confirmPassword } = req.body;


    if (newPassword !== confirmPassword) {
        throw new ApiError(401, "New Password and confirm Password not same.")
    }

    if (oldPassword === newPassword) {
        throw new ApiError(401, "Old Password can't same as New Password.")
    }

    const user = await User.findById(req.user?._id || "");

    if (!user) {
        throw new ApiError(404, "Cant find user.")
    }

    const isCurrectPassword = await user.isPasswordCurrect(oldPassword);

    if (!isCurrectPassword) {
        throw new ApiError(401, "Incurrect old Password.")
    }

    user.password = newPassword;
    user.lastOnline = Date.now();

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {
            userName: user.userName
        },
            "Password changed successfully."
        )
    )
});

// geting current login user

const getCurrentUser = asyncHandler(async (req, res) => {
    
    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {
                    user: req.user
                },
                "Current user fetched successfully."
            )
        )
});

// update user info

const updateCurrentUser = asyncHandler(async (req, res) => {

    const { firstName, lastName, phoneNumber } = req.body;

    const user = await User.findById(req.user._id || "");

    if (!user) {
        throw new ApiError(404, "Can't find user, try after login again.");
    }

    if (!firstName && !lastName && !phoneNumber) {
        throw new ApiError(401, "All filds are empty.")
    }

    if (firstName) {

        user.firstName = firstName;
    }
    if (lastName) {
        user.lastName = lastName;
    }
    if (phoneNumber) {
        user.phoneNumber = phoneNumber;
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                userName: user.userName
            },
            "New details updated successfully."
        ))
});

// update avatar

const updateAvatar = asyncHandler(async (req, res) => {

    try {
        const avatar = req.files?.avatar ? req.files?.avatar[0] : null;

        if (!avatar) {
            throw new ApiError(401, "Avatar not given.");
        }

        const user = await User.findById(req.user?._id || "");

        if (!user) {

            deleteLocalFiles([avatar?.path]);
            throw new ApiError(404, "Can't find user, try after login again.");
        }

        const avatarLocalPath = avatar?.path || "";

        if (!String(avatar?.mimetype).includes("image/")) {

            deleteLocalFiles([avatar?.path]);
            throw new ApiError(400, "Avatar image must be in image format.");
        }

        // upload avater image on s3
        let s3Response = await uploadFileS3(avatarLocalPath, avatar.filename);

        if (!s3Response) {
            throw new ApiError(500, "Somthing went wrong while upload Avatar, try after some time.");
        }

        s3Response = await deleteS3File(user.avatar);

        if (!s3Response) {
            throw new ApiError(500, "Somthing went wrong while deleteing previes Avatar, try after some time.");
        }

        // storing aws obj key
        const avatarFileName = avatar.filename;

        user.avatar = avatarFileName;

        await user.save({ validateBeforeSave: false });

        return res.status(200)
            .json(
                new ApiResponse(200, {
                    userName: user.userName,
                    newAvater: avatarFileName
                },
                    "Avatar updated."
                )
            )
    } catch (error) {
        console.log(error);
        deleteLocalFiles([req.files?.avatar[0]?.path]);
        throw new ApiError(500, "Somthing went wrong while updateing Avater, try after some time or contact website owner.");
    }

});

// update cover image

const updateCoverImage = asyncHandler(async (req, res) => {

    try {
        const coverImage = req.files?.coverImage ? req.files?.coverImage[0] : null;

        if (!coverImage) {
            throw new ApiError(401, "CoverImage not given.");
        }

        const user = await User.findById(req.user?._id || "");

        if (!user) {

            deleteLocalFiles([coverImage?.path]);
            throw new ApiError(404, "Can't find user, try after login again.");
        }

        const coverImageLocalPath = coverImage?.path || "";

        if (!String(coverImage?.mimetype).includes("image/")) {

            deleteLocalFiles([coverImage?.path]);
            throw new ApiError(400, "CoverImage image must be in image format.");
        }

        // upload avater image on s3
        let s3Response = await uploadFileS3(coverImageLocalPath, coverImage.filename);

        if (!s3Response) {

            throw new ApiError(500, "Somthing went wrong while upload coverImage, try after some time.");
        }

        if (user.coverImage.length > 1) {
            s3Response = await deleteS3File(user.coverImage);
        }

        if (!s3Response) {
            throw new ApiError(500, "Somthing went wrong while deleteing previes coverImage, try after some time.");
        }

        // storing aws obj key

        const coverImageFileName = coverImage.filename;

        user.coverImage = coverImageFileName;

        await user.save({ validateBeforeSave: false });

        return res.status(200)
            .json(
                new ApiResponse(200, {
                    userName: user.userName,
                    newCoverImage: coverImageFileName
                },
                    "CoverImage updated."
                )
            )
    } catch (error) {
        console.log(error);
        deleteLocalFiles([req.files?.coverImage[0]?.path]);
        throw new ApiError(500, "Somthing went wrong while updateing coverImage, try after some time.");
    }

});

// geting a channal info

const getChannalInfo = asyncHandler(async (req, res) => {

    const channalUserName = req.query?.username || "";

    if (!channalUserName || String(channalUserName).trim().length < 1) {
        throw new ApiError(401, "Channal Username not given not given properly.");
    }

    // aggregate pipelines - 
    const channal = await User.aggregate([

        // finding user using channalUserName
        {
            $match: {
                username: channalUserName
            }
        },
        // get all subscriberes
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channal",
                as: "subscriberes"
            }
        },
        // get all channal when channalUserName subscribed to
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribto"
            }
        },
        // find is current user subscribed on not and add 3 new filds
        {
            $addFields: {
                // count of subscriberes
                subscriberes: {
                    $size: "$subscriberes"
                },
                // count of subscribed channales/user
                subscribto: {
                    $size: "$subscribto"
                },
                // find is current user subscribed to channalUserName
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user._id, "$subscriberes.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        // geting which filds are needed
        {
            $project: {
                avatar: 1,
                coverImage: 1,
                firstName: 1,
                lastName: 1,
                username: 1,
                subscriberes: 1,
                subscribto: 1,
                isSubscribed: 1,
                createdAt: 1,
            }
        }
    ]);

    if (!channal[0]) {
        throw new ApiError(401, `Can't found channal ${channalUserName}.`);
    }


    return res.status(200).json(
        new ApiResponse(200,
            {
                channal: channal[0]
            },
            `${channalUserName} information fatched.`
        )
    )
});

// get current users watch history

const getUserWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([

        // find current user
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        // get watch history videos
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "watchHistory",
                as: "watchHistory",

                // nested pipeline
                pipeline: [{
                    // geting owner details
                    $lookup: {
                        from: "users",
                        foreignField: "_id",
                        localField: "owner",
                        as: "owner",
                        pipeline: []
                    }
                },
                {
                    $project: {
                        avatar: 1,
                        username: 1,
                        firstName: 1,
                        lastName: 1
                    }
                },
                // only taking fist element from arr
                {
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                },
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200,
            {
                watchHistory: user[0]?.watchHistory
            },
            "Current users watch history retrived."
        )
    )
})

export {
    registerUser,
    loginUser,
    logOut,
    incomingRefreshToken,
    changePassword,
    updateCurrentUser,
    updateAvatar,
    updateCoverImage,
    getCurrentUser,

    getChannalInfo,
    getUserWatchHistory
}