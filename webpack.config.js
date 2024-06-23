const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './server.js', // Punto de entrada de tu aplicación
  output: {
    filename: 'bundle.js', // Nombre del archivo de salida
    path: path.resolve(__dirname, 'dist'), // Directorio de salida
  },
  target: 'node', // Configura el entorno de destino para Node.js
  mode: 'production', // Modo de construcción
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Usar babel-loader para procesar archivos JS
        },
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^pg-hstore$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^sequelize\/lib\/dialects\/postgres/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^sqlite3$/,
    }),
  ],
  resolve: {
    extensions: ['.js', '.json'],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      stream: false,
    },
  },
};
