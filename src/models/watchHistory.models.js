import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const watchHistorySchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner is required"],
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    rewatched: {
        type: Number,
        default: 0,
        require:true
    }
}, { timestamps: true });

watchHistorySchema.plugin(mongooseAggregatePaginate);

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);''