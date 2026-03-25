import mongoose, { Schema } from "mongoose";

// notes:
// - don't allow owner to leave chat
// - don't need to support background or logo for chat session
// - don't worry about pinned messages

const chatSchema = new mongoose.Schema({
    message_buckets: [
        {
            type: Schema.Types.ObjectId,
            ref: "MessageBucket",
        }
    ],
    users: [
        {
            username: String,
            user_id: {
                type: Schema.Types.ObjectId,
                ref: "User"
            },
        }

    ],
    // pinned_messages: [
    //     {
    //         content: String,
    //         timestamp: Date,
    //         sender: {
    //             type: Schema.Types.ObjectId,
    //             ref: "User"
    //         }, 
    //         message_id: {
    //             type: Schema.Types.ObjectId,
    //             ref: "Message"
    //         }
    //     }
    // ]

},
{
    discriminatorKey: "chat_type" 
}
); 

const ChatModel = mongoose.model("Chat", chatSchema);

export default ChatModel;