const express = require('express');
const path = require('path');
const sequelize = require('./config/database');
const Image = require('./models/Image');
const app = express();
const port = 3000;

// Middleware para servir archivos estáticos
app.use(express.static('public'));

// Ruta para obtener imágenes desde la base de datos
app.get('/images', async (req, res) => {
    try {
        const images = await Image.findAll();
        res.json(images);
    } catch (error) {
        console.error('Error retrieving images:', error);
        res.status(500).send('Error retrieving images');
    }
});

app.listen(port, async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        console.log(`Servidor escuchando en http://localhost:${port}`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});
