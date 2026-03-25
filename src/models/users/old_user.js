import "../../notifications/models/notification.js";

import mongoose from "mongoose";
import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: String,
  age: Number,
  isAdmin: Boolean,
  gpa: Schema.Types.Double,

  creationDate: Date,

  address: new Schema({ street: String, city: String }, { _id: false }),

  motherId: {
    type: Schema.Types.ObjectId,
    ref: 'User' 
  },

  oldPasswords: [String],
  notifications: [{
    type: mongoose.model('Notification').schema
  }],

  socialMediaHandles: {
    type: Map,
    of: String
  },

  blockUsers: [ Schema.Types.Mixed ],

  profilePic: Schema.Types.Buffer
})

const User = mongoose.model('User', userSchema) 

export default User