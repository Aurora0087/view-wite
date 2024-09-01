import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const communitySchama = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true,
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    }
}, { timestamps: true });

communitySchama.plugin(mongooseAggregatePaginate);

export const Community = mongoose.model("Community", communitySchama);