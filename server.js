const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد قاعدة البيانات
const db = new sqlite3.Database('./database.db');
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT,
      patient_phone TEXT,
      doctor TEXT,
      date TEXT,
      time_slot TEXT
    )
  `);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// حفظ موعد جديد
app.post('/book', (req, res) => {
  const { name, phone, doctor, date, time_slot } = req.body;

  db.get(`
    SELECT * FROM appointments
    WHERE doctor = ? AND date = ? AND time_slot = ?
  `, [doctor, date, time_slot], (err, row) => {
    if (row) {
      res.status(400).json({ message: 'هذا الموعد محجوز مسبقًا لنفس الدكتور' });
    } else {
      db.run(`
        INSERT INTO appointments (patient_name, patient_phone, doctor, date, time_slot)
        VALUES (?, ?, ?, ?, ?)
      `, [name, phone, doctor, date, time_slot], (err) => {
        if (err) {
          res.status(500).json({ message: 'حدث خطأ أثناء الحجز' });
        } else {
          res.json({ message: 'تم حجز الموعد بنجاح' });
        }
      });
    }
  });
});

// عرض كل المواعيد
app.get('/appointments', (req, res) => {
  db.all('SELECT * FROM appointments ORDER BY date, time_slot', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
    } else {
      res.json(rows);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
