const { resetDb, registerAndLogin, createQuestion, request, app, prisma } = require("./helpers");

beforeEach(resetDb);

describe("questions", () => {
 it("returns 401 without a token", async () => {
 const res = await request(app).get("/api/questions");
 expect(res.status).toBe(401);
 });

 it("returns paginated list with correct shape", async () => {
 const token = await registerAndLogin();
 const res = await request(app).get("/api/questions")
 .set("Authorization", `Bearer ${token}`);
 expect(res.status).toBe(200);
 expect(res.body).toMatchObject({
 data: expect.any(Array),
 page: 1,
 limit: 5,
 total: expect.any(Number),
 totalPages: expect.any(Number),
 });
 });

 it("returns 404 for unknown question", async () => {
 const token = await registerAndLogin();
 const res = await request(app).get("/api/questions/99999")
 .set("Authorization", `Bearer ${token}`);
 expect(res.status).toBe(404);
 expect(res.body.message).toBe("Question not found");
 });

 it("returns 400 for invalid question body", async () => {
 const token = await registerAndLogin();
 const res = await request(app).post("/api/questions")
 .set("Authorization", `Bearer ${token}`)
 .send({ question: "" });
 expect(res.status).toBe(400);
 });

 it("creates a question and returns 201", async () => {
 const token = await registerAndLogin();
 const res = await request(app).post("/api/questions")
 .set("Authorization", `Bearer ${token}`)
 .send({ question: "What is 2+2?", answer: "4" });
 expect(res.status).toBe(201);
 expect(res.body.id).toEqual(expect.any(Number));
 });

 it("returns 403 when editing someone else's question", async () => {
 const aliceToken = await registerAndLogin("alice@test.io", "Alice");
 const question = await createQuestion(aliceToken, { question: "Alice's question", answer: "A" });
 const bobToken = await registerAndLogin("bob@test.io", "Bob");
 const res = await request(app).put(`/api/questions/${question.id}`)
 .set("Authorization", `Bearer ${bobToken}`)
 .send({ question: "hijacked", answer: "x" });
 expect(res.status).toBe(403);
 const after = await prisma.question.findUnique({ where: { id: question.id } });
 expect(after.question).toBe("Alice's question");
 });

 it("returns 403 when deleting someone else's question", async () => {
 const aliceToken = await registerAndLogin("alice@test.io", "Alice");
 const question = await createQuestion(aliceToken);
 const bobToken = await registerAndLogin("bob@test.io", "Bob");
 const res = await request(app).delete(`/api/questions/${question.id}`)
 .set("Authorization", `Bearer ${bobToken}`);
 expect(res.status).toBe(403);
 });
});

describe("play", () => {
 it("returns correct: true for matching answer", async () => {
 const token = await registerAndLogin();
 const question = await createQuestion(token, { question: "What is 2+2?", answer: "4" });
 const res = await request(app).post(`/api/questions/${question.id}/play`)
 .set("Authorization", `Bearer ${token}`)
 .send({ answer: "4" });
 expect(res.status).toBe(201);
 expect(res.body.correct).toBe(true);
 });

 it("returns correct: false for wrong answer", async () => {
 const token = await registerAndLogin();
 const question = await createQuestion(token, { question: "What is 2+2?", answer: "4" });
 const res = await request(app).post(`/api/questions/${question.id}/play`)
 .set("Authorization", `Bearer ${token}`)
 .send({ answer: "5" });
 expect(res.status).toBe(201);
 expect(res.body.correct).toBe(false);
 });

 it("marks a question as solved after a correct attempt", async () => {
 const token = await registerAndLogin();
 const question = await createQuestion(token, { question: "What is 2+2?", answer: "4" });
 const before = await request(app).get(`/api/questions/${question.id}`)
 .set("Authorization", `Bearer ${token}`);
 expect(before.body.solved).toBe(false);
 await request(app).post(`/api/questions/${question.id}/play`)
 .set("Authorization", `Bearer ${token}`)
 .send({ answer: "4" });
 const after = await request(app).get(`/api/questions/${question.id}`)
 .set("Authorization", `Bearer ${token}`);
 expect(after.body.solved).toBe(true);
 });
});
