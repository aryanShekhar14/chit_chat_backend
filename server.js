const dotenv = require("dotenv")
const express = require("express");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const colors = require("colors");
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require("./routes/messageRoutes")
const { notFound, errorHandler } = require("./middleware/errorMiddleware")
const path = require('path')
const cors=require("cors")


dotenv.config();
connectDB();
const app = express();


app.use(express.json()); //accept json data
app.use(cors());

app.get('/', (req, res) => {
    res.setHeader("Access-Control-Allow-Credentials","true");
    res.send("API IS RUNNING SUCCESSFULLY");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes)
app.use("/api/message", messageRoutes)



app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(5000, console.log(`Server started on port ${PORT}`.yellow.bold));

const io = require('socket.io')(server, {
    pingTimeout: 60000, //close connection after 60 sec if no response to save bandwidth
    cors: {
        origin: "https://chit-chat-84zh.onrender.com"
    }
})

io.on("connection", (socket) => {
    console.log("Connected to socket io")

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected")
    })

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User joined " + room)
    })

    socket.on("typing", (room) => socket.in(room).emit("typing"))

    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"))

    socket.on("new msg", (newMessageRecv) => {
        var chat = newMessageRecv.chat;
        if (!chat.users) {
            return console.log("user not defined")
        }
        chat.users.forEach((user) => {
            if (user._id == newMessageRecv.sender._id) {
                return;
            }
            socket.in(user._id).emit("msg received", newMessageRecv)
        })
    })

    socket.off("setup", () => {
        console.log("Disconnected")
        socket.leave(userData._id)
    })
})
