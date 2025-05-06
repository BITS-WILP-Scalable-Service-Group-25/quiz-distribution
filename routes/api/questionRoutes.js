const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");

/**
 * @openapi
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         text:
 *           type: string
 *         options:
 *           type: array
 *           items:
 *             type: string
 *         correctAnswer:
 *           type: integer
 *         type:
 *           type: string
 *       required:
 *         - text
 *         - options
 *         - correctAnswer
 *         - type
 */

module.exports = (questionServiceClient) => {
  /**
   * @openapi
   * /api/quiz/{quizId}/questions:
   *   post:
   *     summary: Add a question to a quiz
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Questions
   *     parameters:
   *       - in: path
   *         name: quizId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Question'
   *     responses:
   *       201:
   *         description: Question created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Question'
   *       401:
   *         description: Unauthorized
   */
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

  /**
   * @openapi
   * /api/quiz/{quizId}/questions:
   *   get:
   *     summary: Get all questions for a quiz
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Questions
   *     parameters:
   *       - in: path
   *         name: quizId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of questions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Question'
   *       401:
   *         description: Unauthorized
   */
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

  /**
   * @openapi
   * /api/quiz/{quizId}/questions/{id}:
   *   get:
   *     summary: Get a specific question
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Questions
   *     parameters:
   *       - in: path
   *         name: quizId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Question details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Question'
   *       404:
   *         description: Question not found
   */
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

  /**
   * @openapi
   * /api/quiz/{quizId}/questions/{id}:
   *   put:
   *     summary: Update a question
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Questions
   *     parameters:
   *       - in: path
   *         name: quizId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Question'
   *     responses:
   *       200:
   *         description: Question updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Question'
   *       404:
   *         description: Question not found
   */
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

  /**
   * @openapi
   * /api/quiz/{quizId}/questions/{id}:
   *   delete:
   *     summary: Delete a question
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Questions
   *     parameters:
   *       - in: path
   *         name: quizId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Question deleted successfully
   *       404:
   *         description: Question not found
   */
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
