import Router from "express";
import { auth } from "../middleware/auth.js";
import GroupChatModel from "../models/chats/GroupChat.js";
import ChatInvite from "../models/requests/ChatInvite.js";
import User from "../models/users/user.js";
import ChatModel from "../models/chats/Chat.js";
import MessageBucketModel from "../models/chats/MessageBucket.js";

const router = new Router();

// User creates chat
router.post("/chat", auth, async (req, res) => {
    const user = req.user;

    try {
        const group_name = req.body?.group_name;
        if (!group_name || group_name == "") {
            return res.status(400).send();
        }

        const chat = new GroupChatModel({
            group_name: group_name,
            owner: {
                username: user.username,
                user_id: user._id
            },
            users: [
                {
                    username: user.username,
                    user_id: user._id
                }
            ]
        });

        await chat.save();

        user.chat_sessions.push(chat._id);
        await user.save();

        res.status(201).send(chat)
    }
    catch (err) {
        console.log(err)
        res.status(500).send()
    }
});

// Get chat info
router.get("/chat/:chatId", auth, async (req, res) => {
    const user = req.user;

    try {
        const chat = await ChatModel.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).send("Chat not found");
        }

        if (!chat.users.some(v => v.user_id.equals(user._id))) {
            return res.status(401).send("You must be in this chat view chat info");
        }
        else {
            return res.send(chat)
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).send();
    }
});

// Invite member to chat
router.post("/chat/:chatId/invitation/:userId", auth, async (req, res) => {
    const user = req.user;

    const receiver = await User.findById(req.params.userId);
    if (!receiver) {
        return res.status(404).send("User not found");
    }

    const chat = await ChatModel.findById(req.params.chatId);
    if (!chat) {
        return res.status(404).send("Chat not found");
    }

    try {
        if (!chat.users.some(v => v.user_id.equals(user._id))) {
            return res.status(401).send("You must be in this chat to invite a user");
        }

        if (receiver.requests.some(v => v.kind == "ChatInvite" && v.chat.chatId.equals(req.params.chatId))) {
            return res.status(409).send("User is already invited to this chat");
        }

        if (chat.users.some(v => v.user_id.equals(req.params.userId))) {
            return res.status(400).send("User is already a member");
        }

        const chat_invite = new ChatInvite({
            sender: {
                username: user.username,
                userId: user._id
            },
            receiver: {
                username: receiver.username,
                userId: receiver._id
            },
            chat: {
                name: chat.group_name,
                chatId: chat._id
            }
        });

        receiver.requests.push(chat_invite);
        await receiver.save();

        chat.invited_users.push(receiver._id);
        await chat.save();

        res.status(201).send();
    }
    catch (err) {
        console.log(err);
        res.status(500).send();
    }
});

// Accept/decline chat invite
router.patch("/chat/:chatId/invitation/:requestId", auth, async (req, res) => {
    const user = req.user;

    const invite_index = user.requests.findIndex(v => v._id.equals(req.params.requestId));
    if (invite_index == -1) {
        return res.status(404).send("Invitation not found");
    }

    const arr = user.requests.splice(invite_index, 1);
    const invite = arr[0];

    const chat = await ChatModel.findById(req.params.chatId);
    if (!chat) {
        return res.status(404).send("Chat not found");
    }

    if (invite.kind != "ChatInvite") {
        return res.status(400).send("Invitation wasn't a ChatInvite");
    }

    if (!invite.chat.chatId.equals(chat._id)) {
        return res.status(400).send("Invitation wasn't from this chat");
    }

    chat.invited_users = chat.invited_users.filter(v => !v.equals(user._id));

    const decision = req.query.accept;
    if (!decision || decision == "false") { // deny invite
        try {
            await user.save()
            await chat.save()
            return res.status(200).send(chat);
        }
        catch (err) {
            console.log(err)
            return res.status(500).send();
        }
    }

    // accept invite
    const member = {
        username: user.username,
        user_id: user._id,
    }

    chat.users.push(member)
    user.chat_sessions.push(chat._id);

    try {
        await user.save()
        await chat.save()
        res.status(200).send(chat)
    }
    catch (err) {
        res.status(500).send()
    }

});

// Leave chat
router.delete("/chat/:chatId/membership", auth, async (req, res) => {

    const user = req.user;

    try {
        const chat = await ChatModel.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).send("Chat not found");
        }

        const index = chat.users.findIndex(v => v.user_id.equals(user._id))

        if (index == -1) {
            return res.status(401).send("You are not a member")
        }

        if (chat.owner.user_id.equals(user._id)) {
            return res.status(401).send("Owner cannot leave chat")
        }

        chat.users.splice(index, 1)
        user.chat_sessions = user.chat_sessions.filter(v => !v.equals(req.params.chatId));
        await chat.save()
        await user.save()
        res.status(200).send()
    }
    catch (err) {
        console.log(err);
        res.status(500).send()
    }
});

// Post message
router.post("/chat/:chatId/message", auth, async (req, res) => {
    if (!req.body?.message) {
        return res.status(400).send("Must have a message");
    }

    if (req.body.message == "") {
        return res.status(400).send("Message must be non-empty");
    }

    const user = req.user;
    try {
        const chat = await ChatModel.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).send("Chat not found");
        }

        if (!chat.users.some(v => v.user_id.equals(user._id))) {
            return res.status(401).send("Must be a member to send message");
        }

        // send the message
        let lastBucketId = chat.message_buckets[0];
        let lastBucket;

        const createNewBucket = async () => {
            const bucket = new MessageBucketModel({
                chat_id: chat._id,
                start_date: new Date(),
                end_date: new Date(),
                size: 0,
                messages: []
            });
            await bucket.save();

            chat.message_buckets.unshift(bucket._id);

            lastBucket = bucket;
        };

        if (!lastBucketId) {
            await createNewBucket();
        }
        else {
            const bucket = await MessageBucketModel.findById(lastBucketId);
            if (!bucket) {
                // TODO: lastBucketId is invalid - remove from chat.message_buckets
                
                // make a new bucket
                await createNewBucket();
            }
            else if (bucket.size >= 4) {
                // make a new bucket
                await createNewBucket();
            }
            else {
                lastBucket = bucket;
            }
        }

        // add the message...

        if (!lastBucket) {
            return res.status(500).send();
        }

        lastBucket.messages.unshift({
            content: req.body.message,
            sender: user._id
        });
        lastBucket.size++;
        lastBucket.end_date = new Date();

        await lastBucket.save();
        await chat.save();

        res.status(200).send(lastBucket.messages[0]);

    }
    catch (err) {
        console.log(err);
        res.status(500).send();
    }
});

// Get all messages
router.get("/chat/:chatId/messages", auth, async (req, res) => {
    const user = req.user
    const chat = await ChatModel.findById(req.params.chatId)

    if (!chat) {
        return res.status(404).send("Chat not found")
    }

    if (!chat.users.some(v => v.user_id.equals(user._id))) {
        return res.status(401).send("Must be in chat to get messages")
    }

    //

    let search = req.query?.search ?? "";
    let escapedTerm = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = {
        chat_id: chat._id,
        "messages.content": {
            $regex: escapedTerm,
            $options: "i"
        }
    };

    const pipeline = MessageBucketModel.aggregate([
        {
            $unwind: "$messages"
        },
        {
            $match: filter
        }
    ]);

    try {
        if (req.query.skip) {
            pipeline.append({
                $skip: parseInt(req.query.skip)
            });
        }

        let limit = req.query.limit ? parseInt(req.query.limit) : 10;
        if (limit > 10) limit = 10;
        pipeline.append({
            $limit: limit
        });

    }
    catch (err) {
        console.log(err);
        return res.status(400).send("Data is invalid");
    }

    const results = await pipeline.exec();
    res.status(200).send(results.map(v => v.messages));

})

export default router;