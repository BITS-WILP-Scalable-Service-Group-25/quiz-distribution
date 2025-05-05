const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");

module.exports = (quizServiceClient, questionServiceClient, io) => {
  router.get("/", authenticateToken, (req, res) => {
    quizServiceClient.listQuizzes({}, (error, response) => {
      if (error) {
        console.error("Error listing quizzes:", error);
        return res.status(500).json({ error: "Failed to fetch quizzes" });
      }
      res.json(response.quizzes);
    });
  });

  router.post("/", authenticateToken, (req, res) => {
    const { title, description } = req.body;
    const createQuizRequest = {
      title,
      description,
      createdBy: req.user.id,
    };

    quizServiceClient.createQuiz(createQuizRequest, (error, response) => {
      if (error) {
        console.error("Error creating quiz:", error);
        return res.status(500).json({ error: "Failed to create quiz" });
      }
      res.status(201).json(response);
    });
  });

  router.get("/:id", authenticateToken, (req, res) => {
    const quizId = req.params.id;
    quizServiceClient.getQuiz({ id: quizId }, (error, quiz) => {
      if (error) {
        console.error("Error fetching quiz:", error);
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    });
  });

  router.delete("/:id", authenticateToken, (req, res) => {
    const quizId = req.params.id;
    quizServiceClient.deleteQuiz({ id: quizId }, (error, response) => {
      if (error) {
        console.error("Error deleting quiz:", error);
        return res.status(500).json({ error: "Failed to delete quiz" });
      }
      res.json(response);
    });
  });

  return router;
};
