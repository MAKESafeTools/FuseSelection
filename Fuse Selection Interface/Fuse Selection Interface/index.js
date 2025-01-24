const ctx = document.getElementById('myChart');

const colorArray = [ 
    'rgba(75, 192, 192, 0.6)',   // teal
    'rgba(255, 99, 132, 0.6)',   // red
    'rgba(54, 162, 235, 0.6)',   // blue
    'rgba(255, 206, 86, 0.6)',   // yellow
    'rgba(153, 102, 255, 0.6)  ',  // purple
    'rgba(255, 159, 64, 0.6)',   // orange
    'rgba(201, 203, 207, 0.6)',  // grey
    'rgba(0, 204, 102, 0.6)',    // green
    'rgba(102, 51, 153, 0.6)',   // dark purple
    'rgba(255, 102, 178, 0.6)',  // pink
  
    // Additional distinct colors
    'rgba(0, 128, 255, 0.6)',    // bright blue 
    'rgba(255, 255, 0, 0.6)',    // bright yellow
    'rgba(128, 0, 0, 0.6)',      // maroon
    'rgba(0, 153, 76, 0.6)',     // forest green
    'rgba(255, 128, 0, 0.6)',    // deep orange
    'rgba(76, 0, 153, 0.6)',     // indigo
    'rgba(102, 255, 178, 0.6)',  // light mint
    'rgba(204, 102, 255, 0.6)',  // lavender
    'rgba(0, 102, 204, 0.6)',    // cobalt blue
    'rgba(255, 51, 51, 0.6)'     // bright red
];

// Store overloads globally
let allOverloads = []; 

const myChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [],
    },
    options: {
        aspectRatio: 2,
        layout: {
            padding: {
                right: 150  // Make room for legend
            }
        },
        scales: {
            x: {
                ticks: {
                    callback: function(value) {
                        if(value < .002) {
                            return value.toFixed(5); 
                        } else if (value < .01) {
                            return value.toFixed(3); 
                        } else if (value < .1) {
                            return value.toFixed(2); 
                        } else if (value < 1) {
                            return value.toFixed(1);
                        } else if (value < 10) {
                            return value.toFixed(0);
                        } else return value;
                    }
                },
                
                type: 'logarithmic',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Time'
                }
            },
            y: {
                ticks: {
                    callback: function(value) {
                      return value.toFixed(0); // Limits tick values to 2 decimal places
                    }
                },
                type: 'linear',
                position: 'left',
                title: {
                    display: true,
                    text: 'Current' 
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'Overload Data'
            },
            legend: {
                display: true,
                position: 'right',
                align: 'start',
                labels: {
                    boxWidth: 20,
                    padding: 10,
                    textAlign: 'left'
                }
            }
        }
    }
});

// Function to populate overload checkboxes
function populateOverloadList(overloads) {
    const overloadList = document.getElementById('overloadList');
    overloadList.innerHTML = ''; // Clear existing checkboxes
    
    overloads.forEach((overload, index) => {
        const div = document.createElement('div');
        div.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `overload-${index}`;
        checkbox.className = 'form-check-input overload-checkbox';
        checkbox.checked = true; // Default to checked
        checkbox.addEventListener('change', updateChartDisplay);
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `overload-${index}`;
        label.textContent = overload.getLabel();
        
        div.appendChild(checkbox);
        div.appendChild(label);
        overloadList.appendChild(div);
    });
}

// Function to select/deselect all overloads
function selectAllOverloads(checked) {
    document.querySelectorAll('.overload-checkbox').forEach(checkbox => {
        checkbox.checked = checked;
    });
    updateChartDisplay();
}

// Function to update chart based on selected overloads
function updateChartDisplay() {
    // Clear existing datasets
    myChart.data.datasets = [];
    
    // Get all checkboxes
    const checkboxes = document.querySelectorAll('.overload-checkbox');
    
    // Add datasets for checked overloads
    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked && allOverloads[index]) {
            const overload = allOverloads[index];
            const data = overload.getSortedData();
            const properties = overload.getProperties();
            
            myChart.data.datasets.push({
                label: overload.getLabel(),
                data: data.map(point => ({
                    x: point.time,
                    y: point.current
                })),
                showLine: true,
                borderColor: colorArray[index % colorArray.length],
                backgroundColor: colorArray[index % colorArray.length],
                pointRadius: 3,
                borderWidth: 2,
                borderDash: properties.type === 'fuse' ? [5, 5] : [], // Add dashed line for fuses
                fill: false
            });
        }
    });
    
    myChart.update();
    updateAxisRanges();
}

// Store original axis ranges
let originalRanges = {
    xMin: null,
    xMax: null,
    yMin: null, 
    yMax: null
};

// Function to update axis types
function updateAxisTypes() {
    const xAxisLog = document.getElementById('xAxisLog').checked;
    const yAxisLog = document.getElementById('yAxisLog').checked;
    
    myChart.options.scales.x.type = xAxisLog ? 'logarithmic' : 'linear';
    myChart.options.scales.y.type = yAxisLog ? 'logarithmic' : 'linear';
    
    myChart.update();
}

// Function to update axis ranges
function updateAxisRanges() {
    const xMin = document.getElementById('xMin').value;
    const xMax = document.getElementById('xMax').value;
    const yMin = document.getElementById('yMin').value;
    const yMax = document.getElementById('yMax').value;

    const allEmpty = !xMin && !xMax && !yMin && !yMax;
    
    if (allEmpty) {
        // Reset to auto scaling
        myChart.options.scales.x.min = undefined;
        myChart.options.scales.x.max = undefined;
        myChart.options.scales.y.min = undefined;
        myChart.options.scales.y.max = undefined;
    } else {
        // Update ranges if values are provided, otherwise set to auto (undefined)
        myChart.options.scales.x.min = xMin !== '' ? parseFloat(xMin) : undefined;
        myChart.options.scales.x.max = xMax !== '' ? parseFloat(xMax) : undefined;
        myChart.options.scales.y.min = yMin !== '' ? parseFloat(yMin) : undefined;
        myChart.options.scales.y.max = yMax !== '' ? parseFloat(yMax) : undefined;
    }

    myChart.update();
}

// Add event listeners for axis type checkboxes
document.getElementById('xAxisLog').addEventListener('change', updateAxisTypes);
document.getElementById('yAxisLog').addEventListener('change', updateAxisTypes);

// Add event listeners for range inputs
document.getElementById('xMin').addEventListener('blur', updateAxisRanges);
document.getElementById('xMax').addEventListener('blur', updateAxisRanges);
document.getElementById('yMin').addEventListener('blur', updateAxisRanges);
document.getElementById('yMax').addEventListener('blur', updateAxisRanges);

// Modified load and display function to handle checkboxes
async function loadAndDisplayOverloadData() {
    try {
        allOverloads = await Overload.loadFromUrl('https://docs.google.com/spreadsheets/d/1FFMfCSl5xtW77oJwEzK4CP14w0rE70TyHUfODs9U6ic/pub?gid=118551&single=true&output=csv');
        populateOverloadList(allOverloads);
        updateChartDisplay();
        updateAxisTypes();
    } catch (error) {
        console.error('Error loading and displaying overload data:', error);
    }
}

// Load and display the data
loadAndDisplayOverloadData();
