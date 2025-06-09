const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Almacenar archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Subir imagen
app.post('/images', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const { filename, fechaPublicacion } = req.body;

    console.log('BODY:', req.body);
    const parsedFecha = parseInt(fechaPublicacion, 10);
    console.log('FECHA (raw):', fechaPublicacion, 'FECHA (parsed):', parsedFecha);

    if (!file || !filename || !fechaPublicacion) {
      return res.status(400).json({ message: 'Faltan datos: imagen, nombre o fecha de publicación.' });
    }

    if (isNaN(parsedFecha) || parsedFecha < 1900 || parsedFecha > new Date().getFullYear() + 1) {
      return res.status(400).json({ message: 'Fecha de publicación inválida' });
    }

    const image = await db.Image.create({
      filename,
      filepath: `/uploads/${file.filename}`,
      fechaPublicacion: parsedFecha
    });

    res.json(image);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener imágenes
app.get('/images', async (req, res) => {
  try {
    const images = await db.Image.findAll();
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para acceder a los archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de prueba
app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'OK', message: 'API esta funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
