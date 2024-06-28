const express = require('express');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const Image = require('./models/Image');
const PriceHistory = require('./models/PriceHistory');
const { Op } = require('sequelize');
const axios = require('axios');
const populateDatabase = require('./populateDatabase');

const app = express();
const port = 3000;

async function getCatalog() {
    try {
        const response_catalog = await axios.get('https://lionfish-cosmic-ideally.ngrok-free.app/habbo-catalog').catch(error => {
            console.warn('Error fetching catalog, using local file:', error.message);
            return null; // Retorna null en caso de error
        });

        if (response_catalog) {
            const prices = response_catalog.data;
            // Guardar el JSON en la ruta especificada
            const jsonContent_catalog = JSON.stringify(prices, null, 2);
            fs.writeFileSync(path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json'), jsonContent_catalog, 'utf8');
        }

        const response_prices = await axios.get('https://lionfish-cosmic-ideally.ngrok-free.app/habbo-price-history').catch(error => {
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

// Middleware para añadir el header ngrok-skip-browser-warning
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

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

// Ruta para obtener imágenes desde la base de datos
app.get('/images', async (req, res) => {
    try {
        const images = await Image.findAll({
            order: [['fecha_creacion', 'DESC']]
        });
        let vip_price = await getVipPrice();
        // Añadir el campo vip_price a cada imagen
        const imagesWithVipPrice = images.map(image => ({
            ...image.toJSON(), // Convertir la instancia de Sequelize a objeto JSON
            vip_price: vip_price
        }));

        res.json(imagesWithVipPrice);
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
                name: record.Image.name,
                icon: record.Image.icon,
                descripcion: record.Image.descripcion,
                vip_price: vipPriceOnDate
            };
        }));
        console.log(historyWithProductName);
        res.json(historyWithProductName);
    } catch (error) {
        console.error('Error retrieving price history:', error);
        res.status(500).send('Error retrieving price history');
    }
});

app.listen(port, async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        await getCatalog(); // Asegúrate de esperar a que el catálogo se obtenga y se guarde antes de continuar
        console.log(`Servidor escuchando en http://localhost:${port}`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});
