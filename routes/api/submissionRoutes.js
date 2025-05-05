const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");
const QuizAnswer = require("../../models/quizAnswer");

module.exports = (io) => {
  // Submit quiz answers
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

  // List submissions for a quiz
  router.get("/:id/submissions", authenticateToken, async (req, res) => {
    try {
      const quizId = req.params.id;

      // Only allow quiz creator or admin to view submissions
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Not authorized to view submissions" });
      }

      const submissions = await QuizAnswer.find({ quizId }).sort({
        submittedAt: -1,
      });

      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Review/approve a submission
  router.put(
    "/:quizId/submissions/:submissionId/review",
    authenticateToken,
    async (req, res) => {
      try {
        const { quizId, submissionId } = req.params;
        const { status, feedback } = req.body;

        // Validate status
        if (!["approved", "rejected"].includes(status)) {
          return res
            .status(400)
            .json({
              error: "Invalid status. Must be 'approved' or 'rejected'",
            });
        }

        // Only allow quiz creator or admin to review submissions
        if (req.user.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Not authorized to review submissions" });
        }

        const submission = await QuizAnswer.findById(submissionId);

        if (!submission) {
          return res.status(404).json({ error: "Submission not found" });
        }

        if (submission.quizId !== quizId) {
          return res
            .status(400)
            .json({ error: "Submission does not belong to this quiz" });
        }

        submission.status = status;
        submission.feedback = feedback;
        submission.reviewedBy = req.user.id;
        submission.reviewedAt = new Date();

        await submission.save();

        // Notify the student that their submission has been reviewed
        io.to(`user-${submission.studentId}`).emit("submission-reviewed", {
          quizId,
          submissionId,
          status,
          feedback,
        });

        res.json({
          message: "Submission reviewed successfully",
          submission,
        });
      } catch (error) {
        console.error("Error reviewing submission:", error);
        res.status(500).json({ error: "Failed to review submission" });
      }
    }
  );

  return router;
};
