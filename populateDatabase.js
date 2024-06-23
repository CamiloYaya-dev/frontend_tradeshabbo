const sequelize = require('./config/database');
const Image = require('./models/Image');
const fs = require('fs');
const path = require('path');

async function populateDatabase() {
    try {
        await sequelize.sync({ force: true }); // Crea la tabla desde cero

        const hcDirPath = path.join(__dirname, 'public', 'furnis', 'hc');
        const raresDirPath = path.join(__dirname, 'public', 'furnis', 'rares');
        const priceFilePath = path.join(__dirname, 'public', 'furnis', 'precios', 'precios.json');
        const priceData = JSON.parse(fs.readFileSync(priceFilePath, 'utf8'));

        const loadImages = (dirPath, folder) => {
            const files = fs.readdirSync(dirPath);
            return files.filter(file => file.endsWith('.png')).map(file => {
                const rawName = path.basename(file, path.extname(file));
                const name = rawName.replace(/_/g, ' ');  // Reemplaza guiones bajos con espacios
                const priceInfo = priceData[rawName] || { price: 0, icon: null, highlight: false };
                return {
                    name: name,
                    src: `furnis/${folder}/${file}`,
                    price: priceInfo.price,
                    icon: priceInfo.icon,
                    highlight: priceInfo.highlight,
                    hot: priceInfo.hot,
                    status: priceInfo.status
                };
            });
        };

        const hcImages = loadImages(hcDirPath, 'hc');
        const raresImages = loadImages(raresDirPath, 'rares');

        const images = [...hcImages, ...raresImages];

        await Image.bulkCreate(images);
        console.log('Database populated with images');
    } catch (error) {
        console.error('Error populating database:', error);
    }
}

populateDatabase().then(() => {
    console.log('Done');
    process.exit();
}).catch(err => {
    console.error('Error populating database:', err);
});
