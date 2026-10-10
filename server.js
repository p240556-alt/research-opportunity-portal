// server.js
// Starts the web server and checks that the database is reachable.

require('dotenv').config();
const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Lets the server read JSON sent in request bodies (needed later for POST and PUT)
app.use(express.json());

// Serves the frontend files from the "public" folder (we will build it later)
app.use(express.static('public'));

// A simple test route to check the server and database
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ message: 'Server and database are working' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});