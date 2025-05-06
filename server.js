const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quiz Distribution API",
      version: "1.0.0",
      description: "API for managing quizzes, questions, and submissions",
    },
    servers: [
      {
        url: "http://100.119.176.67:5003",
        description: "deployment server",
      },
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "apiKey",
          name: "x-auth",
          in: "header",
        },
      },
    },
  },
  apis: ["./routes/api/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

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
