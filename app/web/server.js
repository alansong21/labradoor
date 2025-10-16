// server/server.js
const express = require('express');
const app = express();
const port = 8000; // Or any other desired port

app.use(express.json()); // To parse JSON request bodies

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express API!' });
});

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});