import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    avatar: {
        type: String,
    },
    coverImage: {
        type:String
    },
    firstName: {
        type: String,
        require: true,
    },
    lastName: {
        type: String,
        require: true,
    },
    username: {
        type: String,
        require: true,
        unique: true,
        min: [2, "UserName minimum 2 charecter long."],
        index: true,
    },
    email: {
        type: String,
        require: true,
        unique: true,
    },
    phoneNumber: {
        type: String,
        default:""
    },
    password: {
        type: String
    },
    role: {
        type: String,
        enum: ["ADMIN", "USER"],
        default: "USER"
    },
    loginType: {
        type: String,
        enum: ["GOOGLE", "EMAIL_PASSWORD"],
        default: "EMAIL_PASSWORD"
    },
    refreshToken: {
        type: String,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationExpiry: {
        type: Date,
    },
    emailVerificationToken: {
        type: String
    },
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    lastOnline: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

userSchema.pre("save", async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12)
    }
    next()
})

userSchema.methods.isPasswordCurrect = async function(password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = async function() {
    return jwt.sign(
        {
            uid: this._id,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function() {
    return jwt.sign(
        {
            uid: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)