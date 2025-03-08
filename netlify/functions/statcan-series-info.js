// For Netlify Functions
const https = require('https');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  return new Promise((resolve, reject) => {
    try {
      // Get the request body
      const requestBody = JSON.parse(event.body);
      
      console.log('Request body for series info:', JSON.stringify(requestBody));
      
      // Prepare the request options
      const options = {
        hostname: 'www150.statcan.gc.ca',
        port: 443,
        path: '/t1/wds/rest/getSeriesInfoFromVector',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(requestBody))
        }
      };
      
      console.log('Making request to Statistics Canada API with options:', JSON.stringify(options));
      
      // Make the request to Statistics Canada API
      const req = https.request(options, (res) => {
        let data = '';
        
        // A chunk of data has been received
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // The whole response has been received
        res.on('end', () => {
          try {
            console.log('Raw response from Statistics Canada API:', data);
            const parsedData = JSON.parse(data);
            console.log('Parsed response from Statistics Canada API:', JSON.stringify(parsedData));
            
            resolve({
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Allow requests from any origin
              },
              body: JSON.stringify(parsedData)
            });
          } catch (e) {
            console.error('Error parsing response:', e.message);
            resolve({
              statusCode: 500,
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ 
                error: 'Failed to parse response from Statistics Canada API',
                message: e.message
              })
            });
          }
        });
      });
      
      // Handle request errors
      req.on('error', (error) => {
        console.error('Request error:', error.message);
        resolve({
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Failed to fetch data from Statistics Canada API',
            message: error.message
          })
        });
      });
      
      // Write data to request body
      req.write(JSON.stringify(requestBody));
      req.end();
      
    } catch (error) {
      console.error('Function error:', error.message);
      resolve({
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Error in Netlify Function',
          message: error.message
        })
      });
    }
  });
};
