# Statistics Canada Data Visualizer

A web application for visualizing Statistics Canada data using the Vega visualization library.

## Features

- Fetch data from Statistics Canada API using vector IDs
- Specify the number of periods to retrieve for each vector
- Add multiple vectors for comparison
- Visualize data in different formats:
  - Line charts
  - Scatter plots
  - Stacked bar charts
  - Tabular view
- Interactive charts with tooltips and zooming capabilities

## Technologies Used

- HTML5, CSS3, and JavaScript (ES6+)
- [Vega](https://vega.github.io/vega/) and [Vega-Lite](https://vega.github.io/vega-lite/) for data visualization
- Statistics Canada Web Data Service API

## How to Use

1. Enter a vector ID in the input field (e.g., 32164132)
2. Specify the number of periods to retrieve
3. Add additional vectors if needed using the "Add Vector" button
4. Click "Fetch Data" to retrieve the data from Statistics Canada
5. Switch between different visualization types using the buttons in the sidebar

## API Information

This application uses the Statistics Canada Web Data Service (WDS) API:
- Endpoint: `https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods`
- Method: POST
- Request Format: JSON array of objects with vectorId and latestN properties

## Getting Started

Simply open the `index.html` file in a web browser to use the application. No server setup or installation is required.

## CORS Issues and Solutions

When running this application locally, you might encounter CORS (Cross-Origin Resource Sharing) policy errors. This happens because browsers prevent web pages from making requests to a different domain than the one that served the web page, as a security measure.

The application uses a CORS proxy to work around this issue. If you encounter CORS errors, here are some solutions:

1. **Use a CORS Proxy** (Already implemented in the code)
   - The application uses corsproxy.io and has a fallback to cors-anywhere.herokuapp.com
   - These services forward your request to the Statistics Canada API with proper CORS headers

2. **Use a Local Development Server**
   - Instead of opening the HTML file directly, serve it through a local server
   - Install a simple HTTP server like "Live Server" extension in VS Code
   - Or use Python's built-in HTTP server: `python -m http.server`

3. **Use a Browser Extension**
   - Install a CORS-bypassing browser extension like "CORS Unblock" or "Allow CORS: Access-Control-Allow-Origin"

## Browser Compatibility

This application is compatible with modern web browsers including:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari
