import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { User } from "../models/user.models.js";




// incrise viewCount on video and add



// get current users watch history

const getUserHistory = asyncHandler(async (req, res) => {
    const uId = req.user._id || "";


})