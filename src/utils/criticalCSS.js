// 關鍵 CSS 提取工具
// 用於提取首屏可見區域所需的關鍵 CSS

/**
 * 關鍵 CSS 定義
 * 這些是首屏渲染所必需的 CSS 規則
 */
export const criticalCSS = `
/* ===== CRITICAL CSS - Above the fold ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --header-height: 64px;
  --nav-height: 64px;
  --total-fixed-height: calc(var(--header-height) + var(--nav-height));
  --main-available-height: calc(100vh - var(--total-fixed-height));
  --main-padding: 1rem;
  --main-padding-md: 2rem;
}

html, body {
  height: 100%;
  overflow-x: hidden;
}

body {
  display: flex;
  flex-direction: column;
  background-color: #f3f4f6;
  color: #1f2937;
  font-family: 'Noto Sans TC', sans-serif;
  line-height: 1.6;
}

/* Fixed Header */
header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Fixed Navigation */
nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -1px 3px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

/* Main Content */
main {
  flex: 1;
  margin-top: var(--header-height);
  margin-bottom: var(--nav-height);
  min-height: var(--main-available-height);
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

/* Image Loader Critical Styles */
.image-loader-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  z-index: 1;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.image-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 2;
}

.image-loader-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

/* Basic Layout Utilities */
.page-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--main-padding);
  min-height: var(--main-available-height);
}

@media (min-width: 768px) {
  .page-container {
    padding: var(--main-padding-md);
  }
}

/* Line Clamp Utilities */
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

/* Aspect Ratio */
.aspect-\\[3\\/4\\] {
  aspect-ratio: 3 / 4;
}
`;

/**
 * 非關鍵 CSS 載入函數
 * 用於延遲載入非關鍵 CSS
 */
export function loadNonCriticalCSS(cssContent) {
  if (typeof window === 'undefined') return '';
  
  return `
    <link rel="preload" href="data:text/css;base64,${btoa(cssContent)}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="data:text/css;base64,${btoa(cssContent)}"></noscript>
  `;
}

/**
 * 生成關鍵 CSS 內聯標籤
 */
export function getCriticalCSSInline() {
  return `<style id="critical-css">${criticalCSS}</style>`;
}

/**
 * 生成非關鍵 CSS 延遲載入標籤
 */
export function getNonCriticalCSSLink(cssContent) {
  // 在 Cloudflare Workers 環境中，我們直接內聯所有 CSS
  // 但可以添加 defer 屬性來優化載入
  return `<style id="non-critical-css" media="print" onload="this.media='all'">${cssContent}</style>
<noscript><style id="non-critical-css">${cssContent}</style></noscript>`;
}

