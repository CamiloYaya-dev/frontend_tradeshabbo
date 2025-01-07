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
    name_us: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name_br: {
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
    usa_price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    highlight: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hot: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    upvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    downvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    upvotes_belief: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    downvotes_belief: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    mote: {
        type: DataTypes.STRING,
        allowNull: true
    },
});

module.exports = Image;
