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
        const funkyDirPath = path.join(__dirname, 'public', 'furnis', 'funky');
        const coleccionDirPath = path.join(__dirname, 'public', 'furnis', 'coleccion');
        const deportesDirPath = path.join(__dirname, 'public', 'furnis', 'deportes');
        const cabinDirPath = path.join(__dirname, 'public', 'furnis', 'cabin');
        const habboweenDirPath = path.join(__dirname, 'public', 'furnis', 'habboween');
        const goticoDirPath = path.join(__dirname, 'public', 'furnis', 'gotico');
        const priceFilePath = path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json');
        const priceHistoryFilePath = path.join(__dirname, 'public', 'furnis', 'precios', 'precios_historico.json');

        const priceData = JSON.parse(fs.readFileSync(priceFilePath, 'utf8'));
        const priceHistoryData = JSON.parse(fs.readFileSync(priceHistoryFilePath, 'utf8'));

        const loadImages = (dirPath, folder) => {
            const files = fs.readdirSync(dirPath);
            return files.filter(file => file.endsWith('.png') || file.endsWith('.gif')).map(file => {
                const rawName = path.basename(file, path.extname(file));
                const name = rawName.replace(/_/g, ' ');  // Reemplaza guiones bajos con espacios
                const priceInfo = priceData.find(p => p.name === rawName) || { price: 0, icon: null, highlight: false };
                return {
                    id: priceInfo.id,
                    name: name,
                    src: `/secure-image/${file}`,
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
        const funkyImages = loadImages(funkyDirPath, 'funky');
        const coleccionImages = loadImages(coleccionDirPath, 'coleccion');
        const deportesImages = loadImages(deportesDirPath, 'deportes');
        const cabinImages = loadImages(cabinDirPath, 'cabin');
        const habboweenImages = loadImages(habboweenDirPath, 'habboween');
        const goticoImages = loadImages(goticoDirPath, 'gotico');
        const images = [
            ...hcImages,
            ...raresImages,
            ...funkyImages,
            ...coleccionImages,
            ...deportesImages,
            ...cabinImages,
            ...habboweenImages,
            ...goticoImages
        ];

        for (const image of images) {
            //console.log(`Intentando insertar imagen con ID: ${image.id} y nombre: ${image.name}`);
            try {
                await Image.upsert(image); // Inserta o actualiza según sea necesario
            } catch (error) {
                console.error(`Error al insertar la imagen con ID: ${image.id} y nombre: ${image.name}`, error);
            }
        }
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
        for (const priceHistory of priceHistoryWithProductId) {
            //console.log(`Intentando insertar historial de precios para el producto ID: ${priceHistory.productId}`);
            try {
                await PriceHistory.upsert(priceHistory); // Inserta o actualiza según sea necesario
            } catch (error) {
                console.error(`Error al insertar el historial de precios con product ID: ${priceHistory.productId}`, error);
            }
        }
        console.log('Database populated with price history');

        await PriceHistory.findAll();

    } catch (error) {
        console.error('Error populating database:', error);
    }
}

module.exports = populateDatabase; // Asegúrate de exportar la función
