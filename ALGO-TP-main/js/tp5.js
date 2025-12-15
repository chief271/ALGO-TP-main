let network = null;
let nodes, edges;
const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Initialize empty network
function initNetwork() {
    const container = document.getElementById('tp5-network');
    nodes = new vis.DataSet([]);
    edges = new vis.DataSet([]);
    const data = { nodes, edges };
    const options = {
        nodes: {
            shape: 'circle',
            size: 25,
            font: { size: 16, color: '#fff', face: 'Arial', bold: true },
            borderWidth: 3,
            borderWidthSelected: 4
        },
        edges: {
            width: 2,
            color: { color: '#94a3b8', highlight: '#475569' }
        },
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -8000,
                springConstant: 0.04,
                springLength: 150
            },
            stabilization: { iterations: 200 }
        }
    };
    network = new vis.Network(container, data, options);
}

// Parse adjacency matrix
function parseMatrix(input) {
    const rows = input.trim().split('\n').filter(r => r.trim());
    const matrix = rows.map(row => 
        row.split(',').map(val => parseInt(val.trim()))
    );
    
    if (matrix.length === 0) throw new Error('Empty matrix');
    const n = matrix.length;
    if (!matrix.every(row => row.length === n)) {
        throw new Error('Matrix must be square');
    }
    
    return matrix;
}

// Create graph from matrix
function createGraphFromMatrix(matrix) {
    const n = matrix.length;
    nodes.clear();
    edges.clear();

    for (let i = 0; i < n; i++) {
        nodes.add({
            id: i,
            label: `${i}`,
            color: { background: '#94a3b8', border: '#64748b' }
        });
    }

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] === 1) {
                edges.add({ from: i, to: j });
            }
        }
    }
}

// Get degree of a vertex
function getDegree(vertex, matrix, availableVertices) {
    let degree = 0;
    for (let v of availableVertices) {
        if (matrix[vertex][v] === 1) degree++;
    }
    return degree;
}

// RLF Algorithm with visualization
async function rlfAlgorithm(matrix) {
    const n = matrix.length;
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const vertexColors = new Array(n).fill(-1);
    let uncoloredVertices = new Set([...Array(n).keys()]);
    let colorClass = 0;
    const colorAssignments = [];

    updateInfo('Starting RLF algorithm...');

    while (uncoloredVertices.size > 0) {
        const currentColorVertices = [];
        const available = new Set(uncoloredVertices);

        // Find vertex with largest degree
        let maxDegree = -1;
        let selectedVertex = -1;
        for (let v of available) {
            const degree = getDegree(v, matrix, available);
            if (degree > maxDegree) {
                maxDegree = degree;
                selectedVertex = v;
            }
        }

        // Color the selected vertex
        vertexColors[selectedVertex] = colorClass;
        currentColorVertices.push(selectedVertex);
        uncoloredVertices.delete(selectedVertex);
        
        // Remove neighbors from available set
        const forbidden = new Set();
        for (let i = 0; i < n; i++) {
            if (matrix[selectedVertex][i] === 1) {
                forbidden.add(i);
            }
        }

        // Find more vertices to color with same color
        while (true) {
            let nextVertex = -1;
            maxDegree = -1;

            for (let v of uncoloredVertices) {
                if (!forbidden.has(v)) {
                    const degree = getDegree(v, matrix, forbidden);
                    if (degree > maxDegree) {
                        maxDegree = degree;
                        nextVertex = v;
                    }
                }
            }

            if (nextVertex === -1) break;

            vertexColors[nextVertex] = colorClass;
            currentColorVertices.push(nextVertex);
            uncoloredVertices.delete(nextVertex);

            // Update forbidden set
            for (let i = 0; i < n; i++) {
                if (matrix[nextVertex][i] === 1) {
                    forbidden.add(i);
                }
            }
        }

        colorAssignments.push({
            color: colorClass,
            vertices: [...currentColorVertices]
        });

        // Visualize this color class
        await visualizeColorClass(currentColorVertices, colorClass, colors[colorClass % colors.length]);
        
        colorClass++;
    }

    updateInfo(`Algorithm complete! Chromatic number: ${colorClass}`);
    displayColorLegend(colorAssignments, colors);
    
    return { vertexColors, chromaticNumber: colorClass };
}

// Visualize coloring a set of vertices
async function visualizeColorClass(vertices, colorClass, color) {
    updateInfo(`Coloring class ${colorClass + 1} with vertices: ${vertices.join(', ')}`);
    
    for (let v of vertices) {
        nodes.update({
            id: v,
            color: { background: color, border: '#1e293b' }
        });
        await sleep(500);
    }
    await sleep(300);
}

// Display color legend
function displayColorLegend(assignments, colors) {
    const legend = document.getElementById('color-legend');
    const legendItems = document.getElementById('legend-items');
    legendItems.innerHTML = '';

    assignments.forEach(assignment => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.innerHTML = `
            <div class="color-box" style="background-color: ${colors[assignment.color % colors.length]}"></div>
            <span>Class ${assignment.color + 1}: Vertices ${assignment.vertices.join(', ')}</span>
        `;
        legendItems.appendChild(item);
    });

    legend.style.display = 'block';
}

// Update info text
function updateInfo(text) {
    document.getElementById('algo-info').textContent = text;
}

// Sleep function for animation
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start button handler
document.getElementById('tp5-start-btn').addEventListener('click', async () => {
    try {
        const input = document.getElementById('tp5-array-input').value;
        if (!input.trim()) {
            alert('Please enter an adjacency matrix!');
            return;
        }

        const matrix = parseMatrix(input);
        createGraphFromMatrix(matrix);
        
        await sleep(1000); // Wait for physics to stabilize
        await rlfAlgorithm(matrix);
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Reset button handler
document.getElementById('tp5-reset-btn').addEventListener('click', () => {
    nodes.clear();
    edges.clear();
    document.getElementById('color-legend').style.display = 'none';
    updateInfo('Enter an adjacency matrix and click "Visualize RLF" to see the algorithm in action.');
});

// Initialize on load
initNetwork();