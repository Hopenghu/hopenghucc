import { pageTemplate } from '../components/layout.js';

const Home = () => { 
  return <div>Placeholder for potential future client-side Home content</div>;
};

export async function renderHomePage(request, env, session, user, nonce, cssContent) { 
  const url = new URL(request.url);
  
  if (user) {
    // If user is logged in, redirect to their info page
    console.log('User logged in, redirecting from / to /google-info');
    return Response.redirect(url.origin + '/google-info', 302);
  } else {
    // If user is not logged in, redirect to login page
    console.log('User not logged in, redirecting from / to /login');
    return Response.redirect(url.origin + '/login', 302);
  }
  
  // Original content generation is removed
}

export default Home; 