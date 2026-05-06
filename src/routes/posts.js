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
 likeCount: question._count?.likes ?? 0,
 liked: question.likes ? question.likes.length > 0 : false,
 user: undefined,
 likes: undefined,
 _count: undefined,
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

 const where = {};

 const [questions, total] = await Promise.all([
 prisma.question.findMany({
 where,
 include: {
 user: true,
 likes: { where: { userId: req.user.userId }, take: 1 },
 _count: { select: { likes: true } },
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
 likes: { where: { userId: req.user.userId }, take: 1 },
 _count: { select: { likes: true } },
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
 const { question, answer } = req.body;
 if (!question || !answer) {
 return res.status(400).json({
 message: "question and answer are required"
 });
 }
 const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
 const newQuestion = await prisma.question.create({
 data: { question, answer, imageUrl, userId: req.user.userId }
 });
 res.status(201).json(newQuestion);
});

// PUT /questions/:qId
// Edit a question
router.put("/:qId", upload.single("image"), isOwner, async (req, res) => {
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
 const data = { question, answer };
 if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
 const updated = await prisma.question.update({
 where: { id: qId },
 data
 });
 res.json(updated);
});

// POST /questions/:qId/like
// Like a question
router.post("/:qId/like", async (req, res) => {
 const qId = Number(req.params.qId);
 const question = await prisma.question.findUnique({ where: { id: qId } });
 if (!question) {
 return res.status(404).json({ message: "Question not found" });
 }
 const like = await prisma.like.upsert({
 where: { userId_questionId: { userId: req.user.userId, questionId: qId } },
 update: {},
 create: { userId: req.user.userId, questionId: qId },
 });
 const likeCount = await prisma.like.count({ where: { questionId: qId } });
 res.status(201).json({
 id: like.id,
 questionId: qId,
 liked: true,
 likeCount,
 createdAt: like.createdAt,
 });
});

// DELETE /questions/:qId/like
// Unlike a question
router.delete("/:qId/like", async (req, res) => {
 const qId = Number(req.params.qId);
 const question = await prisma.question.findUnique({ where: { id: qId } });
 if (!question) {
 return res.status(404).json({ message: "Question not found" });
 }
 await prisma.like.deleteMany({
 where: { userId: req.user.userId, questionId: qId },
 });
 const likeCount = await prisma.like.count({ where: { questionId: qId } });
 res.json({ questionId: qId, liked: false, likeCount });
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

router.use((err, req, res, next) => {
 if (err instanceof multer.MulterError || err?.message === "Only image files are allowed") {
 return res.status(400).json({ message: err.message });
 }
 next(err);
});

module.exports = router;
