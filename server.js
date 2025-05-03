const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

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

const GRPC_SERVICE_HOST =
  process.env.GRPC_SERVICE_HOST || "100.93.156.127:50052";

// Create gRPC clients
const quizServiceClient = new quizmanagement.QuizService(
  GRPC_SERVICE_HOST,
  grpc.credentials.createInsecure()
);

const questionServiceClient = new quizmanagement.QuestionService(
  GRPC_SERVICE_HOST,
  grpc.credentials.createInsecure()
);

// Setup Express server
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.static("public"));

// Express routes
app.get("/api/quizzes", (req, res) => {
  quizServiceClient.listQuizzes({}, (error, response) => {
    if (error) {
      console.error("Error listing quizzes:", error);
      return res.status(500).json({ error: "Failed to fetch quizzes" });
    }
    res.json(response.quizzes);
  });
});

app.get("/api/quiz/:id", (req, res) => {
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
