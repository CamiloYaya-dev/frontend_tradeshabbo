const express = require('express');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const Image = require('./models/Image');
const PriceHistory = require('./models/PriceHistory');
const { Op } = require('sequelize');
const axios = require('axios');
const populateDatabase = require('./populateDatabase');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const moment = require('moment');
const CryptoJS = require('crypto-js');

const app = express();
const port = 3000;

const SECRET_KEY = 'your_secret_key'; // Replace with your actual secret key

// Middleware para analizar cuerpos de solicitudes JSON
app.use(express.json());

// Middleware para analizar datos de formulario
app.use(express.urlencoded({ extended: true }));

app.use(sqlInjectionMiddleware);

app.set('trust proxy', true);

let ipVotes = {};

function generateApiKey() {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const expirationDate = moment().add(5, 'seconds').toISOString();
    return { apiKey, expirationDate };
}

let { apiKey, expirationDate } = generateApiKey();

// Middleware de verificación de API Key con fecha de caducidad
function apiKeyMiddleware(req, res, next) {
    const providedApiKey = req.headers['x-api-key'];
    const currentDate = new Date().toISOString();

    if (!providedApiKey || providedApiKey !== apiKey || currentDate > expirationDate) {
        return res.status(403).json({ error: 'Forbidden: Invalid or expired API Key' });
    }
    next();
}

// Middleware para añadir el header ngrok-skip-browser-warning
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

// Ruta para obtener la API Key
app.get('/api-key', (req, res) => {
    const newKeyData = generateApiKey();
    apiKey = newKeyData.apiKey;
    expirationDate = newKeyData.expirationDate;
    const response = { apiKey, expirationDate };
    res.json({ token: encryptData(response) });
});

// Aplicar el middleware solo a las rutas que requieren la API Key
app.use('/latest-price-update', apiKeyMiddleware);
app.use('/images', apiKeyMiddleware);
app.use('/price-history/:productId', apiKeyMiddleware);
app.use('/images/:id/vote', apiKeyMiddleware);

async function getCatalog() {
    try {
        const response_catalog = await axios.get('https://airedale-summary-especially.ngrok-free.app/habbo-catalog')
            .catch(error => {
                console.warn('Error fetching catalog, using local file:', error.message);
                return null; // Retorna null en caso de error
            });

        if (response_catalog) {
            const prices = response_catalog.data;
            // Guardar el JSON en la ruta especificada
            const jsonContent_catalog = JSON.stringify(prices, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json'), jsonContent_catalog, 'utf8');
        }

        const response_prices = await axios.get('https://airedale-summary-especially.ngrok-free.app/habbo-price-history')
            .catch(error => {
                console.warn('Error fetching price history, using local file:', error.message);
                return null; // Retorna null en caso de error
            });

        if (response_prices) {
            const pricesHistory = response_prices.data;
            // Guardar el JSON en la ruta especificada
            const jsonContent_pricesHistory = JSON.stringify(pricesHistory, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'precios', 'precios_historico.json'), jsonContent_pricesHistory, 'utf8');
        }

        await populateDatabase(); // Asegúrate de esperar a que la base de datos se poble
    } catch (error) {
        console.error('Error fetching and storing prices:', error);
    }
}

async function fetchAndStoreHabboOnline() {
    try {
        const response_online = await axios.get('https://airedale-summary-especially.ngrok-free.app/habbo-online')
            .catch(error => {
                console.warn('Error fetching habbo online data, using local file:', error.message);
                return null; // Retorna null en caso de error
            });

        if (response_online) {
            const onlineData = response_online.data;
            // Guardar el JSON en la ruta especificada
            const jsonContent_online = JSON.stringify(onlineData, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'precios', 'habbo_online.json'), jsonContent_online, 'utf8');
        }
    } catch (error) {
        console.error('Error fetching and storing habbo online data:', error);
    }
}

// Middleware para servir archivos estáticos
app.use(express.static('public'));

async function getVipPrice() {
    try {
        const vipItem = await Image.findOne({ where: { name: 'El Club Sofa' } });
        return vipItem ? vipItem.price : null; // Asumimos que el campo de precio es 'price'
    } catch (error) {
        console.error('Error retrieving VIP price:', error);
        return null;
    }
}

async function getVipPriceOnDate(date) {
    try {
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999); // Obtener solo la fecha en formato YYYY-MM-DD
        const vipItemHistory = await PriceHistory.findOne({
            where: {
                productId: '1',
                fecha_precio: {
                    [Op.lte]: endOfDay
                }
            },
            order: [['fecha_precio', 'DESC']]
        });
        return vipItemHistory ? vipItemHistory.precio : null;
    } catch (error) {
        console.error('Error retrieving VIP price on date:', error);
        return null;
    }
}

// Encriptar los datos antes de enviarlos al cliente
function encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}

// Ruta para obtener imágenes desde la base de datos
app.get('/images', async (req, res) => {
    try {
        // Obtener la fecha actual
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Establecer el inicio del día
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 7); // Establecer el final del día

        // Obtener todas las imágenes
        const images = await Image.findAll();

        // Crear un arreglo para almacenar las imágenes con sus últimos precios y estatus calculado
        const imagesWithDetails = await Promise.all(images.map(async (image) => {
            // Obtener el historial de precios para la imagen actual de la fecha actual
            const priceHistory = await PriceHistory.findAll({
                where: {
                    productId: image.id,
                    fecha_precio: {
                        [Op.gte]: yesterday,
                        [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Hasta el final de hoy
                    }
                },
                order: [['fecha_precio', 'DESC']],
                limit: 2 // Necesitamos los dos últimos precios para calcular el estatus
            });

            // Calcular el estatus basado en los dos últimos precios
            let status = '';
            if (priceHistory.length > 1) {
                const actualPrice = priceHistory[0].precio;
                const previousPrice = priceHistory[1].precio;

                if (actualPrice > previousPrice) {
                    status = 'arrow_trend_up';
                } else {
                    status = 'arrow_trend_down';
                }
            }

            // Obtener el precio VIP
            const vip_price = await getVipPrice();

            // Devolver la imagen con el precio VIP y el estatus calculado
            return {
                ...image.toJSON(), // Convertir la instancia de Sequelize a objeto JSON
                vip_price: vip_price,
                status: status,
                fecha_precio: priceHistory[0] ? priceHistory[0].fecha_precio : null // Añadir la fecha del precio más reciente
            };
        }));

        // Ordenar las imágenes: primero los 'hot', luego por la fecha del historial de precios más reciente
        imagesWithDetails.sort((a, b) => {
            // Primero, ordenar por el campo 'hot'
            if (a.hot == 1 && b.hot != 1) return -1;
            if (a.hot != 1 && b.hot == 1) return 1;

            // Si ambos son 'hot' o ambos no son 'hot', ordenar por la fecha del historial de precios
            const dateA = a.fecha_precio ? new Date(a.fecha_precio) : new Date(0);
            const dateB = b.fecha_precio ? new Date(b.fecha_precio) : new Date(0);
            return dateB - dateA;
        });

        res.json({ token: encryptData(imagesWithDetails) });
    } catch (error) {
        console.error('Error retrieving images:', error);
        res.status(500).send('Error retrieving images');
    }
});


app.get('/price-history/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const history = await PriceHistory.findAll({
            order: [['fecha_precio', 'DESC']],
            where: { productId },
            include: [{
                model: Image,
                as: 'image', // Especifica el alias correcto aquí
                attributes: ['name', 'icon', 'descripcion']
            }]
        });
        const historyWithProductName = await Promise.all(history.map(async (record) => {
            const vipPriceOnDate = await getVipPriceOnDate(record.fecha_precio);
            return {
                id: record.id,
                productId: record.productId,
                fecha_precio: record.fecha_precio,
                precio: record.precio,
                name: record.image ? record.image.name : null, // Usar el alias correcto aquí
                icon: record.image ? record.image.icon : null, // Usar el alias correcto aquí
                descripcion: record.image ? record.image.descripcion : null, // Usar el alias correcto aquí
                vip_price: vipPriceOnDate
            };
        }));
        res.json({ token: encryptData(historyWithProductName) });
    } catch (error) {
        console.error('Error retrieving price history:', error);
        res.status(500).send('Error retrieving price history');
    }
});

app.post('/images/:id/vote', [
    check('voteType').isIn(['upvote', 'downvote']).withMessage('Invalid vote type'),
    check('id').isInt().withMessage('Invalid ID')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const imageId = req.params.id;
        const { voteType } = req.body; // 'upvote' or 'downvote'
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Verificar si la IP ya ha votado
        if (ipVotes[ip] && ipVotes[ip].includes(imageId)) {
            return res.status(403).json({ error: 'Ya has votado en este artículo' });
        }

        const image = await Image.findByPk(imageId);

        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        if (voteType === 'upvote') {
            image.upvotes += 1;
        } else if (voteType === 'downvote') {
            image.downvotes += 1;
        }

        await image.save();

        // Registrar la IP que ha votado
        if (!ipVotes[ip]) {
            ipVotes[ip] = [];
        }
        ipVotes[ip].push(imageId);

        await axios.post('https://airedale-summary-especially.ngrok-free.app/habbo-votes', {
            upvotes: image.upvotes,
            downvotes: image.downvotes,
            id: imageId
        });

        res.json({ token: encryptData({ upvotes: image.upvotes, downvotes: image.downvotes }) });
    } catch (error) {
        console.error('Error voting on image:', error);
        res.status(500).send('Error voting on image');
    }
});

app.get('/latest-price-update', async (req, res) => {
    try {
        const latestPrice = await PriceHistory.findOne({
            order: [['fecha_precio', 'DESC']],
            attributes: ['fecha_precio']
        });

        if (!latestPrice) {
            return res.status(404).json({ error: 'No price history found' });
        }

        res.json({ token: encryptData({ fecha_precio: latestPrice.fecha_precio }) });
    } catch (error) {
        console.error('Error retrieving latest price update:', error);
        res.status(500).send('Error retrieving latest price update');
    }
});

function sqlInjectionMiddleware(req, res, next) {
    const forbiddenWords = ['UPDATE', 'DELETE', 'INSERT', 'SELECT', 'DROP', 'ALTER'];
    let bodyString = JSON.stringify(req.body).toUpperCase();

    for (let word of forbiddenWords) {
        if (bodyString.includes(word)) {
            return res.status(400).json({ error: 'Request contains forbidden SQL keywords' });
        }
    }
    next();
}

app.listen(port, async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        await getCatalog();
        await fetchAndStoreHabboOnline();
        setInterval(fetchAndStoreHabboOnline, 3600000);

        console.log(`Servidor escuchando en http://localhost:${port}`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});
