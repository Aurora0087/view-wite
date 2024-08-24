import { Router } from "express";

import { sendFileFromS3 } from "../controllers/file.controller.js";

const fileRouter = Router()


fileRouter.route("").get(sendFileFromS3)

export default fileRouter;