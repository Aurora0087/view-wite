import { User } from "../models/user.models.js";

import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"


// verify is user login

export const verifyJWT = asyncHandler(async (req, res, next) => {

    try {

        const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Barer ", "");

        if (!token) {
            return res.status(401).json(
                new ApiResponse(
                    401,
                    {},
                    "Unauthorized Request."
                )
            )
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?.uid || "").select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );

        if (!user) {
            return res.status(401).json(
                new ApiResponse(
                    401,
                    {},
                    "Invalid access token, Try to login again."
                )
            )
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json(
            new ApiResponse(
                401,
                {},
                "Invalid access token, Try to login again."
            )
        )
    }
});

export const getUserDetails = asyncHandler(async (req, res, next) => {

    const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Barer ", "") || "";

    if (token) {

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?.uid || "").select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );

        if (!user) {
            return res.status(401).json(
                new ApiResponse(
                    401,
                    {},
                    "Invalid access token, Try to login again."
                )
            )
        }

        req.user = user;

    }

    next();
});


// verify is user a admin user or not, verifyJWT middleware need to run run before this

export const verifyAdmin = asyncHandler(async (req, res, next) => {

    if (!req.user?.role === "ADMIN") {
        return res.status(403).json(
            new ApiResponse(
                403,
                {},
                "Unauthorized Request, try to login as a admin."
            )
        )
    }

    next();
});