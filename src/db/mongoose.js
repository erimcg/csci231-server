import { Schema, connect } from "mongoose";

console.log("Connecting to Atlas");

Schema.Types.String.set("validate",{
    validator:(value)=>value == null || value.length > 0,
    message:"String must be null or non-empty"
});
Schema.Types.String.set("trim",true);

connect(process.env.MONGODB_URL)
    .then(()=>console.log("Connection to database successful."))
    .catch(e=>console.log("Error: "+e));