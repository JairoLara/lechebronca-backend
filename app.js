const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./models');

const cors = require('cors');
app.use(cors({
  origin: ['https://lechebronca.com'], // o '*' si estás en pruebas
  methods: ['GET', 'POST'],
  credentials: false
}));

app.use(express.json());
const app = express();
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

// Ruta para fotos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// admin
app.post('/admin/entrar', async (req, res) => {
  const { codigo } = req.body;
  if (!codigo) return res.status(400).json({ mensaje: 'Código requerido', acceso: false });

  try {
    let admin = await db.Admin.findOne();

    if (!admin) {
      await db.Admin.create({ codigo });
      return res.json({ mensaje: 'Código guardado exitosamente', acceso: true });
    }

    if (admin.codigo === codigo) {
      return res.json({ mensaje: 'Acceso concedido', acceso: true });
    } else {
      return res.status(401).json({ mensaje: 'Código incorrecto', acceso: false });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor', acceso: false });
  }
});

// Ruta de prueba
app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'OK', message: 'API esta funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
