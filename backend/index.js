const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const http = require("http")
const { Server } = require("socket.io")
const setupChatSocket = require("./socket/chatSocket.js")

// Load environment variables FIRST
dotenv.config();

const app = express()
const server = http.createServer(app)
const Routes = require("./routes/route.js")

const PORT = process.env.PORT || 5555

// Socket.IO setup with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Setup chat socket handlers
setupChatSocket(io);

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}))

// Stripe webhook needs raw body — must be registered BEFORE express.json()
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }))

mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(console.log("Connected to MongoDB"))
    .catch((err) => console.log("NOT CONNECTED TO NETWORK", err))

app.use('/', Routes);

// Add a simple test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Backend server is running!', 
        timestamp: new Date().toISOString(),
        port: PORT 
    });
});

server.listen(PORT, () => {
    console.log(`Server started at port no. ${PORT}`)
    console.log(`Socket.IO server is running`)
    console.log(`Test the server at: http://localhost:${PORT}/test`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});