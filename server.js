const express = require('express');
const path = require('path');
const sequelize = require('./config/database');
const Image = require('./models/Image');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

const app = express();
const port = 3000;

// Middleware para añadir el header ngrok-skip-browser-warning
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

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

// Ruta para obtener el count de checkin
app.get('/api/checkin-count', async (req, res) => {
    try {
        let browser;
        if (process.env.NODE_ENV === 'production') {
            browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
            });
        } else {
            browser = await puppeteer.launch({
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Ruta al ejecutable de Chrome en Windows
                headless: true,
            });
        }

        const page = await browser.newPage();
        await page.goto('https://origins.habbo.es/', { waitUntil: 'networkidle0' });
        const checkinCount = await page.$eval('.habbo__origins__checkin__count', el => el.textContent.trim());
        await browser.close();

        console.log(process.env.NODE_ENV);
        console.log(checkinCount);
        res.json({ count: checkinCount });
    } catch (error) {
        console.error('Error fetching checkin count:', error);
        res.status(500).send('Error fetching checkin count');
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
