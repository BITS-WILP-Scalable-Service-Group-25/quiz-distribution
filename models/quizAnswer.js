const mongoose = require("mongoose");

/**
 * @openapi
 * components:
 *   schemas:
 *     QuizSubmission:
 *       type: object
 *       properties:
 *         quizId:
 *           type: string
 *           description: ID of the quiz
 *         studentId:
 *           type: string
 *           description: ID of the student who submitted the quiz
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               selectedAnswer:
 *                 type: number
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         reviewedBy:
 *           type: string
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *         feedback:
 *           type: string
 *       required:
 *         - quizId
 *         - studentId
 *         - answers
 */
const quizAnswerSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  answers: [
    {
      questionId: String,
      selectedAnswer: Number,
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  reviewedBy: {
    type: String,
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  feedback: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("QuizAnswer", quizAnswerSchema);
