import { User } from "../models/user.models.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";


import { uploadFileS3 } from "../utils/s3fileUpload.js";
import fs from "fs"



const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


function deleteLocalFiles(filePath) {
    filePath.map((path) => {
        try {
            fs.unlinkSync(path, () => {
                console.log(path, " Deleted...");

            })
        } catch (error) {
            console.log("Error deleting files from local path.", error);

        }
    })
}

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
    }).exec()


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

    res.status(201).json(
        new ApiResponse(200, newUser, "User Registered sccess fully.")
    )

})

// login user

const loginUser = asyncHandler(async (req, res) => {

    res.status(200).json({
        message: "login success."
    })
})

export { registerUser }