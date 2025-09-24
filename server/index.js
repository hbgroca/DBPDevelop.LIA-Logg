// Enkel Node.js/Express-backend för att ta emot JSON och bilder
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Multer setup för bilduppladdning
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Endpoint för att spara JSON-data
app.post('/upload-json', (req, res) => {
  const data = req.body;
  console.log(data);
  const filePath = path.join(__dirname, '../public/data.json');
  fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
    if (err) return res.status(500).json({ error: 'Kunde inte spara JSON.' });
    res.json({ message: 'JSON sparad!' });
  });
});

// Endpoint för att hämta JSON-data
app.get('/download-json', (req, res) => {
  const filePath = path.join(__dirname, '../public/data.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Ingen JSON hittades.' });
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

// Endpoint för att ladda upp bild
app.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ingen bild bifogad.' });
  res.json({ message: 'Bild uppladdad!', filename: req.file.filename });
});

// Endpoint för att ta bort en bild
app.delete('/delete-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../public/images', filename);
  fs.unlink(filePath, err => {
    if (err) return res.status(404).json({ error: 'Kunde inte hitta eller ta bort bilden.' });
    res.json({ message: 'Bild borttagen!' });
  });
});

app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});
