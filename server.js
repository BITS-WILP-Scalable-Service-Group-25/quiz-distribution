const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.header("x-auth");
  if (!token)
    return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

const QuizAnswer = require("./models/quizAnswer");

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

// Express routes
app.get("/api/quizzes", authenticateToken, (req, res) => {
  quizServiceClient.listQuizzes({}, (error, response) => {
    if (error) {
      console.error("Error listing quizzes:", error);
      return res.status(500).json({ error: "Failed to fetch quizzes" });
    }
    res.json(response.quizzes);
  });
});

app.get("/api/quiz/:id", authenticateToken, (req, res) => {
  const quizId = req.params.id;
  quizServiceClient.getQuiz({ id: quizId }, (error, quiz) => {
    if (error) {
      console.error("Error fetching quiz:", error);
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Fetch questions for this quiz
    questionServiceClient.listQuestions(
      { quizId },
      (error, questionsResponse) => {
        if (error) {
          console.error("Error fetching questions:", error);
          return res.status(500).json({ error: "Failed to fetch questions" });
        }
        quiz.questions = questionsResponse.questions;
        res.json(quiz);
      }
    );
  });
});

app.post("/api/quiz/:id/submit", authenticateToken, async (req, res) => {
  const quizId = req.params.id;
  const { studentId, answers } = req.body;

  try {
    const formattedAnswers = answers.map((answer, index) => ({
      questionId: `q${index}`,
      selectedAnswer: answer,
    }));

    const quizAnswer = new QuizAnswer({
      quizId,
      studentId: req.user.id, // Use the authenticated user's ID
      answers: formattedAnswers,
    });

    await quizAnswer.save();

    // Emit a socket event to notify about submission
    io.to(`quiz-${quizId}`).emit("quiz-submitted", {
      studentId: req.user.id,
      quizId,
      userName: req.user.name,
    });

    res.status(201).json({ message: "Quiz answers submitted successfully" });
  } catch (error) {
    console.error("Error saving quiz answers:", error);
    res.status(500).json({ error: "Failed to save quiz answers" });
  }
});

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
