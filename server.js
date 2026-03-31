const express = require("express");
const pollsHandler = require("./api/polls");
const pollHandler = require("./api/polls/[pollId]");
const resultsHandler = require("./api/results/[pollId]");

const app = express();
app.use(express.json());

app.all("/api/polls", (req, res) => pollsHandler(req, res));
app.all("/api/polls/:pollId", (req, res) => {
  req.query.pollId = req.params.pollId;
  pollHandler(req, res);
});
app.get("/api/results/:pollId", (req, res) => {
  req.query.pollId = req.params.pollId;
  resultsHandler(req, res);
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
