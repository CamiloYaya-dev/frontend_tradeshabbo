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
import request from 'request';
import cheerio from 'cheerio';
import { Client, GatewayIntentBits, REST, Routes, Collection } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType, AttachmentBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { postTweet, postMultilingualTweets } from './twitterClient.mjs';
import { generateSummaryWeb } from './openaiClient.mjs';
import { format } from 'date-fns';
import jwt from 'jsonwebtoken';
import puppeteer from 'puppeteer';
import FormData from 'form-data';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import dayjs from 'dayjs';


dotenv.config();

const app = express();
const port = 3000;

const SECRET_KEY = '5229c0e71dddc98e14e7053988c57d20901e060b7d713ed4ccd5656c9192f47f';
const IPINFO_API_KEY = '206743870a9fbf';

const apiRestKey = process.env.API_REST_KEY;
const apiRestJWTKey = process.env.API_REST_JWT_KEY;

function generateJWT() {
    const payload = { apiKey: apiRestKey };
    return jwt.sign(payload, apiRestJWTKey, { expiresIn: '1m' });  // El token expira en 1 hora
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const visitCountPath = path.join(__dirname, 'public', 'visitCount.json')
const votesCountPath = path.join(__dirname, 'public', 'votesCount.json')
//const discordInfoPath = path.join(__dirname, 'public', 'discordInfo.json')

app.enable('trust proxy');

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Middleware para parsear cookies
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 5000, // Máximo de 5000 solicitudes
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
    const ipInfo = await checkIPWithIpinfo(ip);

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

// Middleware para desactivar cache del index.html
app.use((req, res, next) => {
    if (req.url === '/' || req.url.endsWith('index.html')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0'); // Opcional, para navegadores más antiguos
    }
    next();
});

app.use(express.static('public', {
    setHeaders: (res, path) => {
      if (path.endsWith('.js') || path.endsWith('.css')) {
        res.set('Cache-Control', 'max-age=31536000'); // Caché largo para recursos estáticos versionados
      }
    }
}));
  

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

async function getVipPriceUsa() {
    try {
        const vipItemUsa = await Image.findOne({ where: { name: 'El Club Sofa' } });
        return vipItemUsa ? vipItemUsa.usa_price : null;
    } catch (error) {
        console.error('Error retrieving VIP price:', error);
        return null;
    }
}

async function getPetalPrice() {
    try {
        const petalItem = await Image.findOne({ where: { name: 'El Cesped' } });
        return petalItem ? petalItem.price : null;
    } catch (error) {
        console.error('Error retrieving VIP price:', error);
        return null;
    }
}

async function getDinoPrice() {
    try {
        const dinoItem = await Image.findOne({ where: { name: 'Huevo De Dragon' } });
        return dinoItem ? dinoItem.usa_price : null;
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
    const token = generateJWT();
    try {
        const response_catalog = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/habbo-catalog', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(error => {
            console.warn('Error fetching catalog, using local file:', error.message);
            return null;
        });

        if (response_catalog) {
            const prices = response_catalog.data;
            const jsonContent_catalog = JSON.stringify(prices, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json'), jsonContent_catalog, 'utf8');
        }
        const token2 = generateJWT();
        const response_prices = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/habbo-price-history', {
            headers: {
                'Authorization': `Bearer ${token2}`
            }
        }).catch(error => {
            console.warn('Error fetching catalog, using local file:', error.message);
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
    const token = generateJWT();
    try {
        const response_online = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/habbo-online',{
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(error => {
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

async function fetchAndStoreNoticias() {
    const token = generateJWT();
    try {
        const response_noticias = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/noticias',{
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .catch(error => {
                console.warn('Error fetching noticias data, using local file:', error.message);
                return null;
            });

        if (response_noticias) {
            const noticiasData = response_noticias.data.data;
            const jsonContent_noticias = JSON.stringify(noticiasData, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'noticias', 'noticias.json'), jsonContent_noticias, 'utf8');
            console.log('Noticias data successfully fetched and stored.');
        }
    } catch (error) {
        console.error('Error fetching and storing noticias data:', error);
    }
}

async function updateVisitCount() {
    const token = generateJWT();
    try {
        const response = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/contador-visitas',{
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const externalVisitData = response.data;

        const externalVisitCount = externalVisitData.contador_visitas !== undefined ? externalVisitData.contador_visitas : 0;

        fs.readFile(visitCountPath, 'utf8', (err, data) => {
            let updatedVisitCount = externalVisitCount;

            if (err) {
                if (err.code === 'ENOENT') {
                    fs.writeFileSync(visitCountPath, JSON.stringify({ visits: updatedVisitCount }), 'utf8');
                } else {
                    console.error('Error reading visit count:', err);
                    return;
                }
            } else {
                const localVisitData = JSON.parse(data || '{}');
                localVisitData.visits = updatedVisitCount;

                fs.writeFile(visitCountPath, JSON.stringify(localVisitData), 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing visit count:', err);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error fetching visit count from external source:', error);

        fs.writeFile(visitCountPath, JSON.stringify({ visits: 0 }), 'utf8', (err) => {
            if (err) {
                console.error('Error writing visit count:', err);
            }
        });
    }
}

async function updateVotesCount() {
    const token = generateJWT();
    try {
        const response = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/contador-votos',{
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const externalVotesCount = response.data;

        const responseVotesCount = externalVotesCount.contador_votos !== undefined ? externalVotesCount.contador_votos : 0;

        fs.readFile(votesCountPath, 'utf8', (err, data) => {
            let updatedVotesCount = responseVotesCount;

            if (err) {
                if (err.code === 'ENOENT') {
                    fs.writeFileSync(votesCountPath, JSON.stringify({ votes: updatedVotesCount }), 'utf8');
                } else {
                    console.error('Error reading votes count:', err);
                    return;
                }
            } else {
                const localVotesData = JSON.parse(data || '{}');
                localVotesData.votes = updatedVotesCount;

                fs.writeFile(votesCountPath, JSON.stringify(localVotesData), 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing votes count:', err);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error fetching votes count from external source:', error);

        fs.writeFile(votesCountPath, JSON.stringify({ votes: 0 }), 'utf8', (err) => {
            if (err) {
                console.error('Error writing votes count:', err);
            }
        });
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
        //await syncDiscord();

        const today = moment().tz('America/Argentina/Buenos_Aires').set({hour: 23, minute: 59, second: 59, millisecond: 999});
        const startDate = today.clone().subtract(30, 'days');

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
        const petal_price = await getPetalPrice();
        const dino_price = await getDinoPrice();
        const vip_usa_price = await getVipPriceUsa();

        const imagesWithDetails = images.map(image => {
            const priceHistoryES = priceHistories.filter(ph => ph.productId === image.id && ph.hotel === 'ES');
            let statusES = '';
            if (priceHistoryES.length > 1) {
                const actualPrice = priceHistoryES[0].precio;
                const previousPrice = priceHistoryES[1].precio;
                if(previousPrice != 0){
                    if (actualPrice > previousPrice && previousPrice != 0) {
                        statusES = 'arrow_trend_up';
                    } else {
                        statusES = 'arrow_trend_down';
                    }
                }
            }

            const priceHistoryCOM = priceHistories.filter(ph => ph.productId === image.id && ph.hotel === 'US');
            let statusCOM = '';
            if (priceHistoryCOM.length > 1) {
                const actualPrice = priceHistoryCOM[0].precio;
                const previousPrice = priceHistoryCOM[1] ? priceHistoryCOM[1].precio : 0;

                if(previousPrice != 0){
                    if (actualPrice > previousPrice) {
                        statusCOM = 'com_arrow_up';
                    } else {
                        statusCOM = 'com_arrow_down';
                    }
                }
            }

            let statusFinal = statusES != '' && statusCOM != '' ? statusES+'_'+statusCOM : statusES != '' ? statusES : statusCOM != '' ? statusCOM : '';
            
            return {
                ...image.toJSON(),
                vip_price: vip_price,
                petal_price: petal_price,
                dino_price: dino_price,
                vip_usa_price: vip_usa_price,
                status: statusFinal,
                fecha_precio: priceHistoryES[0] ? priceHistoryES[0].fecha_precio : null,
                fecha_precio_com: priceHistoryCOM[0] ? priceHistoryCOM[0].fecha_precio : null
            };
        });

        imagesWithDetails.sort((a, b) => {
            // Prioridad para el campo `hot`
            if (a.hot == 1 && b.hot != 1) return -1;
            if (a.hot != 1 && b.hot == 1) return 1;
        
            // Tomamos la fecha más reciente entre `fecha_precio` y `fecha_precio_com` para cada item
            const maxDateA = new Date(Math.max(new Date(a.fecha_precio), new Date(a.fecha_precio_com)));
            const maxDateB = new Date(Math.max(new Date(b.fecha_precio), new Date(b.fecha_precio_com)));
        
            // Ordenamos en función de la fecha más reciente
            return maxDateB - maxDateA;
        });

        // Obtener los 40 furnis más recientemente modificados considerando ES y US como registros separados
        const ultimosfurnismodificados = [];

        imagesWithDetails.forEach(image => {
            if (image.fecha_precio) { // Si tiene precio en ES
                ultimosfurnismodificados.push({
                    id: image.id,
                    name: image.name,
                    hotel: 'ES',
                    fecha_precio: image.fecha_precio // Agregar para ordenar por fecha
                });
            }
            if (image.fecha_precio_com) { // Si tiene precio en US
                ultimosfurnismodificados.push({
                    id: image.id,
                    name: image.name,
                    hotel: 'US',
                    fecha_precio: image.fecha_precio_com // Agregar para ordenar por fecha
                });
            }
        });

        // Ordenar los registros por fecha de precio más reciente (independientemente del hotel)
        ultimosfurnismodificados.sort((a, b) => new Date(b.fecha_precio) - new Date(a.fecha_precio));

        // Limitar a los 40 más recientes
        const topUltimosFurnis = ultimosfurnismodificados.slice(0, 40);

        res.json({ 
            token: encryptData(imagesWithDetails), 
            lastUpdateFurnis:  encryptData(topUltimosFurnis) 
        });
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
                attributes: ['name', 'icon', 'descripcion', 'src']
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
                src: record.image ? record.image.src : null,
                icon: record.image ? record.image.icon : null,
                descripcion: record.image ? record.image.descripcion : null,
                hotel: record.hotel,
                vip_price: vipPriceOnDate,
                user_modify: record.user_modify
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

        const token = generateJWT();
        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/habbo-votes', {
            upvotes: image.upvotes,
            downvotes: image.downvotes,
            id: imageId
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
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
        const token = generateJWT();
        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/habbo-votes-belief', {
            upvotes_belief: image.upvotes_belief,
            downvotes_belief: image.downvotes_belief,
            id: imageId
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
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

app.get('/salas', async (req, res) => {
    try {
        const token = generateJWT();
        const response = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/get-images', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(error => {
            console.warn('Error fetching imagenes community, using remote route:', error.message);
            return null;
        });

        if (!response || !response.data || !response.data.images) {
            return res.status(500).send('Error al obtener las imágenes');
        }

        const images = response.data.images;
        const imagesPath = path.join(__dirname, 'public/salas');
        console.log(imagesPath);
        // Obtén la lista de archivos locales en public/salas
        let localFiles = [];
        try {
            localFiles = await fs.promises.readdir(imagesPath);
        } catch (err) {
            console.error('Error reading local files:', err);
        }

        const downloadImage = async (url, filename) => {
            const imagePath = path.join(imagesPath, filename);
            const writer = fs.createWriteStream(imagePath);

            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
            });

            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        };

        // Filtramos las imágenes que no estén ya presentes en el directorio local
        const savedImages = [];
        for (const imageUrl of images) {
            const imageName = path.basename(imageUrl); // Obtenemos el nombre del archivo de la URL
            if (!localFiles.includes(imageName)) {
                // Si la imagen no está en el directorio local, la descargamos
                await downloadImage(imageUrl, imageName);
                console.log(`Imagen ${imageName} descargada.`);
            } else {
                console.log(`Imagen ${imageName} ya existe, no se descarga.`);
            }
            savedImages.push(`salas/${imageName}`); // Rutas internas
        }

        res.json(savedImages);
    } catch (error) {
        console.error('Error al obtener o descargar las imágenes:', error);
        res.status(500).send('Error al obtener o descargar las imágenes');
    }
});


app.listen(port, async () => {
    try {
        await sequelize.authenticate();
        await getCatalog();
        await fetchAndStoreNoticias();
        await fetchAndExtractNoticias();
        //setTimeout(fetchAndStoreHabboOnline, 600000);

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

app.get('/proxy', (req, res) => {
  const url = 'https://habbotemplarios.com/generador-de-habbos/';
  request(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const $ = cheerio.load(body);

      $('#search-modal').remove();
      $('header.header-wrapper').remove();
      $('nav.top-nav').remove();

      $('footer.site-footer').remove();

      $('.sidebar').remove();
      $('.fas').remove();
      $('.clear-content ').remove();
      $('#habbo_image_name').removeAttr('placeholder');
      
      $('#main').css({
        'padding-top': '40px',
        'width': 'auto'
      });

      $('body').css({
        background: 'none',
        background: 'url(https://images.habbo.com/habbo-web/origins-america/es/assets/images/habbo_background.683cff59.gif)'
      });

      $('#head-direction a[data-direction="left"]').html('&larr;');
      $('#head-direction a[data-direction="right"]').html('&rarr;');

      
      $('#direction a[data-direction="left"]').html('&larr;');
      $('#direction a[data-direction="right"]').html('&rarr;');

      res.set('Content-Security-Policy', "frame-ancestors 'self'");
      res.set('X-Frame-Options', 'ALLOWALL');

      res.send($.html());
    } else {
      res.status(response.statusCode).send('Error loading the page');
    }
  });
});

const rewriteResourceUrls = (html, baseUrl) => {
    const $ = cheerio.load(html);
  
    $('link[href], script[src], img[src]').each((_, element) => {
      const attr = element.name === 'link' ? 'href' : 'src';
      const resourceUrl = $(element).attr(attr);
      if (resourceUrl && !resourceUrl.startsWith('http')) {
        const absoluteUrl = new URL(resourceUrl, baseUrl).href;
        $(element).attr(attr, `/proxy-resource?url=${encodeURIComponent(absoluteUrl)}`);
      }
    });
  
    return $.html();
  };

app.get('/proxy-resource', async (req, res) => {
    const resourceUrl = req.query.url;
    try {
      const response = await axios.get(resourceUrl, { responseType: 'arraybuffer' });
      const contentType = response.headers['content-type'];
      res.set('Content-Type', contentType);
      res.send(response.data);
    } catch (error) {
      console.error('Error loading resource:', error);
      res.status(500).send('Error loading the resource');
    }
});

app.get('/proxy-text', async (req, res) => {
    const url = 'https://www.habbofont.net/';
  
    try {
      const response = await axios.get(url);
      let html = rewriteResourceUrls(response.data, url);

      const $ = cheerio.load(html);
      $('body').append(`
        <script>
          document.addEventListener('DOMContentLoaded', function() {
  
            // Hacer clic en el enlace "Home"
            const homeLink = document.querySelector('.menu ul li a[href="/"]');
            if (homeLink) homeLink.click();
            
            // Eliminar header y footer
            const header = document.querySelector('header');
            if (header) header.remove();
            const footer = document.querySelector('footer');
            if (footer) footer.remove();

            document.body.style.background = 'none';

            const hiddenInput = document.querySelector('.logo-link');
            if (hiddenInput) {
                hiddenInput.style.display = 'none';
                const button = document.createElement('button');
                button.textContent = 'Descargar Imagen';
                button.disabled = !hiddenInput.value.startsWith('https://habbofont.net/');
                button.addEventListener('click', function() {
                const link = hiddenInput.value;
                window.open(link, '_blank');
                });
                hiddenInput.insertAdjacentElement('afterend', button);

                // Crear un observador para monitorear cambios en el valor del input oculto
                const observer = new MutationObserver(() => {
                button.disabled = !hiddenInput.value.startsWith('https://habbofont.net/');
                });

                observer.observe(hiddenInput, {
                attributes: true,
                attributeFilter: ['value']
                });
            }
          });
        </script>
      `);
      html = $.html();

      res.set('Content-Security-Policy', "frame-ancestors 'self'");
      res.set('X-Frame-Options', 'ALLOWALL');
  
      res.send(html);
    } catch (error) {
      console.error('Error loading page:', error);
      res.status(500).send('Error loading the page');
    }
});

app.get('/obtener-placas', (req, res) => {
    const placasDir = path.join(__dirname, 'public', 'placas'); // La ruta de la carpeta de imágenes

    fs.readdir(placasDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'No se pudieron cargar las imágenes' });
        }

        // Filtrar solo las imágenes (por extensión)
        const validExtensions = ['png', 'jpg', 'jpeg'];
        const imageFiles = files.filter(file => validExtensions.includes(file.split('.').pop().toLowerCase()));

        // Enviar la lista de archivos al frontend
        res.json(imageFiles);
    });
});

app.get('/secure-image/:imageName', async (req, res) => {
    const imageName = req.params.imageName;
    const referer = req.headers.referer;

    // Verifica el referer para asegurarte de que la imagen sea solicitada desde tu página web
    if (!referer || (!referer.includes('localhost:3000') && !referer.includes('tradeshabbo.com') && !referer.includes('trades-habbo-origins.online'))) {
        return res.status(403).json({ error: 'Access forbidden' });
    }

    // Ruta base donde se encuentran las imágenes
    const baseDirectory = path.join(__dirname, 'public');

    // Buscar la imagen dentro del directorio 'public/furnis' y sus subcarpetas
    const imagePath = findImage(baseDirectory, imageName);

    // Verifica si la imagen fue encontrada
    if (imagePath) {
        res.sendFile(imagePath); // Envía el archivo de imagen encontrado
    } else {
        res.status(404).json({ error: 'Image not found' });
    }
});

app.post('/register-user', [
    check('usernameRegister').isString().withMessage('Username is required'),
    check('email').isEmail().withMessage('Invalid email format'),
    check('passwordRegister').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        
        const { usernameRegister, email, passwordRegister } = req.body;

        // Genera un token JWT para autorización
        const token = generateJWT();

        // Envía la solicitud POST a la API externa
        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/register-user', {
            username: usernameRegister,
            email,
            password: passwordRegister
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Devuelve exactamente la respuesta de la API externa
        res.status(response.status).json(response.data);

    } catch (error) {
        console.error('Error al registrar el usuario:', error.message);

        // Manejo de error específico de la API externa
        if (error.response && error.response.data && error.response.data.error) {
            return res.status(400).json({ 
                error: error.response.data.error 
            });
        }

        // Error general del servidor
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

app.post('/login', [
    check('username').notEmpty().withMessage('El usuario es obligatorio'),
    check('password').notEmpty().withMessage('La contraseña es obligatoria'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password } = req.body;
        // Genera un token JWT para autorización
        const tokenAut = generateJWT();
        // Petición a Gods_Bot
        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/login', {
            username,
            password
        },{
            headers: {
                'Authorization': `Bearer ${tokenAut}`
            }
        });

        // Si el login es exitoso, genera el JWT en Nexus
        if (response.status === 200 && response.data.user) {
            const { id, username, email, permissions } = response.data.user;
            console.log(permissions);

            // Generar el JWT en Nexus
            const token = jwt.sign(
                { id, username, email, permissions },
                apiRestJWTKey,
                { expiresIn: '1h' }
            );

            // Configura la cookie segura
            res.cookie('session_token', token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
                sameSite: 'Strict'
            });

            res.status(200).json({
                message: 'Inicio de sesión exitoso'
            });
        } else {
            res.status(response.status).json(response.data);
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);

        if (error.response && error.response.data && error.response.data.error) {
            return res.status(400).json({ error: error.response.data.error });
        }

        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

app.post('/update-catalog', [
    check('product_id').notEmpty().isNumeric().withMessage('El ID del producto es obligatorio y debe ser un número'),
    check('lang').notEmpty().isIn(['es', 'us']).withMessage('El idioma es obligatorio y debe ser "es" o "us"'),
    check('price').notEmpty().isNumeric().withMessage('El precio es obligatorio y debe ser un número'),
], async (req, res) => {
    // Validación de errores en la solicitud
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { product_id, lang, price } = req.body;

        // Obtener el session_token de las cookies
        const sessionToken = req.cookies.session_token;

        if (!sessionToken) {
            return res.status(401).json({ error: 'Sesión no válida. Inicie sesión nuevamente.' });
        }

        // Decodificar el token JWT
        const decodedToken = jwt.verify(sessionToken, apiRestJWTKey);
        const user_id = decodedToken.id;
        const user_modify = decodedToken.username;

        if (!user_id) {
            return res.status(401).json({ error: 'No se pudo identificar al usuario.' });
        }

        // Obtener los datos actuales del furni
        const furni = await Image.findByPk(product_id);
        if (!furni) {
            return res.status(404).json({ error: 'Furni no encontrado.' });
        }

        const oldPrice = lang.toUpperCase() === 'ES' ? furni.price : furni.usa_price;
        const hotel = lang.toUpperCase() === 'ES' ? "ES" : "US";
        const fechaModificacion = dayjs().format('YYYY-MM-DD HH:mm:ss');

        // Enviar el mensaje al canal de Discord
        const discordChannelId = '1316535967896572035';
        const channel = await client.channels.fetch(discordChannelId);

        if (channel) {
            const messageContent = `
Hola Traders

Se ha actualizado el precio de un nuevo furni:

Nombre: **${furni.name}**
Precio antiguo: **${oldPrice}**
Precio nuevo: **${price}**
Para el hotel: **${hotel}**
Este furni: **${oldPrice > price ? "Bajo" : "Subio"} **
Precio agregado por: **${user_modify}**
Fecha y hora de modificacion: **${fechaModificacion}**

--------------------------------------------------------------
            `;

            await channel.send(messageContent);
        } else {
            console.error(`No se pudo encontrar el canal con ID: ${discordChannelId}`);
        }

        // Token de autorización para la API externa
        const tokenAut = generateJWT();

        // Llamada a la API externa
        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/habbo-update-catalog', {
            id: product_id,
            lang: hotel,
            price,
            user_id
        }, {
            headers: {
                'Authorization': `Bearer ${tokenAut}`
            }
        });

        // Responder al cliente si la API externa responde con éxito
        if (response.status === 200) {
            // Actualizar el precio en la base de datos local con Sequelize
            const fechaPrecio = dayjs().format('YYYY-MM-DD HH:mm:ss');
            const hotel = lang.toUpperCase() === 'ES' ? 'ES' : 'USA';
            const userModify = decodedToken.username; // Extraer el nombre de usuario desde el token
        
            // Determinar qué campo actualizar según el hotel
            const updateData = hotel === 'ES' 
            ? { price, upvotes: 0, downvotes: 0, upvotes_belief: 0, downvotes_belief: 0 }
            : { usa_price: price, upvotes: 0, downvotes: 0, upvotes_belief: 0, downvotes_belief: 0 };

            // Actualizar el precio en la tabla Image
            await Image.update(updateData, {
            where: {
                id: product_id
            }
            });

            // Crear registro en PriceHistory
            const newPriceHistory = await PriceHistory.create({
                productId: product_id,
                precio: price,
                fecha_precio: fechaPrecio,
                hotel,
                user_modify: userModify
            });

             // Buscar y mostrar el registro recién creado
            const createdRecord = await PriceHistory.findOne({
                where: {
                    id: newPriceHistory.id
                }
            });
        
            console.log('Registro creado en PriceHistory:', createdRecord.toJSON());


            return res.status(200).json({
                message: 'Precio actualizado correctamente',
                data: response.data
            });
        } else {
            return res.status(response.status).json(response.data);
        }
    } catch (error) {
        console.error('Error al actualizar el precio:', error.message);

        if (error.response && error.response.data && error.response.data.error) {
            return res.status(400).json({ error: error.response.data.error });
        }

        res.status(500).json({ error: 'Error al actualizar el precio' });
    }
});


function findImage(directory, imageName) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);

        // Verifica si es un directorio
        if (fs.statSync(fullPath).isDirectory()) {
            const found = findImage(fullPath, imageName);
            if (found) {
                return found; // Si se encuentra la imagen, retorna la ruta
            }
        } else {
            // Verifica si el archivo es la imagen solicitada
            if (file === imageName) {
                return fullPath; // Retorna la ruta completa de la imagen
            }
        }
    }

    return null; // Retorna null si no se encuentra la imagen
}
  
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const ALLOWED_ROLES = process.env.ALLOWED_ROLES;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const invites = new Collection();

client.once('ready', async () => {
    console.log('Discord bot is ready!');

    const inviteData = [];

    const fetchPromises = client.guilds.cache.map(async guild => {
        try {
            const guildInvites = await guild.invites.fetch();
            invites.set(guild.id, guildInvites);

            guildInvites.forEach(invite => {
                inviteData.push({
                    code: invite.code,
                    uses: invite.uses,
                    inviterId: invite.inviter ? invite.inviter.id : null
                });
            });
        } catch (error) {
            console.error(`Error fetching invites for guild ${guild.name}:`, error);
        }
    });

    await Promise.all(fetchPromises);
    const token = generateJWT();
    try {
        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/guardar_invitaciones', inviteData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(error => {
            console.warn('Error fetching catalog, using local file:', error.message);
            return null;
        });
    } catch (error) {
        console.error('Error sending invites to the server:', error);
    }
    
    // ID del canal tipo foro
    const forumChannelId = '1269826801396482158';

    await tradesForo(forumChannelId);

});

client.on('guildMemberAdd', async member => {
    console.log('entre al guildMemberAdd');
    const token = generateJWT();
    try {
        const response = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/invitaciones', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const storedInvites = response.data;

        const newInvites = await member.guild.invites.fetch();

        const usedInvite = storedInvites.find(storedInvite => {
            const matchingNewInvite = newInvites.get(storedInvite.code);
            return matchingNewInvite && matchingNewInvite.uses > storedInvite.uses;
        });

        if (usedInvite) {
            const inviter = await member.guild.members.fetch(usedInvite.inviterId);

            console.log(`${member.user.tag} fue invitado por ${inviter.user.tag} usando la invitación con el código ${usedInvite.code}`);

            const competicionData = {
                nuevoUsuarioId: member.user.id,
                nuevoUsuarioTag: member.user.tag,
                invitadoId: inviter.user.id,
                invitadoTag: inviter.user.tag,
                invitacionCode: usedInvite.code
            };
            const token2 = generateJWT();
            try {
                const competicionResponse = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/competicion-invitacion', competicionData, {
                    headers: {
                        'Authorization': `Bearer ${token2}`
                    }
                });
                console.log('Registro guardado en la competición de invitación:', competicionResponse.data);
            } catch (error) {
                console.error('Error guardando el registro en la competición de invitación:', error);
            }

            const token3 = generateJWT();
            await axios.post('https://nearby-kindly-lemming.ngrok-free.app/actualizar_uso_invitacion', {
                code: usedInvite.code,
                uses: usedInvite.uses + 1
            }, {
                headers: {
                    'Authorization': `Bearer ${token3}`
                }
            });

        } else {
            console.log('No se pudo identificar la invitación usada.');
        }

    } catch (error) {
        console.error('Error comparando invitaciones:', error);
    }
});

client.on('inviteCreate', async invite => {
    const guildInvites = invites.get(invite.guild.id) || new Collection();
    guildInvites.set(invite.code, invite);
    invites.set(invite.guild.id, guildInvites);

    const inviterId = invite.inviter ? invite.inviter.id : null;

    const newInviteData = {
        code: invite.code,
        uses: invite.uses,
        inviter_id: inviterId
    };
    const token = generateJWT();
    try {
        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/guardar_invitaciones', [newInviteData], {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error guardando la nueva invitación en el servidor:', error);
    }
});

client.login(DISCORD_TOKEN);

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

const getImageChoices = () => {
    const hcDir = path.join(__dirname, 'public', 'furnis', 'hc');
    const raresDir = path.join(__dirname, 'public', 'furnis', 'rares');
    const funkyDir = path.join(__dirname, 'public', 'furnis', 'funky');
    const coleccionDir = path.join(__dirname, 'public', 'furnis', 'coleccion');
    const deportesDir = path.join(__dirname, 'public', 'furnis', 'deportes');
    const cabinDir = path.join(__dirname, 'public', 'furnis', 'cabin');
    const habboweenDir = path.join(__dirname, 'public', 'furnis', 'habboween');
    const goticoDir = path.join(__dirname, 'public', 'furnis', 'gotico');

    const hcImages = fs.readdirSync(hcDir).map(file => ({
        name: file.replace(/\.(png|gif)$/, ''), // Reemplaza .png o .gif
        value: `hc/${file}`
    }));
    const raresImages = fs.readdirSync(raresDir).map(file => ({
        name: file.replace(/\.(png|gif)$/, ''), // Reemplaza .png o .gif
        value: `rares/${file}`
    }));
    const funkyImages = fs.readdirSync(funkyDir).map(file => ({
        name: file.replace(/\.(png|gif)$/, ''), // Reemplaza .png o .gif
        value: `funky/${file}`
    }));
    const coleccionImages = fs.readdirSync(coleccionDir).map(file => ({ name: file.replace('.png', ''), value: `coleccion/${file}` }));
    const deportesImages = fs.readdirSync(deportesDir).map(file => ({ name: file.replace('.png', ''), value: `deportes/${file}` }));
    const cabinImages = fs.readdirSync(cabinDir).map(file => ({ name: file.replace('.png', ''), value: `cabin/${file}` })); 
    const habboweenImages = fs.readdirSync(habboweenDir).map(file => ({
        name: file.replace(/\.(png|gif)$/, ''), // Reemplaza .png o .gif
        value: `habboween/${file}`
    }));
    const goticoImages = fs.readdirSync(goticoDir).map(file => ({
        name: file.replace(/\.(png|gif)$/, ''), // Reemplaza .png o .gif
        value: `gotico/${file}`
    }));

    return [
        ...hcImages,
        ...raresImages,
        ...funkyImages,
        ...coleccionImages,
        ...deportesImages,
        ...cabinImages,
        ...habboweenImages,
        ...goticoImages
    ];
};

const commands = [
    /*{
        name: 'crear-encuesta',
        description: 'Crear una encuesta en el canal actual',
        options: [
            {
                name: 'imagen',
                type: ApplicationCommandOptionType.String,
                description: 'Imagen para la encuesta',
                required: true,
                autocomplete: true
            },
            {
                name: 'opciones',
                type: ApplicationCommandOptionType.String,
                description: 'Opciones de la encuesta separadas por punto y coma (;)',
                required: true,
            },
            {
                name: 'modo',
                type: ApplicationCommandOptionType.String,
                description: 'Modo de votación (unico, permanente)',
                required: true,
                choices: [
                    { name: 'Único', value: 'unico' },
                    { name: 'Único Permanente', value: 'permanente' }
                ]
            },
            {
                name: 'duracion',
                type: ApplicationCommandOptionType.String,
                description: 'Duración de la encuesta (por ejemplo: 1d2h30m para 1 día, 2 horas y 30 minutos)',
                required: true,
            },
        ],
    },
    {
        name: 'finalizar-encuesta',
        description: 'Finalizar una encuesta antes de tiempo',
        options: [
            {
                name: 'url',
                type: ApplicationCommandOptionType.String,
                description: 'URL del mensaje de la encuesta',
                required: true,
            },
        ],
    },*/
    {
        name: 'verify',
        description: 'Solicitud para vincular tu usuario de habbo con tu usuario de discord',
        options: [
            {
                name: 'nombre',
                type: ApplicationCommandOptionType.String,
                description: 'Tu nombre dentro del juego',
                required: true,
            },
        ],
    },
    {
        name: 'confirm-verify',
        description: 'Valida el codigo OTP en tu mision/motto dentro del juego',
        options: [],
    },
];

(async () => {
    try {

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

    } catch (error) {
        console.error(error);
    }
})();

let activePolls = new Map();
let lock = false;

// Map para almacenar los códigos de verificación temporalmente
const verificationRequests = new Map();

client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete()) {
        const focusedValue = interaction.options.getFocused();
        const choices = getImageChoices();
        const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 25);
        await interaction.respond(
            filtered.map(choice => ({ name: choice.name.slice(0, 25), value: choice.value }))
        );
    }

    if (!interaction.isCommand()) return;

    const { commandName, options, member, channelId } = interaction;

    if (commandName === 'verify') {
        const allowedChannelId = '1322976517780799680';
        const restrictedRoleId = '1322984756593557514';

        // Verifica si el comando se ejecuta en el canal permitido
        if (channelId !== allowedChannelId) {
            await interaction.reply({ 
                content: 'Este comando solo se puede usar en el canal específico.', 
                ephemeral: true 
            });
            return;
        }

        // Verifica si el usuario ya tiene el rol restringido
        if (member.roles.cache.has(restrictedRoleId)) {
            await interaction.reply({ 
                content: 'No puedes usar este comando porque ya tienes el rol correspondiente.', 
                ephemeral: true 
            });
            return;
        }
        // Obtiene el nombre de Habbo proporcionado
        const habboName = options.getString('nombre');

        if (!habboName) {
            await interaction.reply({ 
                content: 'Por favor, proporciona un nombre válido de Habbo.', 
                ephemeral: true 
            });
            return;
        }

        // Validación del nombre de Habbo
        const habboNameRegex = /^[a-zA-Z0-9\-=?!@.:,]+$/;
        if (!habboNameRegex.test(habboName)) {
            await interaction.reply({ 
                content: 'El nombre de Habbo contiene caracteres no permitidos. Solo se permiten letras minúsculas, números y los caracteres: -=?!@.,', 
                ephemeral: true 
            });
            return;
        }

        const habboApiUrl = `https://origins.habbo.es/api/public/users?name=${encodeURIComponent(habboName)}`;
        let habboData;

        try {
            const response = await axios.get(habboApiUrl);
            habboData = response.data;

            if (!habboData || habboData.error === 'not-found') {
                await interaction.reply({
                    content: `No se encontró un usuario en Habbo con el nombre "${habboName}". Por favor, verifica que el nombre sea correcto.`,
                    ephemeral: true
                });
                return;
            }
        } catch (error) {
            await interaction.reply({
                content: 'Este habbo no existe, intenta con otro',
                ephemeral: true
            });
            return;
        }

        // Genera un código de verificación de 6 caracteres alfanuméricos
        const verificationCode = await generateVerificationCode();

        // Almacena la información en el Map con un tiempo de vida de 2 horas
        verificationRequests.set(member.id, {
            discordId: member.id,
            habboName: habboName,
            verificationCode: verificationCode,
            timestamp: Date.now()
        });

        // Configura la eliminación automática después de 2 horas
        setTimeout(() => {
            verificationRequests.delete(member.id);
        }, 2 * 60 * 60 * 1000); // 2 horas en milisegundos

        // Responde al usuario con el código de verificación
        await interaction.reply({
            content: `¡Hola ${member.user.tag}! Tu código de verificación es: **${verificationCode}**. Este código es válido por 2 horas. \n\n **Escribe el codigo en tu "motto/mision" dentro de habbo y luego utiliza el comando /confirm-verify**`,
            ephemeral: true
        });
    }

    if (commandName === 'confirm-verify') {
        const allowedChannelId = '1322976517780799680';
        const restrictedRoleId = '1322984756593557514';
    
        // Verifica si el comando se ejecuta en el canal permitido
        if (channelId !== allowedChannelId) {
            await interaction.reply({ 
                content: 'Este comando solo se puede usar en el canal específico.', 
                ephemeral: true 
            });
            return;
        }
    
        // Verifica si el usuario ya tiene el rol restringido
        if (member.roles.cache.has(restrictedRoleId)) {
            await interaction.reply({ 
                content: 'No puedes usar este comando porque ya tienes el rol correspondiente.', 
                ephemeral: true 
            });
            return;
        }
        
        const userRequest = verificationRequests.get(member.id);
    
        // Verifica si el usuario tiene una solicitud de verificación activa
        if (!userRequest) {
            await interaction.reply({
                content: 'No tienes ninguna solicitud de verificación activa. Por favor, usa el comando `/verify` para generar un código de verificación.',
                ephemeral: true
            });
            return;
        }
    
        const { habboName, verificationCode } = userRequest;
    
        try {
            // Consulta la API de Habbo para obtener los datos del usuario
            const habboApiUrl = `https://origins.habbo.es/api/public/users?name=${encodeURIComponent(habboName)}`;
            const response = await axios.get(habboApiUrl);
            const habboData = response.data;
    
            // Verifica si el *motto* del usuario coincide con el código de verificación
            if (habboData.motto === verificationCode) {
                // Si el *motto* coincide, se considera verificado
                await interaction.reply({
                    content: `¡Felicidades! Tu cuenta de Habbo con el nombre **${habboName}** ha sido verificada exitosamente.`,
                    ephemeral: true
                });
    
                // Asigna el rol al usuario en Discord
                const verifiedRoleId = '1322984756593557514'; // ID del rol de verificado
                await member.roles.add(verifiedRoleId);
    
                // Cambia el apodo del usuario al nombre de Habbo
                await member.setNickname(habboName).catch(error => {
                    console.error('Error al cambiar el apodo:', error.message);
                    interaction.followUp({
                        content: 'No se pudo cambiar tu apodo. Por favor, contacta a un administrador.',
                        ephemeral: true
                    });
                });
    
                // Elimina la solicitud de verificación después de la confirmación
                verificationRequests.delete(member.id);
            } else {
                // Si el *motto* no coincide, envía un mensaje de error
                await interaction.reply({
                    content: `El *motto* de tu cuenta de Habbo no coincide con el código de verificación. Por favor, asegúrate de haber configurado correctamente tu código en el *motto* y vuelve a intentarlo.`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error al consultar la API de Habbo:', error.message);
    
            // Responde con un mensaje de error si la consulta a la API falla
            await interaction.reply({
                content: `Hubo un problema al verificar tu cuenta. Por favor, intenta nuevamente más tarde.`,
                ephemeral: true
            });
        }
    }

    /*const hasRole = member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

    if (!hasRole) {
        await interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
        return;
    }*/

    /*if (commandName === 'crear-encuesta') {
        await interaction.deferReply({ ephemeral: true });

        const imagen = options.getString('imagen');
        const opciones = options.getString('opciones').split(';').map(op => op.trim());
        const modo = options.getString('modo');
        const duracionNoParser = options.getString('duracion');
        const duracion = parseDuration(duracionNoParser);
        const channelIds = ['1262144139852517456', '1262190957495849010'];

        for (const channelId of channelIds) {
            try {
                const voteCounts = new Array(opciones.length).fill(0);
                const userVotes = new Map();
                const voteDetails = new Map();

                const row = new ActionRowBuilder();
                opciones.forEach((opcion, index) => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`opcion${index}-${channelId}`)
                            .setLabel(opcion)
                            .setStyle(ButtonStyle.Primary)
                    );
                });

                const attachment = new AttachmentBuilder(path.join(__dirname, 'public', 'furnis', imagen));
                const channel = await client.channels.fetch(channelId);
                const encuestaMessage = await channel.send({
                    content: getPollMessage(opciones, voteCounts, 0),
                    components: [row],
                    files: [attachment]
                });

                const nuevaEncuesta = {
                    encuesta_id: encuestaMessage.id,
                    imagen,
                    modo,
                    duracion,
                    activa: true
                };

                let opcionesExternas = [];
                const token = generateJWT();
                try {
                    const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/encuestas', nuevaEncuesta, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    for (let [index, opcion] of opciones.entries()) {
                        const nuevaOpcion = {
                            encuesta_id: encuestaMessage.id,
                            opcion_texto: opcion,
                            opcion_discord_id: index
                        };
                        let tokenOpciones = generateJWT();
                        const opcionResponse = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/opciones', nuevaOpcion, {
                            headers: {
                                'Authorization': `Bearer ${tokenOpciones}`
                            }
                        });
                        opcionesExternas.push(opcionResponse.data.data[0]);
                    }
                } catch (error) {
                    console.error('Error al agregar la encuesta o las opciones a la API externa:', error.response ? error.response.data : error.message);
                    return;
                }

                const pollData = {
                    opciones,
                    opcionesExternas,
                    modo,
                    voteCounts,
                    userVotes,
                    voteDetails, 
                    message: encuestaMessage,
                    row,
                    imagen: imagen
                };
                activePolls.set(encuestaMessage.id, pollData);
                const filter = i => i.customId.startsWith('opcion') && i.message.id === encuestaMessage.id;
                const collector = channel.createMessageComponentCollector({ filter, time: duracion });

                pollData.collector = collector;

                collector.on('collect', async (i) => {
                    const userId = i.user.id;
                    const selectedOptionIndex = parseInt(i.customId.replace('opcion', '').split('-')[0], 10);
                    const selectedOptionId = pollData.opcionesExternas[selectedOptionIndex].opcion_id;
                
                    try {
                        if (!i.deferred && !i.replied) {
                            await i.deferReply({ ephemeral: true });
                        }

                        async function sendVoteWithRetry() {
                            let sent = false;
                            while (!sent) {
                                try {
                                    let tokenVotos = generateJWT();
                                    await axios.post('https://nearby-kindly-lemming.ngrok-free.app/votos', {
                                        encuesta_id: encuestaMessage.id,
                                        opcion_id: selectedOptionId,
                                        usuario_id: userId
                                    }, {
                                        headers: {
                                            'Authorization': `Bearer ${tokenVotos}`
                                        }
                                    });
                                    sent = true;
                                } catch (error) {
                                    console.error('Error sending vote:', error.message);
                                    console.log('Retrying...');
                                }
                            }
                        }

                        if (modo === 'unico') {
                            const previousVote = pollData.userVotes.get(userId);
                
                            if (previousVote !== undefined) {
                                pollData.voteCounts[previousVote]--;
                                const details = pollData.voteDetails.get(previousVote);
                                details.splice(details.indexOf(userId), 1);
                                pollData.voteDetails.set(previousVote, details);
                
                                const previousOptionId = pollData.opcionesExternas[previousVote].opcion_id;
                                await sendVoteWithRetry(previousOptionId);
                                
                                if (previousVote === selectedOptionIndex) {
                                    pollData.userVotes.delete(userId);
                                    const totalVotes = pollData.voteCounts.reduce((sum, count) => sum + count, 0);
                                    await encuestaMessage.edit({ content: getPollMessage(pollData.opciones, pollData.voteCounts, totalVotes), components: [pollData.row] });
                                    return;
                                }
                            }
                
                            pollData.voteCounts[selectedOptionIndex]++;
                            pollData.userVotes.set(userId, selectedOptionIndex);
                
                            if (!pollData.voteDetails.has(selectedOptionIndex)) {
                                pollData.voteDetails.set(selectedOptionIndex, []);
                            }
                            pollData.voteDetails.get(selectedOptionIndex).push(userId);
                
                            await sendVoteWithRetry(selectedOptionId);
                
                        } else if (modo === 'permanente') {
                            if (pollData.userVotes.has(userId)) {
                                await i.editReply({
                                    content: 'Ya has votado y no puedes cambiar tu voto, debido a que la encuesta está configurada como voto único permanente.',
                                    ephemeral: true
                                });
                                return;
                            }
                
                            pollData.voteCounts[selectedOptionIndex]++;
                            pollData.userVotes.set(userId, selectedOptionIndex);
                
                            if (!pollData.voteDetails.has(selectedOptionIndex)) {
                                pollData.voteDetails.set(selectedOptionIndex, []);
                            }
                            pollData.voteDetails.get(selectedOptionIndex).push(userId);
                
                            await sendVoteWithRetry(selectedOptionId);
                        }
                
                        const totalVotes = pollData.voteCounts.reduce((sum, count) => sum + count, 0);
                        await encuestaMessage.edit({ content: getPollMessage(pollData.opciones, pollData.voteCounts, totalVotes), components: [pollData.row] });

                        if (!i.replied) {
                            await i.editReply({ content: '¡Tu voto ha sido registrado con éxito!', ephemeral: true });
                        }
                    } catch (error) {
                        console.error('Error handling vote:', error);
                        if (!i.replied) {
                            await i.editReply({
                                content: 'Ocurrió un error al procesar tu voto. Por favor, vuelve a intentarlo.',
                                ephemeral: true
                            });
                        }
                    }
                });
                
                

                collector.on('end', async (collected, reason) => {
                    try {
                        const pollData = activePolls.get(encuestaMessage.id);
                        if (!pollData) {
                            console.error(`No se encontró pollData para el mensaje ID: ${encuestaMessage.id}`);
                            return;
                        }
                        const token = generateJWT();
                        await axios.put(`https://nearby-kindly-lemming.ngrok-free.app/encuestas/${encuestaMessage.id}/inactivar`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        })
                            .then(response => {
                                console.log('Encuesta inactivada en la API externa:', response.data);
                            })
                            .catch(error => {
                                console.error('Error al inactivar la encuesta en la API externa:', error.response ? error.response.data : error.message);
                            });

                        const completedPolls = Array.from(activePolls.values()).filter(poll => poll.imagen === pollData.imagen && poll.collector.ended);

                        if (completedPolls.length === 2) {
                            let votosCanal1 = 0;
                            let votosCanal2 = 0;
                            let opcionGanadoraCanal1 = '';
                            let opcionGanadoraCanal2 = '';

                            completedPolls.forEach((poll, index) => {
                                let maxVotes = 0;
                                let winningOption = '';
                                let winningOptionVotes = 0;
                
                                poll.opciones.forEach((opcion, idx) => {
                                    if (poll.voteCounts[idx] > maxVotes) {
                                        maxVotes = poll.voteCounts[idx];
                                        winningOption = opcion;
                                        winningOptionVotes = parseInt(opcion.match(/\d+/g)?.join('') || "0");
                                    }
                                });
                
                                if (index === 0) {
                                    votosCanal1 = winningOptionVotes;
                                    opcionGanadoraCanal1 = winningOption;
                                } else {
                                    votosCanal2 = winningOptionVotes;
                                    opcionGanadoraCanal2 = winningOption;
                                }
                            });

                            const pesoCanal1 = 0.70;
                            const pesoCanal2 = 0.30;
                            let resultadoFinal = 0;
                            if(votosCanal1 === votosCanal2){
                                resultadoFinal = votosCanal1;
                            } else {
                                resultadoFinal = (votosCanal1 * pesoCanal1) + (votosCanal2 * pesoCanal2);
                            }

                            const redondearMultiploDe5 = (numero) => {
                                return Math.round(numero / 5) * 5;
                            };

                            resultadoFinal = redondearMultiploDe5(resultadoFinal);

                            const imagenNombre = pollData.imagen.split('/').pop().split('.')[0];
                
                            const preciosPath = path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json');
                            const preciosData = JSON.parse(fs.readFileSync(preciosPath, 'utf-8'));
                
                            const articulo = preciosData.find(item => item.name === imagenNombre);
                
                            if (articulo) {
                                console.log(`Se encontró el artículo con ID: ${articulo.id} para la imagen ${pollData.imagen}`);

                                const today = new Date();
                                const priceHistory = await PriceHistory.create({
                                    productId: articulo.id,
                                    precio: resultadoFinal,
                                    fecha_precio: today
                                });
                                console.log('Precio registrado en la base de datos SQLite.');

                                const image = await Image.findByPk(articulo.id);
                                if (image) {
                                    image.price = resultadoFinal;
                                    await image.save();
                                    console.log('Precio actualizado en el modelo Image.');
                                }

                                const postData = [{
                                    id: articulo.id,
                                    price: resultadoFinal
                                }];
                                const token = generateJWT();
                                await axios.post('https://nearby-kindly-lemming.ngrok-free.app/habbo-update-catalog', postData, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                })
                                    .then(response => {
                                        console.log('Catálogo actualizado exitosamente:', response.data);
                                    })
                                    .catch(error => {
                                        console.error('Error al actualizar el catálogo:', error.response ? error.response.data : error.message);
                                    });
                            } else {
                                console.log(`No se encontró ningún artículo para la imagen ${pollData.imagen}`);
                            }

                            const mensaje = `La encuesta ha culminado.\n\n` +
                                            `La opción ganadora de la encuesta de los Master Trades es "${opcionGanadoraCanal1}".\n` +
                                            `La opción ganadora de la encuesta de la comunidad es "${opcionGanadoraCanal2}".\n` +
                                            `El precio final después del cálculo es ${resultadoFinal}. Ya puedes ver este precio en la página web https://www.tradeshabbo.com/`;
                
                            completedPolls.forEach(async (poll) => {
                                await poll.message.channel.send({
                                    content: mensaje,
                                    files: [path.join(__dirname, 'public','furnis', poll.imagen)]
                                });
                            });

                            completedPolls.forEach(poll => activePolls.delete(poll.message.id));
                        } else {
                            console.log('No se han encontrado ambas encuestas aún, no eliminando de activePolls.');
                        }
                    } catch (error) {
                        console.error('Error in collector end handler:', error);
                    }
                });
                
                
                
                
            } catch (error) {
                console.error(`Error al crear la encuesta en el canal ${channelId}:`, error);
            }
        }

        await interaction.editReply({ content: 'Encuesta creada y publicada en los canales especificados.' });
    } else if (commandName === 'finalizar-encuesta') {
        const url = options.getString('url');
        const mensajeId = extractMessageIdFromUrl(url);
        const pollData = activePolls.get(mensajeId);

        if (pollData) {
            pollData.collector.stop();
            activePolls.delete(mensajeId);
            const token = generateJWT();
            axios.put(`https://nearby-kindly-lemming.ngrok-free.app/encuestas/${mensajeId}/inactivar`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => {
                    console.log('Encuesta inactivada en la API externa:', response.data);
                })
                .catch(error => {
                    console.error('Error al inactivar la encuesta en la API externa:', error.response ? error.response.data : error.message);
                });

            await interaction.reply({ content: 'La encuesta ha sido finalizada antes de tiempo.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'No se encontró una encuesta activa con ese ID.', ephemeral: true });
        }
    }*/

});

client.on('messageCreate', async (message) => {
    /*if (message.content.startsWith('/publicar-noticia')) {
        const hasPermission = message.member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

        if (!hasPermission) {
            return message.reply('No tienes permisos para usar este comando.');
        }

        const args = message.content.split(' ');
        const mentionType = args[1] && (args[1] === '$everyone' || args[1] === '$here') ? args[1] : '';
        const isWeb = args.includes('$web');
        const content = args.slice(mentionType ? 2 : 1).filter(arg => arg !== '$web').join(' ').trim();

        if (!content) {
            return message.reply('Por favor, incluye el contenido de la noticia.');
        }

        const newsChannel = client.channels.cache.get('1258417994543927338');
        if (newsChannel) {
            const messageOptions = {
                content: `${mentionType} 📰 **Nueva Noticia**\n\n${content}`
            };

            let imageUrl = null;
            if (message.attachments.size > 0) {
                const attachments = message.attachments.map(attachment => new AttachmentBuilder(attachment.url));
                imageUrl = message.attachments.first().url;
                messageOptions.files = attachments;
            }

            newsChannel.send(messageOptions).then(async (sentMessage) => {
                message.reply('La noticia ha sido publicada exitosamente.');
                const messageUrl = `https://discord.com/channels/${sentMessage.guildId}/${sentMessage.channelId}/${sentMessage.id}`;
                console.log(`Mensaje publicado en: ${messageUrl}`);

                await postTweet(content, messageUrl);

                if (isWeb) {
                    const prompWeb = `Tengo esta noticia "+${content} +" y necesito que me la generes y resumas en este formato, toma esta noticia como ejemplo {
                        "titulo": "Nuevo raro disponible! La Hologirl",
                        "imagen_completa": "catalogo_hologirl",
                        "alt_imagen_completa": "Catalogo Hologirl",
                        "descripcion_completa": "<p><strong>El nuevo raro de Habbo Hotel: Orígenes: Hologirl!</strong></p><p>El 8 de agosto de 2024, se lanza un nuevo raro mítico en el catálogo de Habbo Hotel: Orígenes. La <strong>Hologirl</strong> ya está disponible por tiempo limitado a un precio especial de 50 créditos. Este es el primer raro que sale un jueves y estará disponible solo por 48 horas en el catálogo. ¡No pierdas la oportunidad de agregar esta pieza única a tu colección!</p>",
                        "imagen_resumida": "rares_martes",
                        "alt_imagen_resumida": "nuevo raro jueves 08 de agosto del 2024",
                        "descripcion_resumida": "<p class=\"noticia_descripcion\"><strong>Llega un nuevo raro a Habbo Hotel: Orígenes!</strong> Descubre y adquiere el nuevo raro, <strong>RARO Hologirl</strong>, disponible solo por 48 horas. ¡No te lo pierdas!</p>"
                    } los posibles valores de la imagen_resumida son rares_martes (para cuando la noticia habla de un rare, es decir, tiene la palabra RARE o RARO), funky_friday (para cuando la noticia habla de un funky, es decir, tiene la palabra FUNKY en algun lado), THO (para cuando la noticia habla de tradeshabbo o tradeshabboorigins o explicitamente de THO), staff (cuando la noticia es de oficial de habbo o explicitamente tiene la palabra staff o hobba), IMPORTANTE NINGUNO DE LOS ANTERIORES CAMPOS PUEDE QUEDAR VACIO,
                     si la noticia es OFICIAL DE HABBO la imagen_resumida SIEMPRE TIENE QUE SER STAFF, la imagen_completa tiene que ser acorde al contexto de la noticia y al titulo de la noticia, si por alguna razon viene un link agregalo a la descripcion completa de la noticia. El cuerpo del JSON que te pase de ejemplo es eso un ejemplo, nunca puede ser los valores que estan en dicho ejemplo, exceptuando el campo imagen_resumida.`
                    let summaryData = await generateSummaryWeb(prompWeb);
                    summaryData = JSON.parse(summaryData);

                    console.log('Resumen generado para la web:', summaryData);

                    if (imageUrl) {

                        const imageName = `${summaryData.imagen_completa}.png`;
                        const savePath = path.join('public', 'furnis', 'noticias', 'imagenes', 'completas', imageName);

                        try {
                            await downloadImage(imageUrl, savePath);
                            console.log(`Imagen guardada en: ${savePath}`);
                        } catch (error) {
                            console.error('Error al descargar y guardar la imagen:', error);
                        }
                    }
                    try {
                        const token = generateJWT();
                        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/nueva-noticia', summaryData, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        console.log('Datos enviados a la web exitosamente.');
                        
                        const noticiaId = response.data['noticia_id'];
                        const fechaActual = format(new Date(), 'dd-MM-yyyy');

                        const noticiasPath = path.join('public', 'furnis', 'noticias', 'noticias.json');
                        const noticias = JSON.parse(fs.readFileSync(noticiasPath, 'utf8'));

                        const nuevaNoticia = {
                            id: noticiaId,
                            ...summaryData,
                            fecha_noticia: fechaActual
                        };
                        noticias.push(nuevaNoticia);

                        fs.writeFileSync(noticiasPath, JSON.stringify(noticias, null, 2), 'utf8');
                        console.log('Nueva noticia agregada al archivo noticias.json.');

                    } catch (error) {
                        console.error('Error al enviar los datos a la web:', error);
                    }
                }

            }).catch(err => {
                console.error('Error al publicar la noticia:', err);
                message.reply('Hubo un error al intentar publicar la noticia.');
            });
        } else {
            message.reply('No se pudo encontrar el canal de noticias.');
        }
    }*/
    if (message.channelId === '1263260299012603945' && message.attachments.size > 0) {
        const member = message.guild.members.cache.get(message.author.id);

        // Obtener el apodo del miembro o su nombre de usuario si no tiene apodo
        const username = member ? (member.nickname || member.user.username) : message.author.username;

        message.attachments.forEach(attachment => {
            if (attachment.contentType.startsWith('image/')) {
                const timestamp = new Date();
                const formattedDate = `${timestamp.getDate()}-${timestamp.getMonth() + 1}-${timestamp.getFullYear()}_${timestamp.getHours()}-${timestamp.getMinutes()}-${timestamp.getSeconds()}`;
                const messageId = message.id; // Obtener el ID del mensaje
                const fileExtension = path.extname(attachment.name);
                const savePath = path.join('public', 'salas', `${formattedDate}_${username}_${messageId}${fileExtension}`);
                downloadImage(attachment.url, savePath).then(() => {
                    console.log('Imagen descargada:', savePath);
                    uploadImageToService(savePath, attachment.contentType);
                })
                .catch(err => console.error('Error al descargar la imagen:', err));
            }
        });
    }
    if (message.channel.isThread()) {
        console.log(`Nuevo mensaje en el hilo ${message.channel.name}: ${message.content}`);
        
        // Aquí puedes agregar la lógica adicional que necesites
    }
});

client.on('messageDelete', (message) => {
    if (message.channelId === '1263260299012603945' && message.attachments.size > 0) {
        const messageid = message.id;

        // Preparar el payload como JSON
        const payload = {
            messageid: messageid
        };

        const token = generateJWT();
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        // Enviar la solicitud DELETE al endpoint remoto
        axios.delete('https://nearby-kindly-lemming.ngrok-free.app/delete-image', {
            headers: headers,
            data: payload // Aquí es donde se envía el body con el messageid
        })
        .then(response => {
            console.log(`Imagen eliminada exitosamente: ${response.data}`);
        })
        .catch(error => {
            console.error('Error al eliminar la imagen:', error);
        });
    }
});

client.on('threadCreate', async (thread) => {
    if (thread.parentId === '1269826801396482158') { // Verifica si el hilo pertenece al canal tipo foro
        console.log(`Se ha creado una nueva publicación en el canal tipo foro: ${thread.name}`);
        
        try {
            // Obtener el mensaje inicial de la publicación
            const starterMessage = await thread.fetchStarterMessage();
            
            if (starterMessage) {
                console.log(`Mensaje inicial de la publicación: ${starterMessage.content}`);
            } else {
                console.log('No se encontró ningún mensaje inicial.');
            }
        } catch (error) {
            console.error('Error al obtener el mensaje inicial:', error);
        }

        // También puedes seguir imprimiendo el objeto thread como antes
        console.log(JSON.stringify(thread, null, 2)); // Más legible y formateado
    }
});

async function downloadImage(url, savePath) {
    return new Promise((resolve, reject) => {
        request(url)
            .pipe(fs.createWriteStream(savePath))
            .on('finish', resolve)
            .on('error', reject);
    });
}

async function uploadImageToService(filePath, contentType) {
    const imageData = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const token = generateJWT();

    // Crear el FormData
    const form = new FormData();
    form.append('filename', filename);
    form.append('contentType', contentType);
    form.append('image', imageData, { filename: filename, contentType: contentType });

    // Configuración de encabezados para incluir el token de autorización y form-data headers
    const headers = {
        ...form.getHeaders(),  // Incluir los headers de FormData
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/upload-image', form, { headers });
        console.log('Imagen subida exitosamente:', response.data);
    } catch (err) {
        console.error('Error al subir la imagen:', err);
    }
}

function extractMessageIdFromUrl(url) {
    const parts = url.split('/');
    return parts[parts.length - 1];
}

function getPollMessage(opciones, voteCounts, totalVotes) {
    const porcentajes = voteCounts.map(count => (totalVotes ? ((count / totalVotes) * 100).toFixed(2) : 0));
    let message = `Total de votos: ${totalVotes}\n\n`;
    opciones.forEach((opcion, index) => {
        const progressBar = generateProgressBar(porcentajes[index]);
        message += `${opcion}: ${porcentajes[index]}% ${progressBar} (${voteCounts[index]} votos)\n`;
    });
    return message;
}

function generateProgressBar(percentage) {
    const totalBars = 20;
    const filledBars = Math.round((percentage / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    return `[${'█'.repeat(filledBars)}${'░'.repeat(emptyBars)}]`;
}

function parseDuration(duration) {
    const regex = /(\d+d)?(\d+h)?(\d+m)?/;
    const matches = duration.match(regex);

    let totalMilliseconds = 0;

    if (matches) {
        if (matches[1]) {
            const days = parseInt(matches[1].replace('d', ''), 10);
            totalMilliseconds += days * 24 * 60 * 60 * 1000;
        }
        if (matches[2]) {
            const hours = parseInt(matches[2].replace('h', ''), 10);
            totalMilliseconds += hours * 60 * 60 * 1000;
        }
        if (matches[3]) {
            const minutes = parseInt(matches[3].replace('m', ''), 10);
            totalMilliseconds += minutes * 60 * 1000;
        }
    }

    return totalMilliseconds;
}

async function fetchAndExtractNoticias() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            request.abort();  // Ignora la carga de recursos no esenciales
        } else {
            request.continue();
        }
    });

    try {
        await page.goto('https://origins.habbo.es/community/category/all/1', { waitUntil: 'load', timeout: 120000 });

        const html = await page.content();

        const $ = cheerio.load(html);

        const section = $('section.ng-scope');

        const articles = section.find('article.news-header');

        const nuevasNoticias = [];

        articles.each((index, element) => {
            const anchor = $(element).find('a').first().attr('href');
            const title = $(element).find('h2').first().text().trim();

            nuevasNoticias.push({ titulo: title, link: anchor });
        });
        const token = generateJWT();
        const response = await axios.get('https://nearby-kindly-lemming.ngrok-free.app/noticias-oficiales', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const noticiasRegistradas = response.data.data;

        const noticiasNoRegistradas = nuevasNoticias.filter(nuevaNoticia => {
            return !noticiasRegistradas.some(noticia => 
                noticia.link.trim() === nuevaNoticia.link.trim() && noticia.title.trim() === nuevaNoticia.titulo.trim()
            );
        });

        for (const noticia of noticiasNoRegistradas) {
            try { 
                let tokenNewsOficial = generateJWT();
                const noticiaResponse = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/nueva-noticia-oficial', noticia, {
                    headers: {
                        'Authorization': `Bearer ${tokenNewsOficial}`
                    }
                });
                const url = 'https://origins.habbo.es' + noticia.link;
                await page.goto(url, { waitUntil: 'load', timeout: 120000 });

                const noticiaHtml = await page.content();
                const $noticia = cheerio.load(noticiaHtml);

                const contenidoNoticia = $noticia('.news-article').text().trim();
                const promp = `Hola Traders, tengo una nueva noticia para ustedes. Según la información oficial de Habbo, ${contenidoNoticia}. Como siempre, les mantendremos al tanto de cualquier novedad. Muchas gracias por leer la noticia, en esta la mejor comunidad de todas."

                Instrucciones adicionales:

                Evita el uso de pronombres posesivos: No uses palabras como "nuestro" o "nosotros".
                Referencia en tercera persona: Habla siempre como si estuvieras reportando sobre acciones realizadas por un tercero (Habbo) y no por ti mismo o por el equipo de Trades Habbo.
                No asumas agradecimientos ni explicaciones: No incluyas frases que impliquen una relación directa con la audiencia, como "agradecemos su paciencia" o "valdrá la pena la espera".
                Mantén el tono imparcial: Limítate a reportar lo que se anunció sin interpretar o añadir comentarios personales.
                Lo que tienes que resumir es lo que esta entre Según la información oficial de Habbo, y  Como siempre, les mantendremos al tanto de cualquier novedad.`
                let summaryData = await generateSummaryWeb(promp);
                const newsChannel = client.channels.cache.get('1258417994543927338');
                
                if (newsChannel) {
                    newsChannel.send(`@everyone 📰 **Resumen nueva noticia oficial**\n\nHola Traders, tengo una nueva noticia para ustedes.\n\n${summaryData}\n\nComo siempre, les mantendremos al tanto de cualquier novedad. Muchas gracias por leer la noticia, en esta la mejor comunidad de todas.\n\nLink oficial: ${url}\n\n***Esta noticia a sido generada con AI***`).then(async (sentMessage) => {
                        const messageUrl = `https://discord.com/channels/${sentMessage.guildId}/${sentMessage.channelId}/${sentMessage.id}`;
                        console.log(`Mensaje publicado en: ${messageUrl}`);
                        await postMultilingualTweets(summaryData, messageUrl);
                        const prompWeb = `Tengo esta noticia: ${contenidoNoticia}. Necesito que la generes y la resumas en el siguiente formato JSON (el json que es un ejemplo del formato que necesito):
                            (formato json de ejemplo: {
                                "titulo": "Nuevo raro disponible! La Hologirl",
                                "imagen_completa": "catalogo_hologirl",
                                "alt_imagen_completa": "Catalogo Hologirl",
                                "descripcion_completa": "<p><strong>El nuevo raro de Habbo Hotel: Orígenes: Hologirl!</strong></p><p>El 8 de agosto de 2024, se lanza un nuevo raro mítico en el catálogo de Habbo Hotel: Orígenes. La <strong>Hologirl</strong> ya está disponible por tiempo limitado a un precio especial de 50 créditos. Este es el primer raro que sale un jueves y estará disponible solo por 48 horas en el catálogo. ¡No pierdas la oportunidad de agregar esta pieza única a tu colección!</p>",
                                "imagen_resumida": "staff",
                                "alt_imagen_resumida": "nuevo raro jueves 08 de agosto del 2024",
                                "descripcion_resumida": "<p class=\"noticia_descripcion\"><strong>Llega un nuevo raro a Habbo Hotel: Orígenes!</strong> Descubre y adquiere el nuevo raro, <strong>RARO Hologirl</strong>, disponible solo por 48 horas. ¡No te lo pierdas!</p>"
                            })
                            
                        Instrucciones adicionales:

                            Imágenes y Títulos:

                            imagen_resumida: Siempre debe ser "staff".
                            imagen_completa: Debe ser acorde al contexto y título de la noticia.
                            alt_imagen_completa y alt_imagen_resumida: Deben describir correctamente las imágenes en el contexto del evento o noticia.
                            Formato de las Descripciones:

                            descripcion_completa: Proporciona un resumen detallado de la noticia oficial publicada por Habbo.
                            descripcion_resumida: Debe ser un resumen más breve y directo, pero diferente a la descripción completa.
                            Condiciones para ambas descripciones:

                            Importante: SIEMPRE debes hablar como si fueras un reportero de la fansite "Trades Habbo (THO)", refiriéndote a las acciones de Habbo en tercera persona. No utilices pronombres posesivos como "nuestro" o "nosotros". No uses frases que impliquen pertenencia al equipo de Habbo, como "estamos trabajando" o "nuestro equipo". Si no cumples con estas condiciones, la noticia se habrá generado incorrectamente.
                            Tono y Estilo:

                            Saludo: Comienza con "Hola Traders, tengo una nueva noticia, la cual generé con IA para ustedes."
                            Referencia en tercera persona: Siempre habla como si fueras un reportero de la fansite "Trades Habbo (THO)", refiriéndote a las acciones de Habbo en tercera persona. No utilices pronombres posesivos como "nuestro" o "nosotros".
                            Imparcialidad: Mantén un tono neutral y no incluyas opiniones, agradecimientos personales, ni explicaciones que sugieran una relación directa con la audiencia.
                            Contenido:

                            Resumenes: Asegúrate de que ambos resúmenes (completo y resumido) reflejen el hecho de que la noticia fue publicada por Habbo, y que tú como reportero de THO estás simplemente reportando lo que fue anunciado.
                            Evita ciertas expresiones: No uses frases que impliquen que eres parte del equipo de Habbo, como "estamos trabajando" o "nuestro equipo".

                            Advertencia: Si incluyes cualquier pronombre posesivo o hablas en primera persona del plural (ejemplo: "estamos", "nuestro equipo"), la noticia se considerará incorrecta."
                        `
                        let summaryDataWeb = await generateSummaryWeb(prompWeb);
                        summaryDataWeb = JSON.parse(summaryDataWeb);
                        summaryDataWeb.descripcion_completa += `Este es un resumen de la noticia oficial <a href="${url}" target="_blank">Link</a><br>Esta noticia ha sido generada con IA por lo mismo puede tener errores gramaticales o hablar como si fuera parte del equipo de habbo`

                        try {
                            let tokenNews = generateJWT();
                            const response = await axios.post('https://nearby-kindly-lemming.ngrok-free.app/nueva-noticia', summaryDataWeb, {
                                headers: {
                                    'Authorization': `Bearer ${tokenNews}`
                                }
                            });
                            console.log('Datos enviados a la web exitosamente.');
                            
                            const noticiaId = response.data['noticia_id'];
                            const fechaActual = format(new Date(), 'dd-MM-yyyy');

                            const noticiasPath = path.join('public', 'furnis', 'noticias', 'noticias.json');
                            const noticias = JSON.parse(fs.readFileSync(noticiasPath, 'utf8'));

                            const nuevaNoticia = {
                                id: noticiaId,
                                ...summaryDataWeb,
                                fecha_noticia: fechaActual
                            };
                            noticias.push(nuevaNoticia);

                            fs.writeFileSync(noticiasPath, JSON.stringify(noticias, null, 2), 'utf8');
                            console.log('Nueva noticia agregada al archivo noticias.json.');
                        } catch (error) {
                            console.error('Error al enviar los datos a la web:', error);
                        }
                    }).catch(err => {
                        console.error('Error al enviar el resumen al canal de Discord:', err);
                    });
                } else {
                    console.error('No se pudo encontrar el canal de Discord con el ID proporcionado.');
                }
            } catch (error) {
                console.error('Error al enviar la noticia o al extraer la información:', error);
            }

        }
        
    } catch(error){
        console.error('Error en fetchAndExtractNoticias:', error);
        console.error("Se produjo un error al intentar acceder a la página:", error.message);
    } finally {
        await browser.close();
        setTimeout(fetchAndExtractNoticias, 600000);
    }
}

async function tradesForo(forumChannelId) {
    try {
        // Obtener el canal foro
        const forumChannel = await client.channels.fetch(forumChannelId);

        // Verificar si es un canal tipo foro
        if (forumChannel.type !== 15) { // 15 es el tipo para "GUILD_FORUM"
            console.error('Este canal no es un foro.');
            process.exit(1); // Detener la aplicación si no es un canal foro
        }

        // Obtener los hilos activos del canal tipo foro
        const activeThreads = await forumChannel.threads.fetchActive();

        const threadsData = [];

        // Recorrer cada hilo
        for (const [threadId, thread] of activeThreads.threads) {
            const threadData = {
                id: threadId,
                name: thread.name,
                createdTimestamp: thread.createdTimestamp,
                url: `https://discord.com/channels/${thread.guildId}/${forumChannelId}/${threadId}`, // Enlace del hilo
                appliedTags: thread.appliedTags,
                messages: []
            };

            // Obtener todos los mensajes del hilo
            const messages = await thread.messages.fetch({ limit: 100 });
            messages.forEach(msg => {
                threadData.messages.push({
                    author: msg.author.tag,
                    content: msg.content,
                    createdTimestamp: msg.createdTimestamp
                });
            });

            threadsData.push(threadData);
        }

        // Guardar los datos en un archivo JSON
        const savePath = path.join(__dirname,  'public', 'forum_threads.json');
        fs.writeFileSync(savePath, JSON.stringify(threadsData, null, 2));

        console.log('Datos de las publicaciones guardados en forum_threads.json');
    } catch (error) {
        console.error('Error al obtener las publicaciones del foro:', error);
    } finally {
        setTimeout(() => tradesForo('1269826801396482158'), 600000); // Pasar una función de flecha a setTimeout
    }
}

async function generateVerificationCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}
