const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === "/api/health") {
    res.writeHead(200);
    return res.end(JSON.stringify({
      name: "Nova AI",
      version: "V2",
      status: "Backend ready",
      aiModelConnected: false
    }));
  }

  res.writeHead(200);
  res.end(JSON.stringify({
    message: "Welcome to Nova AI V2",
    status: "Backend running"
  }));
});

server.listen(PORT, () => {
  console.log(`Nova AI running on port ${PORT}`);
});
