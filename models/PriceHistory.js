const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Image = require('./Image');

const PriceHistory = sequelize.define('PriceHistory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Image,
            key: 'id'
        }
    },
    fecha_precio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    hotel: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    tableName: 'price_history',
    timestamps: false
});

Image.hasMany(PriceHistory, { foreignKey: 'productId', as: 'priceHistories' });
PriceHistory.belongsTo(Image, { foreignKey: 'productId', as: 'image' });

sequelize.sync({ force: false }).then(() => {
    console.log('Database & tables created!');
});

module.exports = PriceHistory;
