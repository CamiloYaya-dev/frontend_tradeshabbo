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
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType, AttachmentBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

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

        // Si la respuesta no contiene el contador de visitas, usar 0 como valor por defecto
        const externalVisitCount = externalVisitData.contador_visitas !== undefined ? externalVisitData.contador_visitas : 0;

        // Actualizar el contador de visitas en el archivo, siempre usando externalVisitCount
        fs.readFile(visitCountPath, 'utf8', (err, data) => {
            let updatedVisitCount = externalVisitCount;

            if (err) {
                if (err.code === 'ENOENT') {
                    // Si el archivo no existe, lo creamos con el contador de visitas externo
                    fs.writeFileSync(visitCountPath, JSON.stringify({ visits: updatedVisitCount }), 'utf8');
                } else {
                    console.error('Error reading visit count:', err);
                    return;
                }
            } else {
                // Actualizar el archivo existente con el nuevo valor de externalVisitCount
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

        // Si la respuesta no contiene el contador de votos, usar 0 como valor por defecto
        const responseVotesCount = externalVotesCount.contador_votos !== undefined ? externalVotesCount.contador_votos : 0;

        // Actualizar el contador de votos en el archivo, siempre usando responseVotesCount
        fs.readFile(votesCountPath, 'utf8', (err, data) => {
            let updatedVotesCount = responseVotesCount;

            if (err) {
                if (err.code === 'ENOENT') {
                    // Si el archivo no existe, lo creamos con el contador de votos externo
                    fs.writeFileSync(votesCountPath, JSON.stringify({ votes: updatedVotesCount }), 'utf8');
                } else {
                    console.error('Error reading votes count:', err);
                    return;
                }
            } else {
                // Actualizar el archivo existente con el nuevo valor de responseVotesCount
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

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Tu Client ID
const GUILD_ID = process.env.GUILD_ID; // Tu Guild ID (ID del servidor)
const ALLOWED_ROLES = process.env.ALLOWED_ROLES; // Roles permitidos

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
    console.log('Discord bot is ready!');
});

client.login(DISCORD_TOKEN);

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

const getImageChoices = () => {
    const hcDir = path.join(__dirname, 'public', 'furnis', 'hc');
    const raresDir = path.join(__dirname, 'public', 'furnis', 'rares');

    const hcImages = fs.readdirSync(hcDir).map(file => ({ name: file.replace('.png', ''), value: `hc/${file}` }));
    const raresImages = fs.readdirSync(raresDir).map(file => ({ name: file.replace('.png', ''), value: `rares/${file}` }));

    return [...hcImages, ...raresImages];
};

const commands = [
    {
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
    },
];

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

let activePolls = new Map();
let lock = false;

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

    const { commandName, options, member } = interaction;

    // Verificar si el usuario tiene uno de los roles permitidos
    const hasRole = member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

    if (!hasRole) {
        await interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
        return;
    }

    if (commandName === 'crear-encuesta') {
        await interaction.deferReply({ ephemeral: true });

        const imagen = options.getString('imagen');
        const opciones = options.getString('opciones').split(';').map(op => op.trim());
        const modo = options.getString('modo');
        const duracionNoParser = options.getString('duracion');
        const duracion = parseDuration(duracionNoParser);
        const channelIds = ['1271322111629197312', '1271322143522557972'];

        for (const channelId of channelIds) {
            try {
                const voteCounts = new Array(opciones.length).fill(0);
                const userVotes = new Map();
                const voteDetails = new Map(); // Almacena los detalles de los votos

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

                try {
                    const response = await axios.post('https://airedale-summary-especially.ngrok-free.app/encuestas', nuevaEncuesta);

                    for (let [index, opcion] of opciones.entries()) {
                        const nuevaOpcion = {
                            encuesta_id: encuestaMessage.id,
                            opcion_texto: opcion,
                            opcion_discord_id: index  // Agregar el índice como opción_discord_id
                        };
                        const opcionResponse = await axios.post('https://airedale-summary-especially.ngrok-free.app/opciones', nuevaOpcion);
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

                collector.on('collect', async i => {
                    const userId = i.user.id;
                    const selectedOptionIndex = parseInt(i.customId.replace(`opcion`, '').split('-')[0], 10);
                    const selectedOptionId = pollData.opcionesExternas[selectedOptionIndex].opcion_id;

                    try {
                        if (modo === 'unico') {
                            const previousVote = pollData.userVotes.get(userId);

                            if (previousVote !== undefined) {
                                pollData.voteCounts[previousVote]--;
                                const details = pollData.voteDetails.get(previousVote);
                                details.splice(details.indexOf(userId), 1);
                                pollData.voteDetails.set(previousVote, details);

                                const previousOptionId = pollData.opcionesExternas[previousVote].opcion_id;
                                await axios.delete('https://airedale-summary-especially.ngrok-free.app/votos', {
                                    data: {
                                        encuesta_id: encuestaMessage.id,
                                        opcion_id: previousOptionId,
                                        usuario_id: userId
                                    }
                                });

                                if (previousVote === selectedOptionIndex) {
                                    pollData.userVotes.delete(userId);
                                    const totalVotes = pollData.voteCounts.reduce((sum, count) => sum + count, 0);
                                    await i.update({ content: getPollMessage(pollData.opciones, pollData.voteCounts, totalVotes), components: [pollData.row] });
                                    return;
                                }
                            }

                            pollData.voteCounts[selectedOptionIndex]++;
                            pollData.userVotes.set(userId, selectedOptionIndex);

                            if (!pollData.voteDetails.has(selectedOptionIndex)) {
                                pollData.voteDetails.set(selectedOptionIndex, []);
                            }
                            pollData.voteDetails.get(selectedOptionIndex).push(userId);

                            await axios.post('https://airedale-summary-especially.ngrok-free.app/votos', {
                                encuesta_id: encuestaMessage.id,
                                opcion_id: selectedOptionId,
                                usuario_id: userId
                            });

                        } else if (modo === 'permanente') {
                            if (pollData.userVotes.has(userId)) {
                                await i.update({ content: 'Ya has votado y no puedes cambiar tu voto.', components: [], ephemeral: true });
                                return;
                            }

                            pollData.voteCounts[selectedOptionIndex]++;
                            pollData.userVotes.set(userId, selectedOptionIndex);

                            if (!pollData.voteDetails.has(selectedOptionIndex)) {
                                pollData.voteDetails.set(selectedOptionIndex, []);
                            }
                            pollData.voteDetails.get(selectedOptionIndex).push(userId);

                            await axios.post('https://airedale-summary-especially.ngrok-free.app/votos', {
                                encuesta_id: encuestaMessage.id,
                                opcion_id: selectedOptionId,
                                usuario_id: userId
                            });
                        }

                        const totalVotes = pollData.voteCounts.reduce((sum, count) => sum + count, 0);
                        await i.update({ content: getPollMessage(pollData.opciones, pollData.voteCounts, totalVotes), components: [pollData.row] });
                    } catch (error) {
                        console.error('Error handling vote:', error);
                        await i.update({ content: 'Ocurrió un error al procesar tu voto. Inténtalo de nuevo.', components: [], ephemeral: true });
                    }
                });

                collector.on('end', async (collected, reason) => {
                    try {
                        const pollData = activePolls.get(encuestaMessage.id);
                        if (!pollData) {
                            console.error(`No se encontró pollData para el mensaje ID: ${encuestaMessage.id}`);
                            return;
                        }
                
                        // Inactivar encuesta en la API externa
                        await axios.put(`https://airedale-summary-especially.ngrok-free.app/encuestas/${encuestaMessage.id}/inactivar`)
                            .then(response => {
                                console.log('Encuesta inactivada en la API externa:', response.data);
                            })
                            .catch(error => {
                                console.error('Error al inactivar la encuesta en la API externa:', error.response ? error.response.data : error.message);
                            });
                
                        // Verificar si todas las encuestas con la misma imagen han finalizado
                        const completedPolls = Array.from(activePolls.values()).filter(poll => poll.imagen === pollData.imagen && poll.collector.ended);

                        if (completedPolls.length === 2) {
                            let votosCanal1 = 0;
                            let votosCanal2 = 0;
                            let opcionGanadoraCanal1 = '';
                            let opcionGanadoraCanal2 = '';
                
                            // Iterar sobre cada encuesta completada y obtener la opción ganadora de cada una
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
                
                            // Calcular el resultado ponderado
                            const pesoCanal1 = 0.70;
                            const pesoCanal2 = 0.30;
                
                            let resultadoFinal = (votosCanal1 * pesoCanal1) + (votosCanal2 * pesoCanal2);
                
                            // Función para redondear al múltiplo de 5 más cercano
                            const redondearMultiploDe5 = (numero) => {
                                return Math.round(numero / 5) * 5;
                            };
                
                            // Redondear el resultado al múltiplo de 5 más cercano
                            resultadoFinal = redondearMultiploDe5(resultadoFinal);

                            // Buscar la imagen en el archivo precios.json
                            const imagenNombre = pollData.imagen.split('/').pop().split('.')[0]; // Extrae "El_Super_Dado" de "hc/El_Super_Dado.png"
                
                            const preciosPath = path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json');
                            const preciosData = JSON.parse(fs.readFileSync(preciosPath, 'utf-8'));
                
                            const articulo = preciosData.find(item => item.name === imagenNombre);
                
                            if (articulo) {
                                // Hacer la solicitud POST con el ID y el resultadoFinal como precio en un array
                                const postData = [
                                    {
                                        id: articulo.id,
                                        price: resultadoFinal
                                    }
                                ];

                                await axios.post('https://airedale-summary-especially.ngrok-free.app/habbo-update-catalog', postData)
                                    .then(response => {
                                        console.log('Catálogo actualizado exitosamente:', response.data);
                                    })
                                    .catch(error => {
                                        console.error('Error al actualizar el catálogo:', error.response ? error.response.data : error.message);
                                    });
                            } else {
                                console.log(`No se encontró ningún artículo para la imagen ${pollData.imagen}`);
                            }
                
                            // Anunciar el resultado en los canales correspondientes
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
                
                            // Eliminar las encuestas completadas de activePolls
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

            axios.put(`https://airedale-summary-especially.ngrok-free.app/encuestas/${mensajeId}/inactivar`)
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
    }
});



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
            totalMilliseconds += days * 24 * 60 * 60 * 1000; // Días a milisegundos
        }
        if (matches[2]) {
            const hours = parseInt(matches[2].replace('h', ''), 10);
            totalMilliseconds += hours * 60 * 60 * 1000; // Horas a milisegundos
        }
        if (matches[3]) {
            const minutes = parseInt(matches[3].replace('m', ''), 10);
            totalMilliseconds += minutes * 60 * 1000; // Minutos a milisegundos
        }
    }

    return totalMilliseconds;
}
