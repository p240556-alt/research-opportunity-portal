// server.js
// Research Opportunity Portal: backend API

require('dotenv').config();
const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Lets the server read JSON sent in request bodies
app.use(express.json());

// Serves the frontend files from the "public" folder (we will build it later)
app.use(express.static('public'));

// ---------- Validation helpers ----------

const VALID_STATUSES = ['Open', 'Closed'];

// Maximum text lengths (these match the columns in the database)
const TEXT_FIELDS = {
  title: 200,
  description: 5000,
  research_area: 100,
  faculty_name: 100,
  department: 100,
  required_skills: 255,
};

// Checks a date written as YYYY-MM-DD, such as "2026-12-15"
function isValidDate(text) {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Returns a list of problems. An empty list means the data is valid.
function validateOpportunity(data) {
  const errors = [];

  for (const field in TEXT_FIELDS) {
    const value = data[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(field + ' is required');
    } else if (value.trim().length > TEXT_FIELDS[field]) {
      errors.push(field + ' must be at most ' + TEXT_FIELDS[field] + ' characters');
    }
  }

  if (!Number.isInteger(data.available_positions) || data.available_positions < 0) {
    errors.push('available_positions must be a whole number, 0 or more');
  }

  if (!isValidDate(data.application_deadline)) {
    errors.push('application_deadline must be a valid date like 2026-12-15');
  }

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push("status must be 'Open' or 'Closed'");
  }

  return errors;
}

// ---------- Routes ----------

// Test route: checks the server and the database
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ message: 'Server and database are working' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// CREATE: add a new opportunity
app.post('/api/opportunities', async (req, res) => {
  try {
    const data = req.body || {};

    const errors = validateOpportunity(data);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const status = data.status || 'Open';

    const [result] = await pool.query(
      `INSERT INTO opportunities
        (title, description, research_area, faculty_name, department,
         required_skills, available_positions, application_deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title.trim(),
        data.description.trim(),
        data.research_area.trim(),
        data.faculty_name.trim(),
        data.department.trim(),
        data.required_skills.trim(),
        data.available_positions,
        data.application_deadline,
        status,
      ]
    );

    // Read the saved row back so the response includes the new id
    const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [
      result.insertId,
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while creating the opportunity' });
  }
});
// Turns the :id from the URL into a number. Returns null if it is not a whole number.
function parseId(value) {
  return /^\d+$/.test(value) ? Number(value) : null;
}

// READ ALL: get every opportunity
app.get('/api/opportunities', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM opportunities ORDER BY id ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while fetching opportunities' });
  }
});

// READ ONE: get a single opportunity by id
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'id must be a whole number' });
    }

    const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while fetching the opportunity' });
  }
});
// UPDATE: replace the data of an existing opportunity
app.put('/api/opportunities/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'id must be a whole number' });
    }

    const data = req.body || {};
    const errors = validateOpportunity(data);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Make sure the opportunity exists
    const [existing] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // If no status was sent, keep the current one
    const status = data.status || existing[0].status;

    await pool.query(
      `UPDATE opportunities
       SET title = ?, description = ?, research_area = ?, faculty_name = ?,
           department = ?, required_skills = ?, available_positions = ?,
           application_deadline = ?, status = ?
       WHERE id = ?`,
      [
        data.title.trim(),
        data.description.trim(),
        data.research_area.trim(),
        data.faculty_name.trim(),
        data.department.trim(),
        data.required_skills.trim(),
        data.available_positions,
        data.application_deadline,
        status,
        id,
      ]
    );

    // Send back the updated row
    const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [id]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while updating the opportunity' });
  }
});

// DELETE: remove an opportunity
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'id must be a whole number' });
    }

    const [existing] = await pool.query('SELECT id FROM opportunities WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    await pool.query('DELETE FROM opportunities WHERE id = ?', [id]);
    res.status(200).json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while deleting the opportunity' });
  }
});


// ---------- Start the server ----------

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});