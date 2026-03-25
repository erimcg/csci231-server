import "../../models/notifications/notification.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import validator from "validator";

import { Schema, model } from "mongoose";
import RequestModel from "../requests/Request.js";
import FriendRequest from "../requests/FriendRequest.js";
import ChatInvite from "../requests/ChatInvite.js";

const userSchema = new Schema({
    firstName:{
        type:String,
        required:true,
        minlength:[1,"Minimum length is 1 character"],
        maxlength:[32,"Maximum length is 32 characters"],
        trim:true,
    },
    lastName:{
        type:String,
        required:true,
        minlength:[1,"Minimum length is 1 character"],
        maxlength:[32,"Maximum length is 32 characters"],
        trim:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Must be a valid email address"]
        validate:{
            validator:(v)=>validator.isEmail(v),
            message:"Must be a valid email address"
        }
    },
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        minLength:[5,"Minimum length is 5"],
    },
    password:{
        type:String,
        required:true,
        minLength:[8,"Minimum length is 8"]
    },

    authTokens: [String],

    requests:[RequestModel.schema],
    chat_sessions:[
        {
            type:Schema.Types.ObjectId,
            ref:"Chat"
        }
    ],
    
    friends:[
        {
            username:{
                type:String,
                required:true
            },
            userId:{
                type:Schema.Types.ObjectId,
                ref:"User",
                required:true
            }
        }
    ]
})

userSchema.path("requests").discriminator("FriendRequest",FriendRequest.schema);
userSchema.path("requests").discriminator("ChatInvite",ChatInvite.schema);

userSchema.methods.toJSON = function(){
    const user = this.toObject();

    delete user.password;
    delete user.authTokens;
    delete user.__v;

    return user;
};

// // @ts-check
// async function test(){
//     let a = await RequestModel.create({});
//     a._doc.kind = "asd";
// }

userSchema.methods.setToken = function(newToken){
    return this.token = newToken;
};

userSchema.statics.getUserByUsername = async function(username){
    return await this.findOne({username});
};

userSchema.pre("save",async function(next){
    const user = this;

    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password,8);
    }

    next();
});

userSchema.methods.generateAuthToken = async function(){
    const user = this;

    const token = jwt.sign(
        {
            _id: user._id.toString(),
            type: "User"
        },
        process.env.JSON_WEB_TOKEN_SECRET
    );

    return token;
};

const User = model('User', userSchema) 
const Patient = model('Patient', userSchema) 

export default User

setTimeout(async ()=>{
    console.log(await Patient.find({}));
},500);