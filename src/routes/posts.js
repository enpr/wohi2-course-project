const express = require("express");
const router = express.Router();
const questions = require("../data/posts");

// GET /questions
// List all questions
router.get("/", (_req, res) => {
 res.json(questions);
});

// GET /questions/:qId
// Show a specific question
router.get("/:qId", (req, res) => {
 const qId = Number(req.params.qId);
 const question = questions.find((q) => q.id === qId);
 if (!question) {
 return res.status(404).json({ message: "Question not found" });
 }
 res.json(question);
});

// POST /questions
// Create a new question
router.post("/", (req, res) => {
 const { question, answer } = req.body;
 if (!question || !answer) {
 return res.status(400).json({
 message: "question and answer are required"
 });
 }
 const maxId = Math.max(...questions.map(q => q.id), 0);
 const newQuestion = {
 id: questions.length ? maxId + 1 : 1,
 question, answer
 };
 questions.push(newQuestion);
 res.status(201).json(newQuestion);
});

// PUT /questions/:qId
// Edit a question
router.put("/:qId", (req, res) => {
 const qId = Number(req.params.qId);
 const { question, answer } = req.body;
 const existing = questions.find((q) => q.id === qId);
 if (!existing) {
 return res.status(404).json({ message: "Question not found" });
 }
 if (!question || !answer) {
 return res.json({
 message: "question and answer are required"
 });
 }
 existing.question = question;
 existing.answer = answer;
 res.json(existing);
});

// DELETE /questions/:qId
// Delete a question
router.delete("/:qId", (req, res) => {
 const qId = Number(req.params.qId);
 const qIndex = questions.findIndex((q) => q.id === qId);
 if (qIndex === -1) {
 return res.status(404).json({ message: "Question not found" });
 }
 const deletedQuestion = questions.splice(qIndex, 1);
 res.json({
 message: "Question deleted successfully",
 question: deletedQuestion[0]
 });
});

module.exports = router;
