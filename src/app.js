import "./db/mongoose.js";

import express from "express";
import cors from "cors";
import userRouter from "./routers/users.js";
import friendRouter from "./routers/friends.js";
import chatRouter from "./routers/chats.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(userRouter);
app.use(friendRouter);
app.use(chatRouter);

// 

const port = process.env.PORT;
app.listen(port,()=>{
    console.log("Listening on port:",port);
});