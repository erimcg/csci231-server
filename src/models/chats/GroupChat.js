import mongoose, { Schema, Types } from "mongoose";
import ChatModel from "./Chat.js";

const groupChatSchema = mongoose.Schema({
    group_name:{
        type:String,
        required:true
    },
    owner:{
        username:String,
        user_id:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    invited_users:[
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    ]
});

const GroupChatModel = ChatModel.discriminator("GroupChat",groupChatSchema);

export default GroupChatModel;