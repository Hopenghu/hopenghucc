export async function handleCspReport(request, env) {
  try {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const report = await request.json();
    console.error('CSP Violation:', JSON.stringify(report, null, 2));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error handling CSP report:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 