const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Load proto file
const PROTO_PATH = path.join(__dirname, "quiz.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const { quizmanagement } = protoDescriptor;

const QUIZ_MANAGEMENT_GRPC =
  process.env.QUIZ_MANAGEMENT_GRPC || "100.93.156.127:50052";

// Create gRPC clients
const quizServiceClient = new quizmanagement.QuizService(
  QUIZ_MANAGEMENT_GRPC,
  grpc.credentials.createInsecure()
);

const questionServiceClient = new quizmanagement.QuestionService(
  QUIZ_MANAGEMENT_GRPC,
  grpc.credentials.createInsecure()
);

// Setup Express server
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.static("public"));

// Import routes
const quizRoutes = require("./routes/api/quizRoutes");
const questionRoutes = require("./routes/api/questionRoutes");
const submissionRoutes = require("./routes/api/submissionRoutes");

// Use routes
app.use("/api/quiz", quizRoutes(quizServiceClient, questionServiceClient, io));
app.use("/api/quiz", questionRoutes(questionServiceClient));
app.use("/api/quiz", submissionRoutes(io));

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("join-quiz", (quizId) => {
    socket.join(`quiz-${quizId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start HTTP server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});
