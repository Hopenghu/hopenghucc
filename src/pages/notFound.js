import { pageTemplate } from '../components/layout.js';
import { generateNonce } from '../utils/nonce.js';

export function renderNotFoundPage(request) {
  const nonce = generateNonce();
  
  const content = `
    <div class="not-found-container">
      <div class="not-found-content">
        <h1>404</h1>
        <p>找不到頁面</p>
        <a href="/" class="button button-primary">回到首頁</a>
      </div>
    </div>

    <style nonce="${nonce}">
      .not-found-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 200px);
        text-align: center;
      }

      .not-found-content h1 {
        font-size: 6rem;
        font-weight: bold;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }

      .not-found-content p {
        font-size: 1.5rem;
        margin-bottom: 2rem;
        color: var(--text-color);
      }
    </style>
  `;

  return new Response(
    pageTemplate({
      title: '找不到頁面',
      content,
      user: null,
      nonce
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html;charset=utf-8'
      }
    }
  );
} 