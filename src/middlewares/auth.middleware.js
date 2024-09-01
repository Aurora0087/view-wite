import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"


// verify is user login

export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {

        const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Barer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized Request.");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?.uid || "").select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );

        if (!user) {
            throw new ApiError(404, "Invalid access token, Try to login again.");
        }

        req.user = user;

        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Token, try to login again.")
    }
});

export const getUserDetails = asyncHandler(async (req, _, next) => {

    const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Barer ", "") || "";

    if (token) {

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?.uid || "").select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );

        if (!user) {
            throw new ApiError(404, "Invalid access token, Try to login again.");
        }

        req.user = user;

    }

    next();
});


// verify is user a admin user or not, verifyJWT middleware need to run run before this

export const verifyAdmin = asyncHandler(async (req, _, next) => {

    if (!req.user?.role === "ADMIN") {
        throw new ApiError(403, "Unauthorized Request, try to login as a admin.");
    }

    next();
})