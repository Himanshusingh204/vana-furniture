export async function reportClientError(error, componentStack = '') {
  try {
    const payload = {
      error_message: error ? (error.message || String(error)) : 'Unknown client error',
      component_stack: componentStack,
      page_url: window.location.pathname,
      user_agent: navigator.userAgent
    };

    await fetch('/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    // Fail silently to prevent recursive crash
    console.warn('[Telemetry Failed]', e);
  }
}
