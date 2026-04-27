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
 question: "question1",
 answer: "answer1",
 },
 {
 question: "question2",
 answer: "answer2",
 },
 {
 question: "question3",
 answer: "answer3",
 },
 {
 question: "question4",
 answer: "answer4",
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
