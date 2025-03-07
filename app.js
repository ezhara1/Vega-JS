document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addVectorBtn = document.getElementById('add-vector');
    const fetchDataBtn = document.getElementById('fetch-data');
    const vectorInputsContainer = document.getElementById('vector-inputs');
    const visualizationContainer = document.getElementById('visualization');
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
            
            // Update visualization with sample data
            updateVisualization();
        } finally {
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
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
        // Clear previous table
        tableContainer.innerHTML = '';
        
        if (!fetchedData || fetchedData.length === 0) {
            tableContainer.innerHTML = '<p>No data available</p>';
            return;
        }
        
        // Create table element
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        
        // Create header row
        const headerRow = document.createElement('tr');
        
        // Add Vector ID column
        const vectorIdHeader = document.createElement('th');
        vectorIdHeader.textContent = 'Vector ID';
        headerRow.appendChild(vectorIdHeader);
        
        // Add Reference Period column
        const refPerHeader = document.createElement('th');
        refPerHeader.textContent = 'Reference Period';
        headerRow.appendChild(refPerHeader);
        
        // Add Value column
        const valueHeader = document.createElement('th');
        valueHeader.textContent = 'Value';
        headerRow.appendChild(valueHeader);
        
        // Add Product ID column
        const productIdHeader = document.createElement('th');
        productIdHeader.textContent = 'Product ID';
        headerRow.appendChild(productIdHeader);
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create data rows
        fetchedData.forEach(item => {
            if (item.status === 'SUCCESS' && item.object && item.object.vectorDataPoint) {
                const vectorId = item.object.vectorId;
                const productId = item.object.productId;
                
                item.object.vectorDataPoint.forEach(dataPoint => {
                    const row = document.createElement('tr');
                    
                    // Vector ID cell
                    const vectorIdCell = document.createElement('td');
                    vectorIdCell.textContent = vectorId;
                    row.appendChild(vectorIdCell);
                    
                    // Reference Period cell
                    const refPerCell = document.createElement('td');
                    refPerCell.textContent = dataPoint.refPer;
                    row.appendChild(refPerCell);
                    
                    // Value cell
                    const valueCell = document.createElement('td');
                    valueCell.textContent = dataPoint.value;
                    row.appendChild(valueCell);
                    
                    // Product ID cell
                    const productIdCell = document.createElement('td');
                    productIdCell.textContent = productId;
                    row.appendChild(productIdCell);
                    
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
            if (item.status === 'SUCCESS' && item.object && item.object.vectorDataPoint) {
                const vectorId = item.object.vectorId;
                
                item.object.vectorDataPoint.forEach(dataPoint => {
                    transformedData.push({
                        vectorId: vectorId.toString(),
                        refPer: dataPoint.refPer,
                        value: parseFloat(dataPoint.value)
                    });
                });
            }
        });
        
        // Create Vega spec based on visualization type
        let vegaSpec;
        
        switch (currentVizType) {
            case 'line':
                vegaSpec = createLineChartSpec(transformedData);
                break;
            case 'scatter':
                vegaSpec = createScatterChartSpec(transformedData);
                break;
            case 'bar':
                vegaSpec = createBarChartSpec(transformedData);
                break;
            default:
                vegaSpec = createLineChartSpec(transformedData);
        }
        
        // Render Vega visualization
        vegaEmbed('#visualization', vegaSpec, { actions: true });
    }
    
    // Function to create Line Chart Vega spec
    function createLineChartSpec(data) {
        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            width: 'container',
            height: 400,
            mark: 'line',
            encoding: {
                x: {
                    field: 'refPer',
                    type: 'temporal',
                    title: 'Reference Period'
                },
                y: {
                    field: 'value',
                    type: 'quantitative',
                    title: 'Value'
                },
                color: {
                    field: 'vectorId',
                    type: 'nominal',
                    title: 'Vector ID'
                },
                tooltip: [
                    { field: 'vectorId', type: 'nominal', title: 'Vector ID' },
                    { field: 'refPer', type: 'temporal', title: 'Reference Period' },
                    { field: 'value', type: 'quantitative', title: 'Value' }
                ]
            },
            title: 'Statistics Canada Data - Line Chart'
        };
    }
    
    // Function to create Scatter Chart Vega spec
    function createScatterChartSpec(data) {
        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            width: 'container',
            height: 400,
            mark: 'point',
            encoding: {
                x: {
                    field: 'refPer',
                    type: 'temporal',
                    title: 'Reference Period'
                },
                y: {
                    field: 'value',
                    type: 'quantitative',
                    title: 'Value'
                },
                color: {
                    field: 'vectorId',
                    type: 'nominal',
                    title: 'Vector ID'
                },
                size: { value: 100 },
                tooltip: [
                    { field: 'vectorId', type: 'nominal', title: 'Vector ID' },
                    { field: 'refPer', type: 'temporal', title: 'Reference Period' },
                    { field: 'value', type: 'quantitative', title: 'Value' }
                ]
            },
            title: 'Statistics Canada Data - Scatter Chart'
        };
    }
    
    // Function to create Bar Chart Vega spec
    function createBarChartSpec(data) {
        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            width: 'container',
            height: 400,
            mark: 'bar',
            encoding: {
                x: {
                    field: 'refPer',
                    type: 'temporal',
                    title: 'Reference Period'
                },
                y: {
                    field: 'value',
                    type: 'quantitative',
                    title: 'Value',
                    stack: 'zero'
                },
                color: {
                    field: 'vectorId',
                    type: 'nominal',
                    title: 'Vector ID'
                },
                tooltip: [
                    { field: 'vectorId', type: 'nominal', title: 'Vector ID' },
                    { field: 'refPer', type: 'temporal', title: 'Reference Period' },
                    { field: 'value', type: 'quantitative', title: 'Value' }
                ]
            },
            title: 'Statistics Canada Data - Bar Chart'
        };
    }
});
