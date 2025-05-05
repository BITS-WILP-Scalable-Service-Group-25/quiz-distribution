const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");

module.exports = (questionServiceClient) => {
  router.post("/:quizId/questions", authenticateToken, (req, res) => {
    const { text, options, correctAnswer, type } = req.body;
    const createQuestionRequest = {
      quizId: req.params.quizId,
      text,
      options,
      correctAnswer,
      type,
    };

    questionServiceClient.createQuestion(
      createQuestionRequest,
      (error, response) => {
        if (error) {
          console.error("Error creating question:", error);
          return res.status(500).json({ error: "Failed to create question" });
        }
        res.status(201).json(response);
      }
    );
  });

  router.get("/:quizId/questions", authenticateToken, (req, res) => {
    questionServiceClient.listQuestions(
      { quizId: req.params.quizId },
      (error, response) => {
        if (error) {
          console.error("Error listing questions:", error);
          return res.status(500).json({ error: "Failed to fetch questions" });
        }
        res.json(response.questions);
      }
    );
  });

  router.get("/:quizId/questions/:id", authenticateToken, (req, res) => {
    const { quizId, id } = req.params;
    questionServiceClient.getQuestion({ quizId, id }, (error, response) => {
      if (error) {
        console.error("Error fetching question:", error);
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(response);
    });
  });

  router.put("/:quizId/questions/:id", authenticateToken, (req, res) => {
    const { text, options, correctAnswer, type } = req.body;
    const { quizId, id } = req.params;
    const updateQuestionRequest = {
      quizId,
      id,
      text,
      options,
      correctAnswer,
      type,
    };

    questionServiceClient.updateQuestion(
      updateQuestionRequest,
      (error, response) => {
        if (error) {
          console.error("Error updating question:", error);
          return res.status(500).json({ error: "Failed to update question" });
        }
        res.json(response);
      }
    );
  });

  router.delete("/:quizId/questions/:id", authenticateToken, (req, res) => {
    const { quizId, id } = req.params;
    questionServiceClient.deleteQuestion({ quizId, id }, (error, response) => {
      if (error) {
        console.error("Error deleting question:", error);
        return res.status(500).json({ error: "Failed to delete question" });
      }
      res.json(response);
    });
  });

  return router;
};
