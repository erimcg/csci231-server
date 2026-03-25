import { model, Schema } from "mongoose";

const notificationSchema = new Schema({
    message:String,
    isRead:{
        type:Boolean
    }
});

const Notification = model("Notification",notificationSchema);

export default Notification;