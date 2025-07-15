// Simple in-memory log for fetch requests
let logs = [];

exports.handler = async function(event, context) {
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const entry = {
        timestamp: Date.now(),
        request: body.request || []
      };
      logs.push(entry);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ status: 'logged' })
      };
    } catch (err) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid request' })
      };
    }
  } else if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ logs })
    };
  } else {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
};
