const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");
// Apply authentication to ALL routes in this router
router.use(authenticate);

// GET /questions
// List all questions
router.get("/", async (_req, res) => {
 const questions = await prisma.question.findMany();
 res.json(questions);
});

// GET /questions/:qId
// Show a specific question
router.get("/:qId", async (req, res) => {
 const qId = Number(req.params.qId);
 const question = await prisma.question.findUnique({ where: { id: qId } });
 if (!question) {
 return res.status(404).json({ message: "Question not found" });
 }
 res.json(question);
});

// POST /questions
// Create a new question
router.post("/", async (req, res) => {
 const { question, answer } = req.body;
 if (!question || !answer) {
 return res.status(400).json({
 message: "question and answer are required"
 });
 }
 const newQuestion = await prisma.question.create({
 data: { question, answer, userId: req.user.userId }
 });
 res.status(201).json(newQuestion);
});

// PUT /questions/:qId
// Edit a question
router.put("/:qId", isOwner, async (req, res) => {
 const qId = Number(req.params.qId);
 const { question, answer } = req.body;
 if (!question || !answer) {
 return res.json({
 message: "question and answer are required"
 });
 }
 const existing = await prisma.question.findUnique({ where: { id: qId } });
 if (!existing) {
 return res.status(404).json({ message: "Question not found" });
 }
 const updated = await prisma.question.update({
 where: { id: qId },
 data: { question, answer }
 });
 res.json(updated);
});

// DELETE /questions/:qId
// Delete a question
router.delete("/:qId", isOwner, async (req, res) => {
 const qId = Number(req.params.qId);
 const existing = await prisma.question.findUnique({ where: { id: qId } });
 if (!existing) {
 return res.status(404).json({ message: "Question not found" });
 }
 const deletedQuestion = await prisma.question.delete({ where: { id: qId } });
 res.json({
 message: "Question deleted successfully",
 question: deletedQuestion
 });
});

module.exports = router;
