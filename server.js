const express = require("express");
const pollsHandler = require("./api/polls");
const pollHandler = require("./api/polls/[pollId]");
const resultsHandler = require("./api/results/[pollId]");

const app = express();
app.use(express.json());

// SSE client registry
const sseClients = new Set();

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch (_) {}
  }
}

// Attach broadcast so API handlers can call it via req.broadcast
app.use((req, _res, next) => { req.broadcast = broadcast; next(); });

// SSE endpoint
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write("event: connected\ndata: {}\n\n");
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
});

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
