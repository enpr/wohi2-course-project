require("dotenv/config");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const seedQuestions = [
 {
 question: "What does HTTP stand for?",
 answer: "HyperText Transfer Protocol",
 keywords: ["http", "web"],
 },
 {
 question: "Which HTTP method is used to retrieve data?",
 answer: "GET",
 keywords: ["http", "api"],
 },
 {
 question: "What is the default port for HTTPS?",
 answer: "443",
 keywords: ["http", "web"],
 },
 {
 question: "What does REST stand for?",
 answer: "Representational State Transfer",
 keywords: ["api", "rest"],
 },
];
async function main() {
 await prisma.question.deleteMany();
 await prisma.user.deleteMany();
 const hashedPassword = await bcrypt.hash("1234", 10);
 const user = await prisma.user.create({
 data: {
 email: "admin@example.com",
 password: hashedPassword,
 name: "Admin User",
 },
 });
 console.log("Created user:", user.email);
 for (const q of seedQuestions) {
 await prisma.question.create({
 data: {
 question: q.question,
 answer: q.answer,
 keywords: q.keywords,
 userId: user.id,
 },
 });
 }
 console.log("Seeded 4 questions");
}
main()
 .catch((e) => {
 console.error(e);
 process.exit(1);
 })
 .finally(async () => {
 await prisma.$disconnect();
 });
