// For Netlify Functions
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Get the request body
    const requestBody = JSON.parse(event.body);
    console.log('Received request body:', requestBody);
    
    // Make the request to Statistics Canada API
    console.log('Making request to Statistics Canada API');
    const response = await fetch(
      'https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      console.error('Error response from Statistics Canada API:', response.status, response.statusText);
      throw new Error(`Statistics Canada API responded with status: ${response.status}`);
    }
    
    // Get the response data
    const data = await response.json();
    console.log('Received data from Statistics Canada API:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Return the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Allow requests from any origin
      },
      body: JSON.stringify([data]) // Ensure the response is an array
    };
  } catch (error) {
    console.error('Error in Netlify Function:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*' // Allow requests from any origin
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch data from Statistics Canada API',
        message: error.message
      })
    };
  }
};
