const express = require('express');
const path = require('path');
const sequelize = require('./config/database');
const Image = require('./models/Image');
const puppeteer = require('puppeteer');

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
        console.log('Launching Puppeteer');
        console.time('Time to fetch checkin count');  // Iniciar medición de tiempo
        
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-breakpad',
                '--disable-client-side-phishing-detection',
                '--disable-component-update',
                '--disable-default-apps',
                '--disable-domain-reliability',
                '--disable-features=AudioServiceOutOfProcess',
                '--disable-hang-monitor',
                '--disable-ipc-flooding-protection',
                '--disable-popup-blocking',
                '--disable-print-preview',
                '--disable-prompt-on-repost',
                '--disable-renderer-backgrounding',
                '--disable-sync',
                '--force-color-profile=srgb',
                '--metrics-recording-only',
                '--no-pings',
                '--password-store=basic',
                '--use-mock-keychain',
            ],
            headless: true,
        });

        const page = await browser.newPage();
        
        // Interceptar y abortar solicitudes de recursos de imágenes
        await page.setRequestInterception(true);
        page.on('request', request => {
            const resourceType = request.resourceType();
            const url = request.url();
            if (resourceType === 'image' || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif') || url.endsWith('.css') || url.endsWith('.json') || url.endsWith('.svg') || url.endsWith('.html')) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto('https://origins.habbo.es/', { waitUntil: 'networkidle0' });
        const htmlContent = await page.content();  // Obtener el contenido HTML
        console.log(htmlContent);  // Imprimir el contenido HTML en la consola

        const checkinCount = await page.$eval('.habbo__origins__checkin__count', el => el.textContent.trim());
        await browser.close();

        console.log(checkinCount);
        console.timeEnd('Time to fetch checkin count');  // Finalizar medición de tiempo
        res.json({ count: checkinCount });
    } catch (error) {
        console.error('Error fetching checkin count:', error);
        console.timeEnd('Time to fetch checkin count');  // Finalizar medición de tiempo en caso de error
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
