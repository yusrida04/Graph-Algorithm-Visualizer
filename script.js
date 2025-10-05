class GraphVisualizer {
    constructor() {
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.nodeRadius = 20;
        this.selectedAlgorithm = 'bfs';
        this.isVisualizing = false;
        this.animationSpeed = 500;
        
        // State untuk drag & drop
        this.draggingNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.mode = 'addNode'; // Default mode
        this.firstNode = null;
        
        // Algorithm state
        this.algorithmState = {
            visited: new Set(),
            queue: [],
            currentStep: 0,
            result: [],
            distances: {}
        };

        this.initEventListeners();
        this.createSampleGraph();
        this.drawGraph();
        this.updateModeButtons();
    }

    initEventListeners() {
        // Canvas interactions
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Control buttons
        document.getElementById('addNodeBtn').addEventListener('click', () => {
            this.setMode('addNode');
        });

        document.getElementById('addEdgeBtn').addEventListener('click', () => {
            this.setMode('addEdge');
        });

        document.getElementById('dragNodeBtn').addEventListener('click', () => {
            this.setMode('dragNode');
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus seluruh graph?')) {
                this.nodes = [];
                this.edges = [];
                this.drawGraph();
                this.updateStatus('Graph telah dihapus');
            }
        });

        document.getElementById('randomGraphBtn').addEventListener('click', () => {
            this.createRandomGraph();
        });

        document.getElementById('algorithmSelect').addEventListener('change', (e) => {
            this.selectedAlgorithm = e.target.value;
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.startVisualization();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetVisualization();
        });

        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.animationSpeed = 2100 - e.target.value;
        });
    }

    setMode(mode) {
        this.mode = mode;
        this.firstNode = null;
        this.draggingNode = null;
        
        if (mode === 'addNode') {
            this.updateStatus('Mode: Tambah Node - Klik di canvas untuk menambah node');
            this.canvas.style.cursor = 'crosshair';
        } else if (mode === 'addEdge') {
            this.updateStatus('Mode: Tambah Edge - Klik dua node untuk menghubungkan');
            this.canvas.style.cursor = 'pointer';
        } else if (mode === 'dragNode') {
            this.updateStatus('Mode: Drag Node - Drag node untuk memindahkan posisi');
            this.canvas.style.cursor = 'grab';
        }
        
        this.updateModeButtons();
        this.drawGraph();
    }

    updateModeButtons() {
        // Reset semua tombol mode
        document.getElementById('addNodeBtn').classList.remove('mode-active');
        document.getElementById('addEdgeBtn').classList.remove('mode-active');
        document.getElementById('dragNodeBtn').classList.remove('mode-active');
        
        // Aktifkan tombol mode yang dipilih
        if (this.mode === 'addNode') {
            document.getElementById('addNodeBtn').classList.add('mode-active');
        } else if (this.mode === 'addEdge') {
            document.getElementById('addEdgeBtn').classList.add('mode-active');
        } else if (this.mode === 'dragNode') {
            document.getElementById('dragNodeBtn').classList.add('mode-active');
        }
    }

    handleCanvasClick(e) {
        if (this.isVisualizing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.mode === 'addNode') {
            this.addNode(x, y);
        } else if (this.mode === 'addEdge') {
            const clickedNode = this.getNodeAt(x, y);
            if (clickedNode) {
                if (!this.firstNode) {
                    this.firstNode = clickedNode;
                    this.updateStatus(`Node ${clickedNode.id} selected, pilih node tujuan`);
                } else {
                    this.addEdge(this.firstNode, clickedNode);
                    this.firstNode = null;
                    this.updateStatus('Edge ditambahkan');
                }
            }
        }
    }

    handleMouseDown(e) {
        if (this.isVisualizing || this.mode !== 'dragNode') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedNode = this.getNodeAt(x, y);
        if (clickedNode) {
            this.draggingNode = clickedNode;
            this.dragOffset.x = x - clickedNode.x;
            this.dragOffset.y = y - clickedNode.y;
            this.canvas.style.cursor = 'grabbing';
            this.updateStatus(`Dragging node ${clickedNode.id}`);
        }
    }

    handleMouseMove(e) {
        if (this.draggingNode) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Update posisi node
            this.draggingNode.x = x - this.dragOffset.x;
            this.draggingNode.y = y - this.dragOffset.y;

            // Pastikan node tidak keluar dari canvas
            this.draggingNode.x = Math.max(this.nodeRadius, Math.min(this.canvas.width - this.nodeRadius, this.draggingNode.x));
            this.draggingNode.y = Math.max(this.nodeRadius, Math.min(this.canvas.height - this.nodeRadius, this.draggingNode.y));

            this.drawGraph();
        }
    }

    handleMouseUp() {
        if (this.draggingNode) {
            this.draggingNode = null;
            this.canvas.style.cursor = 'grab';
            this.updateStatus('Node dipindahkan');
        }
    }

    addNode(x, y) {
        // Cek apakah posisi terlalu dekat dengan node lain
        const tooClose = this.nodes.some(node => {
            const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
            return distance < this.nodeRadius * 3;
        });
        
        if (tooClose) {
            this.updateStatus('Posisi terlalu dekat dengan node lain');
            return;
        }

        const id = `N${this.nodes.length + 1}`;
        this.nodes.push({ id, x, y });
        this.drawGraph();
        this.updateStatus(`Node ${id} ditambahkan`);
    }

    addEdge(node1, node2) {
        if (node1 === node2) {
            this.updateStatus('Tidak dapat menghubungkan node dengan dirinya sendiri');
            return;
        }
        
        const edgeExists = this.edges.some(edge => 
            (edge.from === node1.id && edge.to === node2.id) ||
            (edge.from === node2.id && edge.to === node1.id)
        );

        if (!edgeExists) {
            this.edges.push({ 
                from: node1.id, 
                to: node2.id,
                weight: Math.floor(Math.random() * 10) + 1
            });
            this.drawGraph();
            this.updateStatus(`Edge dibuat antara ${node1.id} dan ${node2.id}`);
        } else {
            this.updateStatus('Edge sudah ada antara node ini');
        }
    }

    getNodeAt(x, y) {
        return this.nodes.find(node => {
            const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
            return distance <= this.nodeRadius;
        });
    }

    drawGraph() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges
        this.edges.forEach(edge => {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            
            if (fromNode && toNode) {
                this.drawEdge(fromNode, toNode, edge.weight);
            }
        });

        // Draw nodes
        this.nodes.forEach(node => {
            this.drawNode(node);
        });

        // Highlight first node when adding edge
        if (this.mode === 'addEdge' && this.firstNode) {
            this.highlightNode(this.firstNode);
        }
    }

    drawNode(node) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
        
        if (this.algorithmState.visited.has(node.id)) {
            this.ctx.fillStyle = '#ff6b6b';
        } else if (this.algorithmState.current === node.id) {
            this.ctx.fillStyle = '#4ecdc4';
        } else {
            this.ctx.fillStyle = '#667eea';
        }
        
        this.ctx.fill();
        this.ctx.strokeStyle = '#495057';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw node label
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.id, node.x, node.y);
    }

    highlightNode(node) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, this.nodeRadius + 5, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#ffc107';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    drawEdge(fromNode, toNode, weight) {
        this.ctx.beginPath();
        this.ctx.moveTo(fromNode.x, fromNode.y);
        this.ctx.lineTo(toNode.x, toNode.y);
        this.ctx.strokeStyle = '#adb5bd';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw weight
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        
        this.ctx.fillStyle = '#495057';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(weight, midX, midY - 10);
    }

    createSampleGraph() {
        this.nodes = [
            { id: 'N1', x: 200, y: 150 },
            { id: 'N2', x: 400, y: 150 },
            { id: 'N3', x: 200, y: 300 },
            { id: 'N4', x: 400, y: 300 },
        ];

        this.edges = [
            { from: 'N1', to: 'N4', weight: 6 },
            { from: 'N4', to: 'N3', weight: 6 },
            { from: 'N3', to: 'N2', weight: 1 },
            { from: 'N2', to: 'N1', weight: 10 }
        ];
        
        this.updateStatus('Graph contoh telah dibuat');
    }

    createRandomGraph() {
        this.nodes = [];
        this.edges = [];
        
        const nodeCount = 6;
        const positions = [
            {x: 200, y: 150}, {x: 400, y: 150},
            {x: 150, y: 300}, {x: 450, y: 300},
            {x: 250, y: 400}, {x: 350, y: 400}
        ];
        
        for (let i = 0; i < nodeCount; i++) {
            this.addNode(positions[i].x, positions[i].y);
        }

        // Buat graph terhubung
        for (let i = 1; i < nodeCount; i++) {
            const fromNode = this.nodes[i-1];
            const toNode = this.nodes[i];
            this.addEdge(fromNode, toNode);
        }
        
        // Tambah beberapa edges acak
        for (let i = 0; i < 3; i++) {
            const fromIndex = Math.floor(Math.random() * nodeCount);
            let toIndex = Math.floor(Math.random() * nodeCount);
            
            if (fromIndex !== toIndex) {
                const fromNode = this.nodes[fromIndex];
                const toNode = this.nodes[toIndex];
                this.addEdge(fromNode, toNode);
            }
        }
        
        this.updateStatus('Random graph generated');
    }

    async startVisualization() {
        if (this.isVisualizing) return;
        
        if (this.nodes.length === 0) {
            this.updateStatus('Error: Tidak ada node untuk divisualisasikan.');
            return;
        }
        
        this.isVisualizing = true;
        this.resetVisualization();
        this.updateButtonsState();

        const startNode = this.nodes[0];
        
        try {
            switch (this.selectedAlgorithm) {
                case 'bfs':
                    await this.visualizeBFS(startNode);
                    break;
                case 'dfs':
                    await this.visualizeDFS(startNode);
                    break;
                case 'dijkstra':
                    await this.visualizeDijkstra(startNode);
                    break;
            }
            
            this.updateStatus('Visualization completed');
        } catch (error) {
            console.error('Error during visualization:', error);
            this.updateStatus('Terjadi kesalahan selama visualisasi');
        } finally {
            this.isVisualizing = false;
            this.updateButtonsState();
        }
    }

    async visualizeBFS(startNode) {
        const queue = [startNode.id];
        this.algorithmState.visited.add(startNode.id);
        this.algorithmState.result.push(startNode.id);
        
        while (queue.length > 0 && this.isVisualizing) {
            const currentId = queue.shift();
            this.algorithmState.current = currentId;
            
            this.algorithmState.queue = [...queue];
            this.algorithmState.currentStep++;
            this.updateInfoPanel();
            this.drawGraph();
            
            await this.delay();
            
            const neighbors = this.getNeighbors(currentId);
            
            for (const neighbor of neighbors) {
                if (!this.algorithmState.visited.has(neighbor)) {
                    this.algorithmState.visited.add(neighbor);
                    queue.push(neighbor);
                    this.algorithmState.result.push(neighbor);
                }
            }
        }
    }

    async visualizeDFS(startNode) {
        const stack = [startNode.id];
        this.algorithmState.visited.add(startNode.id);
        this.algorithmState.result = [startNode.id];
        
        while (stack.length > 0 && this.isVisualizing) {
            const currentId = stack.pop();
            this.algorithmState.current = currentId;
            
            this.algorithmState.queue = [...stack];
            this.algorithmState.currentStep++;
            this.updateInfoPanel();
            this.drawGraph();
            
            await this.delay();
            
            let neighbors = this.getNeighbors(currentId);
            
            neighbors.reverse();
            
            for (const neighbor of neighbors) {
                if (!this.algorithmState.visited.has(neighbor)) {
                    this.algorithmState.visited.add(neighbor);
                    stack.push(neighbor);
                    this.algorithmState.result.push(neighbor);
                }
            }
        }
    }

    async visualizeDijkstra(startNode) {
        const distances = {};
        const previous = {};
        const unvisited = new Set(this.nodes.map(n => n.id));
        
        // Initialize distances
        this.nodes.forEach(node => {
            distances[node.id] = node.id === startNode.id ? 0 : Infinity;
            previous[node.id] = null;
        });
        
        this.algorithmState.distances = {...distances};
        
        while (unvisited.size > 0 && this.isVisualizing) {
            // Find node with smallest distance
            let currentId = null;
            let smallestDistance = Infinity;
            
            for (const nodeId of unvisited) {
                if (distances[nodeId] < smallestDistance) {
                    smallestDistance = distances[nodeId];
                    currentId = nodeId;
                }
            }
            
            if (currentId === null || distances[currentId] === Infinity) break;
            
            this.algorithmState.current = currentId;
            this.algorithmState.visited.add(currentId);
            unvisited.delete(currentId);
            
            // Update UI
            this.algorithmState.currentStep++;
            this.algorithmState.distances = {...distances};
            this.updateInfoPanel();
            this.drawGraph();
            
            await this.delay();
            
            // Update neighbors' distances
            const neighbors = this.getNeighborsWithWeights(currentId);
            for (const { neighbor, weight } of neighbors) {
                if (unvisited.has(neighbor)) {
                    const newDistance = distances[currentId] + weight;
                    if (newDistance < distances[neighbor]) {
                        distances[neighbor] = newDistance;
                        previous[neighbor] = currentId;
                    }
                }
            }
        }
        
        // Set result untuk Dijkstra
        this.algorithmState.result = this.buildDijkstraResult(distances, previous, startNode.id);
        this.algorithmState.distances = distances;
        this.updateInfoPanel();
    }

    buildDijkstraResult(distances, previous, startNode) {
        const result = [];
        
        for (const nodeId in distances) {
            if (distances[nodeId] !== Infinity) {
                const path = this.getShortestPath(previous, startNode, nodeId);
                if (path.length > 1) {
                    result.push(`${startNode}→${nodeId}: ${path.join('→')} (cost: ${distances[nodeId]})`);
                }
            }
        }
        
        return result.length > 0 ? result : ['No paths found'];
    }

    getShortestPath(previous, startNode, endNode) {
        const path = [];
        let current = endNode;
        
        while (current !== null) {
            path.unshift(current);
            current = previous[current];
        }
        
        return path[0] === startNode ? path : [];
    }

    getNeighbors(nodeId) {
        const neighbors = [];
        this.edges.forEach(edge => {
            if (edge.from === nodeId) {
                neighbors.push(edge.to);
            }
            if (edge.to === nodeId) {
                neighbors.push(edge.from);
            }
        });
        
        return neighbors.sort((a, b) => a.localeCompare(b));
    }

    getNeighborsWithWeights(nodeId) {
        const neighbors = [];
        this.edges.forEach(edge => {
            if (edge.from === nodeId) {
                neighbors.push({ neighbor: edge.to, weight: edge.weight });
            }
            if (edge.to === nodeId) {
                neighbors.push({ neighbor: edge.from, weight: edge.weight });
            }
        });
        return neighbors;
    }

    delay() {
        return new Promise(resolve => setTimeout(resolve, this.animationSpeed));
    }

    resetVisualization() {
        this.algorithmState = {
            visited: new Set(),
            queue: [],
            currentStep: 0,
            current: null,
            result: [],
            distances: {}
        };
        this.drawGraph();
        this.updateInfoPanel();
        this.updateStatus('Visualization reset');
    }

    updateButtonsState() {
        const buttons = ['addNodeBtn', 'addEdgeBtn', 'dragNodeBtn', 'clearBtn', 'randomGraphBtn', 'startBtn'];
        buttons.forEach(id => {
            document.getElementById(id).disabled = this.isVisualizing;
        });
        
        document.getElementById('resetBtn').disabled = !this.isVisualizing && 
            this.algorithmState.currentStep === 0;
    }

    updateInfoPanel() {
        const isDFS = this.selectedAlgorithm === 'dfs';
        const isDijkstra = this.selectedAlgorithm === 'dijkstra';
        
        const queueLabel = isDFS ? 'Stack' : 'Queue';
        document.getElementById('queueInfo').textContent = 
            `${queueLabel}: [${this.algorithmState.queue.join(', ')}]`;
        
        document.getElementById('visitedInfo').textContent = 
            `Visited: [${Array.from(this.algorithmState.visited).join(', ')}]`;
        
        document.getElementById('stepInfo').textContent = 
            `Step: ${this.algorithmState.currentStep}`;
        
        if (isDijkstra && this.algorithmState.distances) {
            const distancesText = Object.entries(this.algorithmState.distances)
                .map(([node, dist]) => `${node}:${dist === Infinity ? '∞' : dist}`)
                .join(', ');
            document.getElementById('resultInfo').textContent = 
                `Distances: {${distancesText}}`;
        } else {
            const resultText = Array.isArray(this.algorithmState.result) 
                ? this.algorithmState.result.join(' → ') 
                : this.algorithmState.result;
                
            document.getElementById('resultInfo').textContent = 
                `Result: ${resultText}`;
        }
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }
}

// Initialize the application when page loads
window.addEventListener('load', () => {
    new GraphVisualizer();
});