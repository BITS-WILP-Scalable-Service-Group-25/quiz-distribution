const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");
const QuizAnswer = require("../../models/quizAnswer");

module.exports = (io) => {
  /**
   * @openapi
   * /api/quiz/{id}/submit:
   *   post:
   *     summary: Submit quiz answers
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Submissions
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Quiz ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               answers:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of selected answer indices
   *     responses:
   *       201:
   *         description: Quiz submitted successfully
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
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

  /**
   * @openapi
   * /api/quiz/{id}/submissions:
   *   get:
   *     summary: Get all submissions for a quiz
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Submissions
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Quiz ID
   *     responses:
   *       200:
   *         description: List of submissions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/QuizSubmission'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not authorized to view submissions
   */
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

  /**
   * @openapi
   * /api/quiz/{quizId}/submissions/{submissionId}/review:
   *   put:
   *     summary: Review a quiz submission
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Submissions
   *     parameters:
   *       - in: path
   *         name: quizId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: submissionId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [approved, rejected]
   *               feedback:
   *                 type: string
   *     responses:
   *       200:
   *         description: Submission reviewed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 submission:
   *                   $ref: '#/components/schemas/QuizSubmission'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not authorized to review submissions
   */
  router.put(
    "/:quizId/submissions/:submissionId/review",
    authenticateToken,
    async (req, res) => {
      try {
        const { quizId, submissionId } = req.params;
        const { status, feedback } = req.body;

        // Validate status
        if (!["approved", "rejected"].includes(status)) {
          return res.status(400).json({
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
