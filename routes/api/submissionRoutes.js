const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");
const QuizAnswer = require("../../models/quizAnswer");

module.exports = (io) => {
  router.post("/:id/submit", authenticateToken, async (req, res) => {
    const quizId = req.params.id;
    const { answers } = req.body;

    try {
      const formattedAnswers = answers.map((answer, index) => ({
        questionId: `q${index}`,
        selectedAnswer: answer,
      }));

      const quizAnswer = new QuizAnswer({
        quizId,
        studentId: req.user.id,
        answers: formattedAnswers,
      });

      await quizAnswer.save();

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

  return router;
};
