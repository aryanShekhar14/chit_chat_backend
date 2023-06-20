const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("userId param not send")
        return res.sendStatus(400);
    }


    var isChat = await Chat.find({
        isGroupChat: false,

        //if both satisfied then return true
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],//both users 1-1 chat
    }).populate("users", "-password").populate("latestMessage")

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email",
    })

    //if chat exists
    if (isChat.length > 0) {
        res.send(isChat[0])
    }
    else {
        //create new chat
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],
        }

        //store in DB
        try {
            const createdChat = await Chat.create(chatData)

            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");

            res.status(200).send(fullChat)


        } catch (error) {
            res.status(400)
            throw new Error(error.message)
        }
    }
})

const fetchChats = asyncHandler(async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } }).populate("users", "-password").populate("groupAdmin", "-password").populate("latestMessage").sort({ updatedAt: -1 }).then(async (results) => {
            results = await User.populate(results, { path: "latestMeassage.sender", select: "name pic email" })


            res.status(200).send(results)
        })


    }
    catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})


const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please fill all fields" })
    }
    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res.status(400).send("Require atleast 2 users to create a group")

    }

    users.push(req.user);//adding the current user as well

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user
        })

        //fetch that chat any return 
        const fullGroupChat = await Chat.findOne({ _id: groupChat._id }).populate("users", "-password").populate("groupAdmin", "-password")

        res.status(200).json(fullGroupChat)

    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(chatId, {
        chatName
    }, {
        new: true
    }).populate("users", "-password").populate("groupAdmin", "-password")

    if (!updatedChat) {
        res.status(404);
        throw new Error("No Chat Found")
    }
    else {
        res.json(updatedChat)
    }
})

const addToGroup=asyncHandler(async(req,res)=>{
    const{chatId, userId}=req.body;
    const added=await Chat.findByIdAndUpdate(chatId, {
        $push:{users:userId},
    },{
        new:true
    }).populate("users", "-password").populate("groupAdmin", "-password")

    if (!added) {
        res.status(404);
        throw new Error("No Chat Found")
    }
    else {
        res.json(added)
    }
})

const removeFromGroup=asyncHandler(async(req,res)=>{
    const{chatId, userId}=req.body;
    const removed=await Chat.findByIdAndUpdate(chatId, {
        $pull:{users:userId},
    },{
        new:true
    }).populate("users", "-password").populate("groupAdmin", "-password")

    if (!removed) {
        res.status(404);
        throw new Error("No Chat Found")
    }
    else {
        res.json(removed)
    }
})


module.exports = { accessChat, fetchChats, createGroupChat, renameGroup , addToGroup, removeFromGroup}