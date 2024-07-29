import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sequelize from './config/database.js';
import Image from './models/Image.js';
import PriceHistory from './models/PriceHistory.js';
import { Sequelize, Op } from 'sequelize';
import axios from 'axios';
import populateDatabase from './populateDatabase.js';
import { check, validationResult } from 'express-validator';
import crypto from 'crypto';
import moment from 'moment';
import CryptoJS from 'crypto-js';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, child } from 'firebase/database';

const app = express();
const port = 3000;

const SECRET_KEY = '5229c0e71dddc98e14e7053988c57d20901e060b7d713ed4ccd5656c9192f47f';
const IPINFO_API_KEY = '206743870a9fbf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const visitCountPath = path.join(__dirname, 'public', 'visitCount.json')
const votesCountPath = path.join(__dirname, 'public', 'votesCount.json')
const discordInfoPath = path.join(__dirname, 'public', 'discordInfo.json')

app.enable('trust proxy');

// Configura el middleware de sesión
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Asegúrate de configurar 'secure' en true si usas HTTPS
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 1000,
    message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

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

app.use(sqlInjectionMiddleware);

async function checkIPWithIpinfo(ip) {
    const url = `https://ipinfo.io/${ip}?token=${IPINFO_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching IP data from ipinfo:', error);
        return null;
    }
}

async function isProxy(ip) {
    const ipInfo = await checkIPWithIpinfo(ip);
    if (!ipInfo) return false;

    if (ipInfo.bogon) return true;
    if (ipInfo.proxy || ipInfo.vpn || ipInfo.tor || ipInfo.relay || ipInfo.hosting) return true;
    if (ipInfo.company && ipInfo.company.type === 'hosting') return true;
    if (ipInfo.asn && ipInfo.asn.type === 'hosting') return true;
    return false;
}

app.get('/verify-ip', async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    console.log(`Checking IP: ${ip}`);
    const ipInfo = await checkIPWithIpinfo(ip);
    console.log(`IP Info: ${JSON.stringify(ipInfo)}`);

    /*if (await isProxy(ip)) {
        return res.status(403).json({ error: 'Access forbidden: Proxy, VPN or Tor detected' });
    }*/

    req.session.ipVerified = true;
    res.status(200).json({ message: 'IP verified successfully' });
});

let ipVotes = {};
let ipVotes_belief = {};

function generateApiKey() {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const expirationDate = moment().add(5, 'seconds').toISOString();
    return { apiKey, expirationDate };
}

let { apiKey, expirationDate } = generateApiKey();

function apiKeyMiddleware(req, res, next) {
    const providedApiKey = req.headers['x-api-key'];
    const currentDate = new Date().toISOString();

    if (!providedApiKey || providedApiKey !== apiKey || currentDate > expirationDate) {
        return res.status(403).json({ error: 'Forbidden: Invalid or expired API Key' });
    }
    next();
}

app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

app.get('/api-key', (req, res) => {
    const newKeyData = generateApiKey();
    apiKey = newKeyData.apiKey;
    expirationDate = newKeyData.expirationDate;
    const response = { apiKey, expirationDate };
    res.json({ token: encryptData(response) });
});

app.use('/latest-price-update', apiKeyMiddleware);
app.use('/images', apiKeyMiddleware);
app.use('/price-history/:productId', apiKeyMiddleware);
app.use('/images/:id/vote', apiKeyMiddleware);

function encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}

app.use(express.static('public'));

async function getVipPrice() {
    try {
        const vipItem = await Image.findOne({ where: { name: 'El Club Sofa' } });
        return vipItem ? vipItem.price : null;
    } catch (error) {
        console.error('Error retrieving VIP price:', error);
        return null;
    }
}

async function getVipPriceOnDate(date) {
    try {
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);
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

async function getCatalog() {
    try {
        const response_catalog = await axios.get('https://airedale-summary-especially.ngrok-free.app/habbo-catalog')
            .catch(error => {
                console.warn('Error fetching catalog, using local file:', error.message);
                return null;
            });

        if (response_catalog) {
            const prices = response_catalog.data;
            const jsonContent_catalog = JSON.stringify(prices, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json'), jsonContent_catalog, 'utf8');
        }

        const response_prices = await axios.get('https://airedale-summary-especially.ngrok-free.app/habbo-price-history')
            .catch(error => {
                console.warn('Error fetching price history, using local file:', error.message);
                return null;
            });

        if (response_prices) {
            const pricesHistory = response_prices.data;
            const jsonContent_pricesHistory = JSON.stringify(pricesHistory, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'precios', 'precios_historico.json'), jsonContent_pricesHistory, 'utf8');
        }

        await populateDatabase();
    } catch (error) {
        console.error('Error fetching and storing prices:', error);
    }
}

async function fetchAndStoreHabboOnline() {
    try {
        const response_online = await axios.get('https://airedale-summary-especially.ngrok-free.app/habbo-online')
            .catch(error => {
                console.warn('Error fetching habbo online data, using local file:', error.message);
                return null;
            });

        if (response_online) {
            const onlineData = response_online.data;
            const jsonContent_online = JSON.stringify(onlineData, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'precios', 'habbo_online.json'), jsonContent_online, 'utf8');
        }
    } catch (error) {
        console.error('Error fetching and storing habbo online data:', error);
    }
}

async function updateVisitCount() {
    try {
        // Hacer la solicitud a la URL externa para obtener el contador de visitas
        const response = await axios.get('https://airedale-summary-especially.ngrok-free.app/contador-visitas');
        const externalVisitData = response.data;

        console.log(response);
        // Si la respuesta no contiene el contador de visitas, usar 0 como valor por defecto
        const externalVisitCount = externalVisitData.contador_visitas !== undefined ? externalVisitData.contador_visitas : 0;
        console.log(externalVisitCount);

        // Actualizar el contador de visitas en el archivo, siempre usando externalVisitCount
        fs.readFile(visitCountPath, 'utf8', (err, data) => {
            let updatedVisitCount = externalVisitCount;

            if (err) {
                if (err.code === 'ENOENT') {
                    // Si el archivo no existe, lo creamos con el contador de visitas externo
                    fs.writeFileSync(visitCountPath, JSON.stringify({ visits: updatedVisitCount }), 'utf8');
                    console.log('Archivo visitCount.json creado con:', updatedVisitCount);
                } else {
                    console.error('Error reading visit count:', err);
                    return;
                }
            } else {
                // Actualizar el archivo existente con el nuevo valor de externalVisitCount
                const localVisitData = JSON.parse(data || '{}');
                localVisitData.visits = updatedVisitCount;

                console.log(localVisitData);
                fs.writeFile(visitCountPath, JSON.stringify(localVisitData), 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing visit count:', err);
                    } else {
                        console.log('Archivo visitCount.json actualizado con:', updatedVisitCount);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error fetching visit count from external source:', error);

        // Si hay un error, establecer el contador de visitas en 0
        fs.writeFile(visitCountPath, JSON.stringify({ visits: 0 }), 'utf8', (err) => {
            if (err) {
                console.error('Error writing visit count:', err);
            }
        });
    }
}

async function updateVotesCount() {
    try {
        // Hacer la solicitud a la URL externa para obtener el contador de votos
        const response = await axios.get('https://airedale-summary-especially.ngrok-free.app/contador-votos');
        const externalVotesCount = response.data;

        console.log(response);
        // Si la respuesta no contiene el contador de votos, usar 0 como valor por defecto
        const responseVotesCount = externalVotesCount.contador_votos !== undefined ? externalVotesCount.contador_votos : 0;
        console.log(responseVotesCount);

        // Actualizar el contador de votos en el archivo, siempre usando responseVotesCount
        fs.readFile(votesCountPath, 'utf8', (err, data) => {
            let updatedVotesCount = responseVotesCount;

            if (err) {
                if (err.code === 'ENOENT') {
                    // Si el archivo no existe, lo creamos con el contador de votos externo
                    fs.writeFileSync(votesCountPath, JSON.stringify({ votes: updatedVotesCount }), 'utf8');
                    console.log('Archivo votesCount.json creado con:', updatedVotesCount);
                } else {
                    console.error('Error reading votes count:', err);
                    return;
                }
            } else {
                // Actualizar el archivo existente con el nuevo valor de responseVotesCount
                const localVotesData = JSON.parse(data || '{}');
                localVotesData.votes = updatedVotesCount;

                console.log(localVotesData);
                fs.writeFile(votesCountPath, JSON.stringify(localVotesData), 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing votes count:', err);
                    } else {
                        console.log('Archivo votesCount.json actualizado con:', updatedVotesCount);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error fetching votes count from external source:', error);

        // Si hay un error, establecer el contador de votos en 0
        fs.writeFile(votesCountPath, JSON.stringify({ votes: 0 }), 'utf8', (err) => {
            if (err) {
                console.error('Error writing votes count:', err);
            }
        });
    }
}

async function syncDiscord() {
    try {
        // Fetch the data from the Discord API
        const response = await axios.get('https://discord.com/api/guilds/1257448055050080297/widget.json');
        const externalInfoDiscord = response.data;

        // Save the data to the discordInfo.json file
        fs.writeFile(discordInfoPath, JSON.stringify(externalInfoDiscord, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing to discordInfo.json:', err);
            } else {
                console.log('discordInfo.json has been updated with the latest Discord data.');
            }
        });
    } catch (error) {
        console.error('Error fetching data from Discord API:', error);
    }
}


app.use((req, res, next) => {
    next();
});

app.get('/images', async (req, res) => {
    try {
        if (!req.session.ipVerified) {
            return res.status(403).json({ error: 'IP not verified' });
        }

        await updateVisitCount();
        await updateVotesCount();
        await syncDiscord();

        const today = moment().tz('America/Argentina/Buenos_Aires').set({hour: 23, minute: 59, second: 59, millisecond: 999});
        const startDate = today.clone().subtract(16, 'days');

        const priceHistories = await PriceHistory.findAll({
            where: {
                fecha_precio: {
                    [Op.gte]: startDate,
                    [Op.lt]: today
                }
            },
            order: [['productId'], ['fecha_precio', 'DESC']]
        });

        const images = await Image.findAll();
        const vip_price = await getVipPrice();

        const imagesWithDetails = images.map(image => {
            const priceHistory = priceHistories.filter(ph => ph.productId === image.id);
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

            return {
                ...image.toJSON(),
                vip_price: vip_price,
                status: status,
                fecha_precio: priceHistory[0] ? priceHistory[0].fecha_precio : null,
                precio: priceHistory[0] ? priceHistory[0].precio : null
            };
        });

        imagesWithDetails.sort((a, b) => {
            if (a.hot == 1 && b.hot != 1) return -1;
            if (a.hot != 1 && b.hot == 1) return 1;

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
                as: 'image',
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
                name: record.image ? record.image.name : null,
                icon: record.image ? record.image.icon : null,
                descripcion: record.image ? record.image.descripcion : null,
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
        const { voteType } = req.body;
        const forwardedIps = req.headers['x-forwarded-for'];
        let ip = '';

        if (forwardedIps) {
            const ipsArray = forwardedIps.split(',').map(ip => ip.trim());
            ip = `${ipsArray[0] || ''}-${ipsArray[1] || ''}`.trim();
        } else {
            ip = req.connection.remoteAddress;
        }

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

        if (!ipVotes[ip]) {
            ipVotes[ip] = [];
        }
        ipVotes[ip].push(imageId);

        const response = await axios.post('https://airedale-summary-especially.ngrok-free.app/habbo-votes', {
            upvotes: image.upvotes,
            downvotes: image.downvotes,
            id: imageId
        });

        const ngrokData = response.data;

        res.json({ 
            token: encryptData({ upvotes: image.upvotes, downvotes: image.downvotes, contador_votos: ngrokData[0].contador_votos})
        });
    } catch (error) {
        console.error('Error voting on image:', error);
        res.status(500).send('Error voting on image');
    }
});

app.post('/images/:id/vote-belief', [
    check('voteType').isIn(['upprice', 'downprice']).withMessage('Invalid vote type'),
    check('id').isInt().withMessage('Invalid ID')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const imageId = req.params.id;
        const { voteType } = req.body;
        const forwardedIps = req.headers['x-forwarded-for'];
        let ip = '';

        if (forwardedIps) {
            const ipsArray = forwardedIps.split(',').map(ip => ip.trim());
            ip = `${ipsArray[0] || ''}-${ipsArray[1] || ''}`.trim();
        } else {
            ip = req.connection.remoteAddress;
        }

        if (ipVotes_belief[ip] && ipVotes_belief[ip].includes(imageId)) {
            return res.status(403).json({ error: 'Ya has votado en este artículo' });
        }

        const image = await Image.findByPk(imageId);

        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        if (voteType === 'upprice') {
            image.upvotes_belief += 1;
        } else if (voteType === 'downprice') {
            image.downvotes_belief += 1;
        }

        await image.save();

        if (!ipVotes_belief[ip]) {
            ipVotes_belief[ip] = [];
        }
        ipVotes_belief[ip].push(imageId);

        const response = await axios.post('https://airedale-summary-especially.ngrok-free.app/habbo-votes-belief', {
            upvotes_belief: image.upvotes_belief,
            downvotes_belief: image.downvotes_belief,
            id: imageId
        });

        const ngrokData = response.data;

        res.json({ token: encryptData({ 
            upvotes_belief: image.upvotes_belief, 
            downvotes_belief: image.downvotes_belief,
            contador_votos: ngrokData[0].contador_votos
        }) });
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

app.get('/get-songs', (req, res) => {
    const musicDir = path.join(__dirname, 'public/sonidos/musica');
    fs.readdir(musicDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading music directory');
        }

        const songs = files.map(file => ({
            name: path.basename(file, path.extname(file)),
            path: `/sonidos/musica/${file}`
        }));

        res.json(songs);
    });
});

app.get('/furnis/sorteos/pagos', (req, res) => {
    const directoryPath = path.join(__dirname, 'public/furnis/sorteos/pagos');
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        res.json(files);
    });
});

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

const firebaseConfig = {
    apiKey: "AIzaSyAldNScIrt21pLLf6Q4-y1mN88--bYhYCY",
    authDomain: "habbos-68e47.firebaseapp.com",
    databaseURL: "https://habbos-68e47-default-rtdb.firebaseio.com",
    projectId: "habbos-68e47",
    storageBucket: "habbos-68e47.appspot.com",
    messagingSenderId: "617135519302",
    appId: "1:617135519302:web:ccd6d60f01220fc0923c47"
};

const appFirebase = initializeApp(firebaseConfig);
const database = getDatabase(appFirebase);

app.get('/fetch-firebase-data', async (req, res) => {
    try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'furniture'));
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.status(404).json({ error: 'No data available' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from Firebase' });
    }
});
