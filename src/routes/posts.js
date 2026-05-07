const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

const storage = multer.diskStorage({
 destination: path.join(__dirname, "..", "..", "public", "uploads"),
 filename: (req, file, cb) => {
 const ext = path.extname(file.originalname);
 cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
 },
});
const upload = multer({
 storage,
 fileFilter: (req, file, cb) => {
 if (file.mimetype.startsWith("image/")) cb(null, true);
 else cb(new Error("Only image files are allowed"));
 },
 limits: { fileSize: 5 * 1024 * 1024 },
});
function formatQuestion(question) {
 return {
 ...question,
 userName: question.user?.name || null,
 solved: question.attempts ? question.attempts.length > 0 : false,
 user: undefined,
 attempts: undefined,
 };
}

// Apply authentication to ALL routes in this router
router.use(authenticate);

// GET /questions
// List all questions
router.get("/", async (req, res) => {
 const page = Math.max(1, parseInt(req.query.page) || 1);
 const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
 const skip = (page - 1) * limit;

 const { keyword } = req.query;
 const where = keyword ? { keywords: { has: keyword.toLowerCase() } } : {};

 const [questions, total] = await Promise.all([
 prisma.question.findMany({
 where,
 include: {
 user: true,
 attempts: { where: { userId: req.user.userId, correct: true }, take: 1 },
 },
 orderBy: { id: "asc" },
 skip,
 take: limit,
 }),
 prisma.question.count({ where }),
 ]);

 res.json({
 data: questions.map(formatQuestion),
 page,
 limit,
 total,
 totalPages: Math.ceil(total / limit),
 });
});

// GET /questions/:qId
// Show a specific question
router.get("/:qId", async (req, res) => {
 const qId = Number(req.params.qId);
 const question = await prisma.question.findUnique({
 where: { id: qId },
 include: {
 user: true,
 attempts: { where: { userId: req.user.userId, correct: true }, take: 1 },
 },
 });
 if (!question) {
 return res.status(404).json({ message: "Question not found" });
 }
 res.json(formatQuestion(question));
});

// POST /questions
// Create a new question
router.post("/", upload.single("image"), async (req, res) => {
 const { question, answer, keywords } = req.body;
 if (!question || !answer) {
 return res.status(400).json({
 message: "question and answer are required"
 });
 }
 const keywordsArray = keywords
 ? keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean)
 : [];
 const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
 const newQuestion = await prisma.question.create({
 data: { question, answer, keywords: keywordsArray, imageUrl, userId: req.user.userId }
 });
 res.status(201).json(newQuestion);
});

// PUT /questions/:qId
// Edit a question
router.put("/:qId", upload.single("image"), isOwner, async (req, res) => {
 const qId = Number(req.params.qId);
 const { question, answer, keywords } = req.body;
 if (!question || !answer) {
 return res.json({
 message: "question and answer are required"
 });
 }
 const data = { question, answer };
 if (keywords !== undefined) {
 data.keywords = keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
 }
 if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
 const updated = await prisma.question.update({
 where: { id: qId },
 data
 });
 res.json(updated);
});

// POST /questions/:qId/play
// Submit an answer
router.post("/:qId/play", async (req, res) => {
 const qId = Number(req.params.qId);
 const { answer } = req.body;
 const question = await prisma.question.findUnique({ where: { id: qId } });
 if (!question) {
 return res.status(404).json({ message: "Question not found" });
 }
 const correct = answer?.trim().toLowerCase() === question.answer.trim().toLowerCase();
 const attempt = await prisma.attempt.create({
 data: { correct, submittedAnswer: answer, userId: req.user.userId, questionId: qId },
 });
 res.status(201).json({
 id: attempt.id,
 correct,
 submittedAnswer: answer,
 correctAnswer: question.answer,
 createdAt: attempt.createdAt,
 });
});

// DELETE /questions/:qId
// Delete a question
router.delete("/:qId", isOwner, async (req, res) => {
 const qId = Number(req.params.qId);
 await prisma.attempt.deleteMany({ where: { questionId: qId } });
 await prisma.question.delete({ where: { id: qId } });
 res.json({
 message: "Question deleted successfully",
 question: req.question
 });
});

router.use((err, req, res, next) => {
 if (err instanceof multer.MulterError || err?.message === "Only image files are allowed") {
 return res.status(400).json({ message: err.message });
 }
 next(err);
});

module.exports = router;
