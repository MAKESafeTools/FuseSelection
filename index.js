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

// Device roles are declared by the CSV 'type' column
function isFlaDevice(overload) {
    return /fla/i.test(overload.getProperties().type);
}

function isSsrDevice(overload) {
    return /ssr/i.test(overload.getProperties().type);
}

// Read and validate the motor FLA input; flags the field and falls back to 1 when invalid
// so the reference curves never silently disappear
function getMotorFla() {
    const input = document.getElementById('fla');
    const fla = parseFloat(input.value);
    const valid = isFinite(fla) && fla > 0;
    input.classList.toggle('is-invalid', !valid);
    return valid ? fla : 1;
}

const myChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [],
    },
    options: {
        aspectRatio: 2,
        layout: {
            padding: {
                right: 250  // Increased padding for legend
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
                text: 'Coordination Chart'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.dataset.label || '';
                        const xValue = context.parsed.x;
                        const yValue = context.parsed.y;
                        let xDisplay = xValue;
                        if(xValue < .002) {
                            xDisplay = xValue.toFixed(5);
                        } else if (xValue < .01) {
                            xDisplay = xValue.toFixed(3);
                        } else if (xValue < .1) {
                            xDisplay = xValue.toFixed(2);
                        } else if (xValue < 1) {
                            xDisplay = xValue.toFixed(1);
                        } else if (xValue < 10) {
                            xDisplay = xValue.toFixed(0);
                        }
                        return [label,`( ${xDisplay}, ${yValue.toFixed(1)} )`];
                    }
                }
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

// Build one device row: checkbox + color swatch + label
function createDeviceRow(overload, checked) {
    const overloadIndex = allOverloads.indexOf(overload);

    const div = document.createElement('div');
    div.className = 'form-check';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `overload-${overloadIndex}`;
    checkbox.className = 'form-check-input overload-checkbox';
    checkbox.checked = checked;
    checkbox.dataset.overloadIndex = overloadIndex;
    checkbox.addEventListener('change', updateChartDisplay);

    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.htmlFor = checkbox.id;

    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    label.appendChild(swatch);
    label.appendChild(document.createTextNode(overload.getLabel()));

    div.appendChild(checkbox);
    div.appendChild(label);
    return div;
}

// Sort devices by amp rating so lists read like a catalog (unrated entries last)
function byRating(a, b) {
    const ra = parseFloat(a.getProperties().rating);
    const rb = parseFloat(b.getProperties().rating);
    return (isNaN(ra) ? Infinity : ra) - (isNaN(rb) ? Infinity : rb);
}

// Populate the three study sections: FLA references, protected SSRs, candidate groups
function populateOverloadList(devices) {
    const flaList = document.getElementById('flaList');
    const ssrList = document.getElementById('ssrList');
    const overloadList = document.getElementById('overloadList');
    flaList.innerHTML = '';
    ssrList.innerHTML = '';
    overloadList.innerHTML = '';

    const flaDevices = devices.filter(isFlaDevice);
    const ssrDevices = devices.filter(d => !isFlaDevice(d) && isSsrDevice(d));
    const candidates = devices.filter(d => !isFlaDevice(d) && !isSsrDevice(d));

    // References and the protected device are always visible and start checked
    flaDevices.forEach(d => flaList.appendChild(createDeviceRow(d, true)));
    ssrDevices.slice().sort(byRating).forEach(d => ssrList.appendChild(createDeviceRow(d, true)));

    // Group candidates by type
    const groupedDevices = {};
    candidates.forEach(device => {
        const type = device.getProperties().type || 'Other';
        if (!groupedDevices[type]) {
            groupedDevices[type] = [];
        }
        groupedDevices[type].push(device);
    });

    // Create a collapsible group for each candidate type
    Object.entries(groupedDevices).forEach(([type, typeOverloads]) => {
        typeOverloads.sort(byRating);

        const groupDiv = document.createElement('div');
        groupDiv.className = 'overload-group mb-2';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'group-header d-flex align-items-center mb-1';

        // Expand/collapse control is a real button so it works from the keyboard
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'group-toggle d-flex align-items-center flex-grow-1';
        toggle.setAttribute('aria-expanded', 'false');

        const icon = document.createElement('span');
        icon.className = 'me-2';
        icon.innerHTML = '▶';
        toggle.appendChild(icon);

        const title = document.createElement('span');
        title.className = 'fw-bold';
        title.textContent = type;
        toggle.appendChild(title);

        const count = document.createElement('span');
        count.className = 'ms-1 text-muted';
        count.textContent = `(${typeOverloads.length})`;
        toggle.appendChild(count);

        headerDiv.appendChild(toggle);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsed group-content ms-3';

        toggle.addEventListener('click', () => {
            const collapsed = contentDiv.classList.toggle('collapsed');
            toggle.setAttribute('aria-expanded', String(!collapsed));
            icon.innerHTML = collapsed ? '▶' : '▼';
        });

        // Per-group all/none; selecting all expands the group so the result is visible
        const setGroup = (checked) => {
            contentDiv.querySelectorAll('.overload-checkbox').forEach(cb => { cb.checked = checked; });
            if (checked && contentDiv.classList.contains('collapsed')) {
                toggle.click();
            }
            updateChartDisplay();
        };
        ['all', 'none'].forEach(word => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'group-select ms-2';
            btn.textContent = word;
            btn.addEventListener('click', () => setGroup(word === 'all'));
            headerDiv.appendChild(btn);
        });

        typeOverloads.forEach(overload => contentDiv.appendChild(createDeviceRow(overload, false)));

        groupDiv.appendChild(headerDiv);
        groupDiv.appendChild(contentDiv);
        overloadList.appendChild(groupDiv);
    });

    paintSwatches();
}

// Swatches mirror the chart's color assignment (position among all checkboxes)
function paintSwatches() {
    document.querySelectorAll('.overload-checkbox').forEach((checkbox, index) => {
        const overload = allOverloads[parseInt(checkbox.dataset.overloadIndex)];
        const swatch = checkbox.parentElement.querySelector('.color-swatch');
        if (!swatch || !overload) return;
        swatch.style.backgroundColor = isFlaDevice(overload) ? 'grey' : colorArray[index % colorArray.length];
    });
}

// Restore the default study: references + protected device on, candidates cleared
function resetStudy() {
    document.querySelectorAll('.overload-checkbox').forEach(checkbox => {
        const overload = allOverloads[parseInt(checkbox.dataset.overloadIndex)];
        checkbox.checked = !!overload && (isFlaDevice(overload) || isSsrDevice(overload));
    });
    updateChartDisplay();
}

// Function to update chart based on selected overloads
function updateChartDisplay() {
    // Clear existing datasets
    myChart.data.datasets = [];

    const fla = getMotorFla();
    myChart.options.plugins.title.text = `Coordination @ FLA = ${fla} A`;

    // Get all checkboxes
    const checkboxes = document.querySelectorAll('.overload-checkbox');

    // Add datasets for checked overloads
    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked) {
            // Use the stored overloadIndex to get the correct overload
            const overloadIndex = parseInt(checkbox.dataset.overloadIndex);

            if (allOverloads[overloadIndex]) {
                const overload = allOverloads[overloadIndex];
                const data = overload.getSortedData();
                const properties = overload.getProperties();
                const is_FLA = isFlaDevice(overload);
                const color = is_FLA ? 'grey' : colorArray[index % colorArray.length];
                myChart.data.datasets.push({
                    label: overload.getLabel(),
                    data: data.map(point => ({
                        x: point.time,
                        y: is_FLA ? point.current * fla : point.current
                    })),
                    showLine: true,
                    borderColor: color,
                    backgroundColor: color,
                    pointRadius: is_FLA ? 1 : 3,
                    borderWidth: is_FLA ? 2 : 3,
                    borderDash: properties.type === 'fuse' ? [5, 5] : [], // Add dashed line for fuses
                    fill: false

                });
            }
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

// Rescale the FLA reference curves live as the motor FLA is typed
document.getElementById('fla').addEventListener('input', updateChartDisplay);

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
