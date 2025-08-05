const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('./models');
const app = express();


const cors = require('cors');
const allowedOrigins = ['https://lechebronca.com', 'http://localhost:5173'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: false 
}));

app.options(/^\/.*$/, cors());

app.use(express.json());
//validar codigo
app.post('/admin/validar-codigo', async (req, res) => {
  const { codigo } = req.body;

  if (!codigo) {
    return res.status(400).json({ acceso: false, mensaje: 'Código requerido' });
  }

  try {
    // Busca en la tabla admins si existe el código
    const admin = await db.Admin.findOne({ where: { codigo } });

    if (admin) {
      return res.json({ acceso: true, mensaje: 'Código válido' });
    } else {
      return res.status(401).json({ acceso: false, mensaje: 'Código incorrecto' });
    }
  } catch (error) {
    console.error('Error en validar código:', error);
    return res.status(500).json({ acceso: false, mensaje: 'Error interno del servidor' });
  }
});

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
    const { filename, fechaPublicacion, mesPublicacion } = req.body;

    console.log('BODY:', req.body);
    const parsedFecha = parseInt(fechaPublicacion, 10);

    if (!file || !filename || !fechaPublicacion || !mesPublicacion) {
      return res.status(400).json({ message: 'Faltan datos: imagen, nombre, fecha o mes de publicación.' });
    }

    if (isNaN(parsedFecha) || parsedFecha < 1900 || parsedFecha > new Date().getFullYear() + 1) {
      return res.status(400).json({ message: 'Fecha de publicación inválida' });
    }

    const image = await db.Image.create({
      filename,
      filepath: `/uploads/${file.filename}`,
      fechaPublicacion: parsedFecha,
      mesPublicacion // ← nuevo campo guardado
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

app.get('/images/:id', async (req, res) => {
  try {
    const image = await db.Image.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    return res.json(image);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/images/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCount = await db.Image.destroy({ where: { id } });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json({ mensaje: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
});
// Ruta para fotos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// comentarios
app.get('/images/:id/comments', async (req, res) => {
  try {
    const comentarios = await db.Comment.findAll({ where: { imageId: req.params.id } });
    res.json(comentarios);
  } catch (error) {
    console.error('GET /images/:id/comments →', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Crear nuevo comentario
app.post('/images/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    const imageId = req.params.id;

    if (!content || !imageId) {
      return res.status(400).json({ error: 'Faltan datos para crear comentario' });
    }

    const newComment = await db.Comment.create({ content, imageId });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error al crear comentario:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
});

// publicar articulos
app.post('/articles', async (req, res) => {
  try {
    const { titulo, texto, fechaPublicacion } = req.body;

    console.log('BODY:', req.body);
    const parsedFecha = parseInt(fechaPublicacion, 10);

    if (!titulo || !texto || !fechaPublicacion) {
      return res.status(400).json({ message: 'Faltan datos: título, texto o fecha de publicación.' });
    }

    if (isNaN(parsedFecha) || parsedFecha < 1900 || parsedFecha > new Date().getFullYear() + 1) {
      return res.status(400).json({ message: 'Fecha de publicación inválida' });
    }

    const article = await db.Article.create({
      titulo,
      texto,
      fechaPublicacion: parsedFecha
    });

    res.status(201).json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ver articulos
app.get('/articles', async (req, res) => {
  try {
    const articles = await db.Article.findAll();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const article = await db.Article.findByPk(id);

    if (!article) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// eliminar articulos
app.delete('/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCount = await db.Article.destroy({ where: { id } });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Articulo no encontrado' });
    }

    res.json({ mensaje: 'Articulo eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el articulo' });
  }
});

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
