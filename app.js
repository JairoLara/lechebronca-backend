const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./models');

const app = express();
app.use(cors());
app.use(express.json());


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/images', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const image = await db.Image.create({
      filename: file.filename,
      filepath: `/uploads/${file.filename}`
    });
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/images', async (req, res) => {
  try {
    const images = await db.Image.findAll();
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'OK', message: 'API está funcionando' });
});

