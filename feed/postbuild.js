import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Define __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist/assets');
const indexHtmlPath = path.join(__dirname, 'index.html');
const introHtmlPath = path.join(__dirname, 'intro.html');

// Find the generated JS and CSS files
const files = fs.readdirSync(distDir);
const jsFile = files.find(file => file.endsWith('.js'));
const cssFile = files.find(file => file.endsWith('.css'));

// Update HTML files with new asset filenames
const updateHtmlFile = (htmlFilePath, jsFile, cssFile) => {
  let htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  htmlContent = htmlContent.replace(/\/dist\/assets\/.*\.js/, `/dist/assets/${jsFile}`);
  htmlContent = htmlContent.replace(/\/dist\/assets\/.*\.css/, `/dist/assets/${cssFile}`);
  fs.writeFileSync(htmlFilePath, htmlContent);
};

// Update both index.html and intro.html
updateHtmlFile(indexHtmlPath, jsFile, cssFile);
updateHtmlFile(introHtmlPath, jsFile, cssFile);

console.log('HTML files updated with new asset filenames.');
