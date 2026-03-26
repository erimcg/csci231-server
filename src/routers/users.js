import Router from "express";
import bcrypt from "bcrypt";
import User from '../models/users/user.js'
import { auth } from "../middleware/auth.js";
import ChatModel from "../models/chats/Chat.js";

/**@type {Router.Router} */
const router = new Router();

router.get("/user",auth,async (req,res)=>{    
    return res.send(req.user);
});

router.post("/user_old",async (req,res)=>{
    try{
        const data = req.body;

        let user = new User(data);

        await user.save();

        res.send(data);
    }
    catch (error) {
        const result = error.toJSON()
        console.log(result)
        if (error.name == 'ValidationError') {
            for (let field in error.errors) {
                if (error.errors[field].name === 'CastError') {
                    delete error.errors[field].reason
                    delete error.errors[field].stringValue
                    delete error.errors[field].valueType
                }
                if (error.errors[field].name === 'ValidatorError') {
                    delete error.errors[field].properties
                }
            }
            
            return res.status(400).send({ name: error.name, errors: error.errors });
        }

        res.status(500).send({ name: error.name, message: error.message })
    }
});

router.post("/user",async (req,res)=>{
    try{
        console.log(req)
        console.log(req.body)
        const user = new User(req.body);
        await user.save();

        res.status(201).send();
    }
    catch(err){
        console.log(err);
        if(err.code == 11000){
            console.log("Duplicate account");
            return res.status(409).send(err);
        }
        else if(err.name == "ValidationError"){
            console.log("Validation error");
            return res.status(400).send(err);
        }
        else{
            res.status(500).send(err);
        }
    }
});

router.post("/user/login",async (req,res)=>{
    try{
        console.log(req.body)
        let user = await User.findOne({ username: req.body.username });

        if(!user){
            return res.status(400).send("Invalid credentials");
        }

        const isMatch = await bcrypt.compare(req.body.password,user.password);
        if(!isMatch){
            return res.status(400).send("Invalid credentials");
        }

        const authToken = await user.generateAuthToken();

        if(user.authTokens.length == 5){
            user.authTokens.shift();
        }
        user.authTokens.push(authToken);

        await user.save();
        res.status(200).send({ user, authToken });
    }
    catch(err){
        console.log(err);
        res.status(500).send("Internal server error");
    }
});

router.patch("/user",auth,async (req,res)=>{
    const user = req.user;
    const mods = req.body;

    const modifiable = [
        "username",
        "password",
        "firstName",
        "lastName",
        "email"
    ];

    
    try{
        const keys = Object.keys(mods);
        const isValid = keys.every(key=>modifiable.includes(key));
    
        if(!isValid) return res.status(400).send("One or more invalid properties");


        // set values into user doc
        for(const key of keys){
            user[key] = mods[key];
        }
        await user.save();

        res.send(user);
    }
    catch(e){
        console.log(e);
        if(e.code === 11000){
            console.log("Duplicate account");
            return res.status(409).send(e);
        }
        else if(e.name == "ValidationError"){
            console.log("Validation error");
            return res.status(400).send(e);
        }
        res.status(500).send(e);
    }
});

router.delete("/user",auth,async (req,res)=>{
    const user = req.user;

    try{
        await user.deleteOne();
        
        res.send();
    }
    catch(e){
        console.log(e);
        res.status(500).send();
    }
});

router.post("/user/logout",auth,async (req,res)=>{
    const user = req.user;
    const token = req.token;

    try{
        let i = user.authTokens.indexOf(token);
        if(i != -1) user.authTokens.splice(i,1);

        // user.authTokens.pull(token);
        await user.save();
        res.send();
    }
    catch(e){
        console.log(e);
        res.status(500).send();
    }
});

router.get("/users",auth,async (req,res)=>{
    console.log("get users query: ",req.query ?? "no query");

    let search = req.query?.search ?? "";
    let escapedTerm = search.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

    let filter = {
        username:{
            $regex:escapedTerm,
            $options:"i" // ignore casing
        }
    };

    const pipeline = User.aggregate([
        {
            $match:filter
        },
        {
            $project:{
                _id:1,
                username:1,
                email:1
            }
        }
    ]);

    try{
        if(req.query.skip){
            pipeline.append({$skip:parseInt(req.query.skip)}); // parseInt could through error
        }

        let limit = req.query.limit ?? 50;
        if(limit > 50) limit = 50;
        pipeline.append({$limit:parseInt(limit)}); // parseInt could through error

        if(req.query.sortBy){
            const [key,order] = req.query.sortBy.split(":");
            pipeline.append({$sort:{
                [key]: order === "asc" ? 1 : -1
            }});
        }
    }
    catch(e){
        console.log(e);
        return res.status(400).send(); // bad request, something went wrong with the query data
    }

    try{
        const users = await pipeline.exec();
        const total = await User.countDocuments(filter);

        res.send({users,total});
    }
    catch(e){
        console.log(e);
        res.status(500).send();
    }
});
// router.post("/user2",async (req,res)=>{
//     const data = {
//         name: "Joe",
//         age: 20,
//         gpa: 3.7,
//         isAdmin: true,
//         creationDate: Date.now(),
//         address: { street: '123 Main', city: 'Dayton' },
//     }

//     const user = new User(data)  // create a document

//     const mother = await User.findOne({ name: 'Sally' })
//     user.motherId = mother ? mother._id : undefined

//     user.oldPasswords.push('test1234')
//     user.notifications.push(new Notification({ message: 'hello', isRead: false }))

//     user.socialMediaHandles?.set('github', 'joe123')

//     user.blockUsers.push({ name: 'Alice' })

//     await user.save()   // store the document in the database
//     console.log(user.toJSON())
// });

export default router;