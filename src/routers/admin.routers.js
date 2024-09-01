import { Router } from "express";

import { verifyAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

import { ApiResponse } from "../utils/apiResponse.js";


const adminRouter = Router();


adminRouter.route("/").get(verifyJWT, verifyAdmin, async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, {
            userName: req.user.userName
        },
            "Yep, you r Admin."
        )
    )
});

export default adminRouter;