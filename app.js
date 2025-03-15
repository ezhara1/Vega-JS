document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addVectorBtn = document.getElementById('add-vector');
    const fetchDataBtn = document.getElementById('fetch-data');
    const vectorInputsContainer = document.getElementById('vector-inputs');
    const visualizationContainer = document.getElementById('visualization-container');
    const tableContainer = document.getElementById('table-container');
    const loadingIndicator = document.getElementById('loading');
    
    // Visualization type buttons
    const lineChartBtn = document.getElementById('line-chart');
    const scatterChartBtn = document.getElementById('scatter-chart');
    const barChartBtn = document.getElementById('bar-chart');
    const tableViewBtn = document.getElementById('table-view');
    
    // Current visualization type
    let currentVizType = 'line';
    
    // Counter for vector input IDs
    let vectorCounter = 1;
    
    // Store fetched data
    let fetchedData = [];
    
    // Store series information
    let seriesInfo = {};
    
    // Add event listeners
    addVectorBtn.addEventListener('click', addVectorInput);
    fetchDataBtn.addEventListener('click', fetchData);
    
    // Visualization type event listeners
    lineChartBtn.addEventListener('click', () => changeVisualization('line'));
    scatterChartBtn.addEventListener('click', () => changeVisualization('scatter'));
    barChartBtn.addEventListener('click', () => changeVisualization('bar'));
    tableViewBtn.addEventListener('click', () => changeVisualization('table'));
    
    // Function to add a new vector input
    function addVectorInput() {
        vectorCounter++;
        
        const vectorInputDiv = document.createElement('div');
        vectorInputDiv.className = 'vector-input';
        vectorInputDiv.innerHTML = `
            <label for="vector-id-${vectorCounter}">Vector ID:</label>
            <input type="text" id="vector-id-${vectorCounter}" class="vector-id" placeholder="e.g. 32164132">
            
            <label for="periods-${vectorCounter}">N Periods:</label>
            <input type="number" id="periods-${vectorCounter}" class="periods" min="1" max="100" value="3">
            
            <button class="remove-vector">Remove</button>
        `;
        
        vectorInputsContainer.appendChild(vectorInputDiv);
        
        // Add event listener to the remove button
        const removeBtn = vectorInputDiv.querySelector('.remove-vector');
        removeBtn.addEventListener('click', () => {
            vectorInputsContainer.removeChild(vectorInputDiv);
        }); 
    }
    
    // Function to fetch data from the API
    async function fetchData() {
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        
        // Get all vector inputs
        const vectorInputs = document.querySelectorAll('.vector-input');
        
        // Prepare request data
        const requestData = [];
        
        vectorInputs.forEach(input => {
            const vectorId = input.querySelector('.vector-id').value.trim();
            const periods = parseInt(input.querySelector('.periods').value);
            
            if (vectorId && !isNaN(periods)) {
                requestData.push({
                    "vectorId": vectorId,
                    "latestN": periods
                });
            }
        });
        
        if (requestData.length === 0) {
            alert('Please add at least one valid vector ID and period.');
            loadingIndicator.classList.add('hidden');
            return;
        }
        
        try {
            // Use Netlify Function as a proxy to the Statistics Canada API
            console.log('Sending request to Netlify function with data:', requestData);
            
            const response = await fetch('/api/statcan-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received data from Netlify function:', data);
            
            // Ensure fetchedData is an array
            if (Array.isArray(data)) {
                fetchedData = data;
            } else if (data && typeof data === 'object') {
                // If it's a single object, wrap it in an array
                fetchedData = [data];
                console.log('Data was not an array, converted to:', fetchedData);
            } else {
                // If it's something else entirely, show an error
                throw new Error('Unexpected data format received from API');
            }
            
            // Fetch series information for each vector
            await fetchSeriesInfo();
            
            // Update visualization based on current type
            updateVisualization();
            
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error fetching data. Falling back to sample data for demonstration.');
            
            // Use sample data as a fallback
            fetchedData = [
                {
                    "status": "SUCCESS",
                    "object": {
                        "responseStatusCode": 0,
                        "productId": 34100006,
                        "coordinate": "1.2.7.0.0.0.0.0.0",
                        "vectorId": 32164132,
                        "vectorDataPoint": [
                            {
                                "refPer": "2023-01-01",
                                "refPer2": "",
                                "refPerRaw": "2023-01-01",
                                "refPerRaw2": "",
                                "value": "18381"
                            },
                            {
                                "refPer": "2023-02-01",
                                "refPer2": "",
                                "refPerRaw": "2023-02-01",
                                "refPerRaw2": "",
                                "value": "18450"
                            },
                            {
                                "refPer": "2023-03-01",
                                "refPer2": "",
                                "refPerRaw": "2023-03-01",
                                "refPerRaw2": "",
                                "value": "18517"
                            }
                        ]
                    }
                }
            ];
            
            // Add sample series info
            seriesInfo = {
                "32164132": {
                    "productId": 35100003,
                    "seriesTitleEn": "Newfoundland and Labrador;Probation rate per 10,000 young persons"
                }
            };
            
            // Update visualization with sample data
            updateVisualization();
        } finally {
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
        }
    }
    
    // Function to fetch series information for each vector
    async function fetchSeriesInfo() {
        // Create an object to store series info
        seriesInfo = {};
        
        // Get unique vector IDs from fetched data
        const vectorIds = fetchedData.map(item => {
            if (item.status === "SUCCESS" && item.object && item.object.vectorId) {
                return item.object.vectorId.toString();
            }
            return null;
        }).filter(id => id !== null);
        
        // If no valid vector IDs, return
        if (vectorIds.length === 0) {
            console.log('No valid vector IDs found to fetch series info');
            return;
        }
        
        try {
            // Prepare request for series info
            const requestBody = vectorIds.map(id => ({ "vectorId": id }));
            
            // Use Netlify Function as a proxy to the Statistics Canada API
            console.log('Sending request to get series info with data:', requestBody);
            
            const response = await fetch('/api/statcan-series-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received series info (raw):', JSON.stringify(data));
            
            // Process series info
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.status === "SUCCESS" && item.object) {
                        const vectorId = item.object.vectorId.toString();
                        // Log each item to see what fields are available
                        console.log(`Series info for vector ${vectorId}:`, JSON.stringify(item.object));
                        
                        // Check if SeriesTitleEn exists and has a value (note the capital S and T)
                        if (item.object.SeriesTitleEn) {
                            console.log(`SeriesTitleEn for vector ${vectorId}:`, item.object.SeriesTitleEn);
                        } else {
                            console.log(`SeriesTitleEn for vector ${vectorId} is missing or empty`);
                        }
                        
                        seriesInfo[vectorId] = {
                            productId: item.object.productId,
                            seriesTitleEn: item.object.SeriesTitleEn || `Vector ${vectorId}`, // Use SeriesTitleEn with capital S and T
                            seriesTitleFr: item.object.SeriesTitleFr || `Vecteur ${vectorId}`  // Use SeriesTitleFr with capital S and T
                        };
                    }
                });
            }
            
            console.log('Processed series info:', seriesInfo);
        } catch (error) {
            console.error('Error fetching series info:', error);
            // Create basic series info from the data we already have
            fetchedData.forEach(item => {
                if (item.status === "SUCCESS" && item.object) {
                    const vectorId = item.object.vectorId.toString();
                    seriesInfo[vectorId] = {
                        productId: item.object.productId,
                        seriesTitleEn: `Vector ${vectorId}`,
                        seriesTitleFr: `Vecteur ${vectorId}`
                    };
                }
            });
        }
    }
    
    // Function to change visualization type
    function changeVisualization(type) {
        // Update current type
        currentVizType = type;
        
        // Update active button
        document.querySelectorAll('.viz-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${type}-chart`) || document.getElementById(`${type}-view`).classList.add('active');
        
        // Update visualization if we have data
        if (fetchedData.length > 0) {
            updateVisualization();
        }
    }
    
    // Function to update visualization based on current type and data
    function updateVisualization() {
        if (currentVizType === 'table') {
            // Show table, hide visualization
            visualizationContainer.classList.add('hidden');
            tableContainer.classList.remove('hidden');
            
            // Generate table
            generateTable();
        } else {
            // Show visualization, hide table
            visualizationContainer.classList.remove('hidden');
            tableContainer.classList.add('hidden');
            
            // Generate Vega visualization
            generateVegaVisualization();
        }
    }
    
    // Function to generate table from data
    function generateTable() {
        tableContainer.innerHTML = '';
        
        if (fetchedData.length === 0) {
            tableContainer.innerHTML = '<p>No data available</p>';
            return;
        }
        
        // Create table element
        const table = document.createElement('table');
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Add headers
        const headers = ['Vector ID', 'Product ID', 'Series Title', 'Date', 'Value'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Add data rows
        fetchedData.forEach(item => {
            if (item.status === "SUCCESS" && item.object && item.object.vectorDataPoint) {
                const vectorId = item.object.vectorId.toString();
                const productId = item.object.productId;
                const seriesTitle = seriesInfo[vectorId] ? seriesInfo[vectorId].seriesTitleEn : `Vector ${vectorId}`;
                
                item.object.vectorDataPoint.forEach(point => {
                    const row = document.createElement('tr');
                    
                    // Vector ID cell
                    const vectorIdCell = document.createElement('td');
                    vectorIdCell.textContent = vectorId;
                    row.appendChild(vectorIdCell);
                    
                    // Product ID cell
                    const productIdCell = document.createElement('td');
                    productIdCell.textContent = productId;
                    row.appendChild(productIdCell);
                    
                    // Series Title cell
                    const seriesTitleCell = document.createElement('td');
                    seriesTitleCell.textContent = seriesTitle;
                    row.appendChild(seriesTitleCell);
                    
                    // Date cell
                    const dateCell = document.createElement('td');
                    dateCell.textContent = point.refPer;
                    row.appendChild(dateCell);
                    
                    // Value cell
                    const valueCell = document.createElement('td');
                    valueCell.textContent = point.value;
                    row.appendChild(valueCell);
                    
                    tbody.appendChild(row);
                });
            }
        });
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }
    
    // Function to generate Vega visualization
    function generateVegaVisualization() {
        if (!fetchedData || fetchedData.length === 0) {
            visualizationContainer.innerHTML = '<p>No data available</p>';
            return;
        }
        
        // Transform data for Vega
        const transformedData = [];
        
        fetchedData.forEach(item => {
            if (item.status === "SUCCESS" && item.object && item.object.vectorDataPoint) {
                const vectorId = item.object.vectorId.toString();
                const productId = item.object.productId;
                const seriesTitle = seriesInfo[vectorId] ? seriesInfo[vectorId].seriesTitleEn : `Vector ${vectorId}`;
                
                item.object.vectorDataPoint.forEach(dataPoint => {
                    transformedData.push({
                        date: dataPoint.refPer,
                        value: parseFloat(dataPoint.value),
                        vectorId: vectorId,
                        productId: productId,
                        seriesTitle: seriesTitle
                    });
                });
            }
        });
        
        // Sort data by date for proper line connections
        transformedData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Create Vega spec based on visualization type
        let vegaSpec;
        
        if (currentVizType === 'line') {
            vegaSpec = createLineChartSpec(transformedData);
        } else if (currentVizType === 'scatter') {
            vegaSpec = createScatterChartSpec(transformedData);
        } else if (currentVizType === 'bar') {
            vegaSpec = createBarChartSpec(transformedData);
        }
        
        // Render visualization
        if (vegaSpec) {
            vegaEmbed('#visualization', vegaSpec, { 
                actions: true,
                renderer: 'canvas'
            }).catch(console.error);
        }
    }
    
    // Function to create Line Chart Vega spec
    function createLineChartSpec(data) {
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Statistics Canada Time Series Data",
            "width": "container",
            "height": 400,
            "data": {
                "values": data
            },
            "mark": {
                "type": "line",
                "point": true
            },
            "encoding": {
                "x": {
                    "field": "date",
                    "type": "temporal",
                    "title": "Date",
                    "scale": {"domain": {"selection": "zoom"}}
                },
                "y": {
                    "field": "value",
                    "type": "quantitative",
                    "title": "Value",
                    "scale": {"domain": {"selection": "zoom"}}
                },
                "color": {
                    "field": "seriesTitle",
                    "type": "nominal",
                    "title": "Series",
                    "legend": {
                        "orient": "bottom",
                        "labelLimit": 300,
                        "columnPadding": 10,
                        "labelOverlap": "parity"
                    }
                },
                "tooltip": [
                    {"field": "date", "type": "temporal", "title": "Date"},
                    {"field": "value", "type": "quantitative", "title": "Value"},
                    {"field": "vectorId", "type": "nominal", "title": "Vector ID"},
                    {"field": "productId", "type": "nominal", "title": "Product ID"},
                    {"field": "seriesTitle", "type": "nominal", "title": "Series Title"}
                ]
            },
            "selection": {
                "zoom": {
                    "type": "interval",
                    "bind": "scales",
                    "encodings": ["x", "y"]
                }
            },
            "config": {
                "point": {
                    "filled": true,
                    "size": 60
                }
            }
        };
    }
    
    // Function to create Scatter Chart Vega spec
    function createScatterChartSpec(data) {
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Statistics Canada Scatter Plot",
            "width": "container",
            "height": 400,
            "data": {
                "values": data
            },
            "mark": {
                "type": "point",
                "filled": true
            },
            "encoding": {
                "x": {
                    "field": "date",
                    "type": "temporal",
                    "title": "Date",
                    "scale": {"domain": {"selection": "zoom"}}
                },
                "y": {
                    "field": "value",
                    "type": "quantitative",
                    "title": "Value",
                    "scale": {"domain": {"selection": "zoom"}}
                },
                "color": {
                    "field": "seriesTitle",
                    "type": "nominal",
                    "title": "Series",
                    "legend": {
                        "orient": "bottom",
                        "labelLimit": 300,
                        "columnPadding": 10,
                        "labelOverlap": "parity"
                    }
                },
                "size": {"value": 100},
                "tooltip": [
                    {"field": "date", "type": "temporal", "title": "Date"},
                    {"field": "value", "type": "quantitative", "title": "Value"},
                    {"field": "vectorId", "type": "nominal", "title": "Vector ID"},
                    {"field": "productId", "type": "nominal", "title": "Product ID"},
                    {"field": "seriesTitle", "type": "nominal", "title": "Series Title"}
                ]
            },
            "selection": {
                "zoom": {
                    "type": "interval",
                    "bind": "scales",
                    "encodings": ["x", "y"]
                }
            }
        };
    }
    
    // Function to create Bar Chart Vega spec
    function createBarChartSpec(data) {
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Statistics Canada Bar Chart",
            "width": "container",
            "height": 400,
            "data": {
                "values": data
            },
            "mark": "bar",
            "encoding": {
                "x": {
                    "field": "date",
                    "type": "temporal",
                    "title": "Date",
                    "scale": {"domain": {"selection": "zoom"}}
                },
                "y": {
                    "field": "value",
                    "type": "quantitative",
                    "title": "Value",
                    "scale": {"domain": {"selection": "zoom"}}
                },
                "color": {
                    "field": "seriesTitle",
                    "type": "nominal",
                    "title": "Series",
                    "legend": {
                        "orient": "bottom",
                        "labelLimit": 300,
                        "columnPadding": 10,
                        "labelOverlap": "parity"
                    }
                },
                "tooltip": [
                    {"field": "date", "type": "temporal", "title": "Date"},
                    {"field": "value", "type": "quantitative", "title": "Value"},
                    {"field": "vectorId", "type": "nominal", "title": "Vector ID"},
                    {"field": "productId", "type": "nominal", "title": "Product ID"},
                    {"field": "seriesTitle", "type": "nominal", "title": "Series Title"}
                ]
            },
            "selection": {
                "zoom": {
                    "type": "interval",
                    "bind": "scales",
                    "encodings": ["x", "y"]
                }
            }
        };
    }
});
