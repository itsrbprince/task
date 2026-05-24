/**
 * Proxies /api/* to the Express backend (Render, Railway, etc.)
 * Set API_PROXY_TARGET in Netlify → Site settings → Environment variables
 * Example: https://taskperform-api.onrender.com
 */
exports.handler = async (event) => {
  const target = (process.env.API_PROXY_TARGET || process.env.API_URL || '').replace(/\/$/, '');

  if (!target) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message:
          'API not configured. In Netlify, set API_PROXY_TARGET to your backend URL (e.g. https://your-api.onrender.com).',
      }),
    };
  }

  const subPath = event.path.replace(/^\/\.netlify\/functions\/api\/?/, '') || '';
  const apiPath = subPath.startsWith('api/') ? `/${subPath}` : `/api/${subPath}`;
  const query = event.rawQuery ? `?${event.rawQuery}` : '';
  const url = `${target}${apiPath}${query}`;

  const headers = { ...event.headers };
  delete headers.host;
  delete headers['x-forwarded-host'];

  const init = {
    method: event.httpMethod,
    headers,
  };

  if (event.body && !['GET', 'HEAD'].includes(event.httpMethod)) {
    init.body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
  }

  try {
    const res = await fetch(url, init);
    const buffer = Buffer.from(await res.arrayBuffer());
    const outHeaders = {};
    res.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'connection', 'content-encoding'].includes(key.toLowerCase())) {
        outHeaders[key] = value;
      }
    });

    return {
      statusCode: res.status,
      headers: outHeaders,
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: `Backend unreachable: ${err.message}. Check API_PROXY_TARGET (${target}).`,
      }),
    };
  }
};
