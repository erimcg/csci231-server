import Router from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/users/user.js";
import FriendRequest from "../models/requests/FriendRequest.js";

/**@type {Router.Router} */
const router = new Router();

router.post("/friend-request/:id",auth,async (req,res)=>{
    let sender = req.user;
    let receiver = await User.findById(req.params.id);

    if(!receiver){
        return res.status(404).send("User not found");
    }

    const request = new FriendRequest({
        sender:{
            username:sender.username,
            userId:sender._id
        },
        receiver:{
            username:receiver.username,
            userId:receiver._id
        }
    });

    receiver.requests.push(request);

    try{
        await receiver.save();
        res.send();
    }
    catch(err){
        console.log(err);
        res.status(500).send();
    }
});

router.patch("/friend-request/:id",auth,async (req,res)=>{
    let user = req.user;

    let index = user.requests.findIndex(item=>item._id.equals(req.params.id));

    if(index === -1){
        return res.status(404).send();
    }

    let arr = user.requests.splice(index,1);
    let request = arr[0];

    if(!req.query || !Object.hasOwn(req.query,"accept")){
        return res.status(400).send();
    }

    if(req.query.accept === "false"){
        try{
            await user.save();
            return res.send(user.requests);
        }
        catch(e){
            console.log(e);
            return res.status(500).send();
        }
    }

    let sender = await User.findById(request.sender.userId);

    if(sender){
        try{
            if(!user.friends.some(item=>item.userId.equals(sender._id))){
                user.friends.push({
                    username:sender.username,
                    userId:sender._id
                });
                await user.save();
            }
            if(!sender.friends.some(item=>item.userId.equals(user._id))){
                sender.friends.push({
                    username:user.username,
                    userId:user._id
                });
                await sender.save();
            }
        }
        catch(e){
            console.log(e);
            return res.status(500).send();
        }
    }

    res.send(user.requests);
});

router.get("/friend-requests",auth,async (req,res)=>{
    let friendRequests = req.user.requests.filter(item=>item.kind === "FriendRequest");
    res.send(friendRequests);
});

router.delete("/friend/:userId",auth,async (req,res)=>{
    const user = req.user;
    let other = await User.findById(req.params.userId);

    if(!other){
        return res.status(400).send("Friend's id required");
    }

    user.friends = user.friends.filter(v=>!v.userId.equals(req.params.userId));
    other.friends = other.friends.filter(v=>!v.userId.equals(user._id));

    try{
        await user.save();
        await other.save();
        res.send(user.friends);
    }
    catch(e){
        console.log(e);
        res.status(500).send();
    }
});

export default router;