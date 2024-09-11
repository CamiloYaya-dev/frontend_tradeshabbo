const sequelize = require('./config/database');
const Image = require('./models/Image');
const PriceHistory = require('./models/PriceHistory');
const fs = require('fs');
const path = require('path');

async function populateDatabase() {
    try {
        await sequelize.sync({ force: true }); // Crea la tabla desde cero

        const hcDirPath = path.join(__dirname, 'public', 'furnis', 'hc');
        const raresDirPath = path.join(__dirname, 'public', 'furnis', 'rares');
        const deportesDirPath = path.join(__dirname, 'public', 'furnis', 'deportes');
        const priceFilePath = path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json');
        const priceHistoryFilePath = path.join(__dirname, 'public', 'furnis', 'precios', 'precios_historico.json');

        const priceData = JSON.parse(fs.readFileSync(priceFilePath, 'utf8'));
        const priceHistoryData = JSON.parse(fs.readFileSync(priceHistoryFilePath, 'utf8'));

        const loadImages = (dirPath, folder) => {
            const files = fs.readdirSync(dirPath);
            return files.filter(file => file.endsWith('.png')).map(file => {
                const rawName = path.basename(file, path.extname(file));
                const name = rawName.replace(/_/g, ' ');  // Reemplaza guiones bajos con espacios
                const priceInfo = priceData.find(p => p.name === rawName) || { price: 0, icon: null, highlight: false };
                return {
                    id: priceInfo.id,
                    name: name,
                    src: `furnis/${folder}/${file}`,
                    price: priceInfo.price,
                    icon: priceInfo.icon,
                    highlight: priceInfo.highlight,
                    hot: priceInfo.hot,
                    status: priceInfo.status,
                    fecha_creacion: priceInfo.fecha_creacion,
                    descripcion: priceInfo.descripcion,
                    upvotes: priceInfo.upvotes,
                    downvotes: priceInfo.downvotes,
                    upvotes_belief: priceInfo.upvotes_belief,
                    downvotes_belief: priceInfo.downvotes_belief,
                    mote: priceInfo.mote
                };
            });
        };

        const hcImages = loadImages(hcDirPath, 'hc');
        const raresImages = loadImages(raresDirPath, 'rares');
        const deportesImages = loadImages(deportesDirPath, 'deportes');

        const images = [...hcImages, ...raresImages, ...deportesImages];

        await Image.bulkCreate(images);
        console.log('Database populated with images');

        // Agregar productId a priceHistoryData
        const priceHistoryWithProductId = priceHistoryData.map(entry => {
            const product = priceData.find(p => p.id === entry.product_id);
            if (product) {
                return {
                    ...entry,
                    productId: product.id
                };
            }
            return entry;
        });

        await PriceHistory.bulkCreate(priceHistoryWithProductId);
        console.log('Database populated with price history');

        await PriceHistory.findAll();

    } catch (error) {
        console.error('Error populating database:', error);
    }
}

module.exports = populateDatabase; // Asegúrate de exportar la función
