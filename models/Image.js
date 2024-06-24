const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Image = sequelize.define('Image', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    src: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING,  // Añadir el campo icon
        allowNull: true
    },
    highlight: {
        type: DataTypes.STRING,  // Añadir el campo icon
        allowNull: true
    },
    hot: {
        type: DataTypes.STRING,  // Añadir el campo icon
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,  // Añadir el campo icon
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.STRING,  // Añadir el campo icon
        allowNull: true
    }
});

module.exports = Image;
