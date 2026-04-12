const express = require('express');
const app = express();
const questionsRouter = require("./routes/posts");
const PORT = process.env.PORT || 3000;
// Middleware to parse JSON bodies (will be useful in later steps)
app.use(express.json());

// everything under /api/questions
app.use("/api/questions", questionsRouter);
app.use((req, res) => {
 res.json({msg: "Not found"});
});

//// Hello World route
//app.get('/', (req, res) => {
// res.json({ message: 'Hello, World!' });
//});
//// Health check route
//app.get('/health', (req, res) => {
// res.json({ status: 'ok', timestamp: new Date().toISOString() });
//});

// Start the server
app.listen(PORT, () => {
 console.log(`Server is running on http://localhost:${PORT}`);
});