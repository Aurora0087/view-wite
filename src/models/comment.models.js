import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchama = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    text: {
        type: String,
        require: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community"
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }
}, { timestamps: true });

commentSchama.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchama);