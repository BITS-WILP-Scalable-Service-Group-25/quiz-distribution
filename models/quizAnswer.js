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
});

module.exports = mongoose.model("QuizAnswer", quizAnswerSchema);
