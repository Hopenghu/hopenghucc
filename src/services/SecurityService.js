export class SecurityService {
  constructor() {
    this.nonce = this.generateNonce(); // Generate nonce upon instantiation
  }

  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  getNonce() {
    return this.nonce;
  }

  getCSPHeaders() {
    const nonce = this.getNonce();
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://maps.googleapis.com https://accounts.google.com https://ajax.googleapis.com`,
      `style-src 'self' https://fonts.googleapis.com 'nonce-${nonce}' 'unsafe-inline'`,
      `style-src-attr 'self' 'nonce-${nonce}' 'unsafe-inline'`,
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: https: https://www.gstatic.com https://maps.googleapis.com https://maps.gstatic.com",
      "connect-src 'self' https://apis.google.com https://accounts.google.com https://maps.googleapis.com https://www.googleapis.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://api.openai.com",
      "frame-src 'self' https://accounts.google.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'"
    ].join('; ');

    return {
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }
} 