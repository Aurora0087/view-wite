import { Router } from "express";

import { getSubscribedTo, getSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();


subscriptionRouter.route("/subscribe").post(verifyJWT, toggleSubscription);

subscriptionRouter.route("/subscribers").get(verifyJWT, getSubscribers);

subscriptionRouter.route("/subscribedTo").get(verifyJWT, getSubscribedTo);


export default subscriptionRouter;