import "../../notifications/models/notification.js";

import validator from "validator";

import mongoose from "mongoose";
import { Schema, model } from "mongoose";

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        minLength:[5,"Minimum length is 5"],
    },
    password:{
        type:String,
        required:true,
        minLength:[8,"Minimum length is 8"]
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    /**@type {mongoose.SchemaTypeOptions}*/
    email:{
        type:String,
        required:true,
        trim:true,
        validate:{
            validator:(value)=>validator.isEmail(value),
            message:"Must be a valid email address",
        }
    }
    
//   name: String,
//   age: Number,
//   isAdmin: Boolean,
//   gpa: Schema.Types.Double,

//   creationDate: Date,

//   address: new Schema({ street: String, city: String }, { _id: false }),

//   motherId: {
//     type: Schema.Types.ObjectId,
//     ref: 'User' 
//   },

//   oldPasswords: [String],
//   notifications: [{
//     type: mongoose.model('Notification').schema
//   }],

//   socialMediaHandles: {
//     type: Map,
//     of: String
//   },

//   blockUsers: [ Schema.Types.Mixed ],

//   profilePic: Schema.Types.Buffer
})

const User = model('User', userSchema) 
const Patient = model('Patient', userSchema) 

export default User

setTimeout(async ()=>{
    console.log(await Patient.find({}));
},500);