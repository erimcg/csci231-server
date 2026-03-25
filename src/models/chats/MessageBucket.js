import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
    content: String,
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},
{
    timestamps:true,
});

const messageBucketSchema = new Schema({
    chat_id: {
        type: Schema.Types.ObjectId,
        ref: "Chat"
    },
    start_date: Date,
    end_date: Date,
    size: Number,
    messages: [messageSchema]
});

const MessageBucketModel = mongoose.model("MessageBucket",messageBucketSchema);
// export const MessageModel = mongoose.model("Message",messageSchema);

export default MessageBucketModel;

// 3:30 wednesday