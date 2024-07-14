const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Ruta al archivo original
const inputFilePath = path.join(__dirname, 'script.js');
// Genera un nombre de archivo aleatorio para el archivo ofuscado
const outputFileName = uuidv4() + '.js';
const outputFilePath = path.join(__dirname, outputFileName);

// Lee el contenido del archivo original
const inputCode = fs.readFileSync(inputFilePath, 'utf8');

// Ofusca el código
const obfuscatedCode = JavaScriptObfuscator.obfuscate(inputCode, {
    compact: true,
    controlFlowFlattening: true
}).getObfuscatedCode();

// Escribe el código ofuscado en un nuevo archivo con nombre aleatorio
fs.writeFileSync(outputFilePath, obfuscatedCode);

console.log(`Archivo SCRIPT ofuscado generado: ${outputFileName}`);

// Ruta al archivo original
const inputFilePath2 = path.join(__dirname, 'i18n.js');
// Genera un nombre de archivo aleatorio para el archivo ofuscado
const outputFileName2 = uuidv4() + '.js';
const outputFilePath2 = path.join(__dirname, outputFileName2);

// Lee el contenido del archivo original
const inputCode2 = fs.readFileSync(inputFilePath2, 'utf8');

// Ofusca el código
const obfuscatedCode2 = JavaScriptObfuscator.obfuscate(inputCode2, {
    compact: true,
    controlFlowFlattening: true
}).getObfuscatedCode();

// Escribe el código ofuscado en un nuevo archivo con nombre aleatorio
fs.writeFileSync(outputFilePath2, obfuscatedCode2);

console.log(`Archivo I18N ofuscado generado: ${outputFileName2}`);