const mongoose = require("mongoose");

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
