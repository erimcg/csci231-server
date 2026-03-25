import mongoose from "mongoose";
import ChatModel from "./Chat.js";

const directChatSchema = new mongoose.Schema({

});

const DirectChatModel = ChatModel.discriminator("DirectChat",directChatSchema);

export default DirectChatModel;