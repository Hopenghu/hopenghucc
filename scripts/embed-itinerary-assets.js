/**
 * 將行程規劃器的建置產物嵌入到 Worker 中
 * 這個腳本會讀取建置後的檔案並生成一個包含檔案內容的模組
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '../static-site/ai-smart-itinerary-planner');
const outputFile = path.join(__dirname, '../src/assets/itinerary-assets.js');

// 讀取檔案內容
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// 生成資產模組
function generateAssetsModule() {
  const assets = {};
  
  // 讀取 App.js
  const appJsPath = path.join(assetsDir, 'App.js');
  const appJs = readFileContent(appJsPath);
  if (appJs) {
    assets['App.js'] = appJs;
  }
  
  // 讀取 CSS 檔案（如果 assets 目錄存在）
  const assetsSubDir = path.join(assetsDir, 'assets');
  if (fs.existsSync(assetsSubDir)) {
    const cssFiles = fs.readdirSync(assetsSubDir).filter(f => f.endsWith('.css'));
    cssFiles.forEach(cssFile => {
      const cssPath = path.join(assetsSubDir, cssFile);
      const cssContent = readFileContent(cssPath);
      if (cssContent) {
        assets[`assets/${cssFile}`] = cssContent;
      }
    });
    
    // 讀取 JS 檔案（除了 App.js）
    const jsFiles = fs.readdirSync(assetsSubDir).filter(f => f.endsWith('.js'));
    jsFiles.forEach(jsFile => {
      const jsPath = path.join(assetsSubDir, jsFile);
      const jsContent = readFileContent(jsPath);
      if (jsContent) {
        assets[`assets/${jsFile}`] = jsContent;
      }
    });
  }
  
  // 讀取 styles 目錄中的 CSS 檔案（從源目錄讀取，因為 Vite 不會自動複製）
  const sourceStylesDir = path.join(__dirname, '../ai-smart-itinerary-planner/styles');
  if (fs.existsSync(sourceStylesDir)) {
    const styleFiles = fs.readdirSync(sourceStylesDir).filter(f => f.endsWith('.css'));
    styleFiles.forEach(styleFile => {
      const stylePath = path.join(sourceStylesDir, styleFile);
      const styleContent = readFileContent(stylePath);
      if (styleContent) {
        assets[`styles/${styleFile}`] = styleContent;
      }
    });
  }
  
  // 也檢查建置輸出目錄中的 styles（如果存在）
  const buildStylesDir = path.join(assetsDir, 'styles');
  if (fs.existsSync(buildStylesDir)) {
    const styleFiles = fs.readdirSync(buildStylesDir).filter(f => f.endsWith('.css'));
    styleFiles.forEach(styleFile => {
      const stylePath = path.join(buildStylesDir, styleFile);
      const styleContent = readFileContent(stylePath);
      if (styleContent) {
        assets[`styles/${styleFile}`] = styleContent;
      }
    });
  }
  
  // 生成模組內容
  const moduleContent = `/**
 * 行程規劃器靜態資產
 * 此檔案由 scripts/embed-itinerary-assets.js 自動生成
 * 請勿手動編輯
 */

export const itineraryAssets = ${JSON.stringify(assets, null, 2)};

export function getItineraryAsset(path) {
  return itineraryAssets[path] || null;
}

export function getAllItineraryAssets() {
  return itineraryAssets;
}
`;

  // 確保輸出目錄存在
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 寫入檔案
  fs.writeFileSync(outputFile, moduleContent, 'utf-8');
  console.log(`✅ 已生成資產模組: ${outputFile}`);
  console.log(`📦 包含 ${Object.keys(assets).length} 個檔案`);
  
  // 顯示檔案大小
  const totalSize = Object.values(assets).reduce((sum, content) => sum + content.length, 0);
  console.log(`📊 總大小: ${(totalSize / 1024).toFixed(2)} KB`);
}

// 執行
generateAssetsModule();

