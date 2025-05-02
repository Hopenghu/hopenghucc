import { handleApiRequest, routePageRequest } from '../routes/index.js'; // Point to existing router file

export class RouterService {
  constructor(env, securityService, sessionService, cssContent) {
    this.env = env;
    this.securityService = securityService;
    this.sessionService = sessionService;
    this.cssContent = cssContent; // Store cssContent
  }

  async handleRequest(request) {
    // Proceed directly with dynamic routing
    console.log(`Handling request (no static pre-check): ${request.url}`);
    const url = new URL(request.url);
    const pathname = url.pathname;
    const nonce = this.securityService.getNonce();

    // Get User Session
    const session = await this.sessionService.getSession(request);
    const user = session ? await this.sessionService.getUserFromSession(request) : null;

    // Handle API Routes
    if (pathname.startsWith('/api/')) {
      // API routes likely don't need cssContent or nonce
      return await handleApiRequest(request, this.env, session, user);
    }

    // Handle Page Routes, passing cssContent along
    console.log(`Routing page request for: ${pathname}`);
    // Pass cssContent to the page router
    const pageResponse = await routePageRequest(request, this.env, session, user, nonce, this.cssContent);
    
    // RouterService no longer sets Content-Type; relies on pageResponse or worker.js fallback
    return pageResponse; 
  }
} 