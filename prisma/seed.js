require("dotenv/config");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
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
 for (const q of seedQuestions) {
 await prisma.question.create({
 data: {
 question: q.question,
 answer: q.answer,
 },
 });
 }
 console.log("Seed data inserted successfully");
}
main()
 .catch((e) => {
 console.error(e);
 process.exit(1);
 })
 .finally(() => prisma.$disconnect());
