const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3');

const app = express();

// Apply CORS middleware to allow requests from the frontend
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(bodyParser.json());

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error('Error opening database', err);
  else console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT, completed BOOLEAN)');
});

app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/task', (req, res) => {
  const { description } = req.body;
  db.run('INSERT INTO tasks (description, completed) VALUES (?, ?)', [description, false], function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ id: this.lastID, description, completed: false });
    }
  });
});

app.put('/api/task/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      const newStatus = !row.completed;
      db.run('UPDATE tasks SET completed = ? WHERE id = ?', [newStatus, id], (err) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json({ id, description: row.description, completed: newStatus });
        }
      });
    }
  });
});

app.delete('/api/task/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(204).send();
    }
  });
});

app.delete('/api/tasks/completed', (req, res) => {
  db.run('DELETE FROM tasks WHERE completed = 1', [], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(204).send();
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});