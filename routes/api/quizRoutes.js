const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");

/**
 * @openapi
 * components:
 *   schemas:
 *     Quiz:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         createdBy:
 *           type: string
 *       required:
 *         - title
 *         - description
 */

module.exports = (quizServiceClient, questionServiceClient, io) => {
  /**
   * @openapi
   * /api/quiz:
   *   get:
   *     summary: List all quizzes
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Quizzes
   *     responses:
   *       200:
   *         description: List of quizzes
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Quiz'
   *       401:
   *         description: Unauthorized
   */
  router.get("/", authenticateToken, (req, res) => {
    quizServiceClient.listQuizzes({}, (error, response) => {
      if (error) {
        console.error("Error listing quizzes:", error);
        return res.status(500).json({ error: "Failed to fetch quizzes" });
      }
      res.json(response.quizzes);
    });
  });

  /**
   * @openapi
   * /api/quiz:
   *   post:
   *     summary: Create a new quiz
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Quizzes
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Quiz created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Quiz'
   *       401:
   *         description: Unauthorized
   */
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

  /**
   * @openapi
   * /api/quiz/{id}:
   *   get:
   *     summary: Get a specific quiz
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Quizzes
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Quiz details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Quiz'
   *       404:
   *         description: Quiz not found
   */
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

  /**
   * @openapi
   * /api/quiz/{id}:
   *   delete:
   *     summary: Delete a quiz
   *     security:
   *       - BearerAuth: []
   *     tags:
   *       - Quizzes
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Quiz deleted successfully
   *       404:
   *         description: Quiz not found
   */
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
