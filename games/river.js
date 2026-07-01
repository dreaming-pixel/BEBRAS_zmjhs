window.GameRiver = {
    level: 'easy',
    startLogs: 30,
    currentLogs: 30,
    nodes: {}, // node definitions { id: { x, y, label } }
    edges: [], // edge definitions [ { from, to, weight } ]
    selectedPath: [], // Array of node IDs e.g. ['A', 'C', 'D']
    minLoss: 0,
    maxLogs: 0,

    ctExplanation: `
        <h3>💡 運算思維：最佳化路徑與動態規劃</h3>
        <p>此遊戲本質上是尋找圖論中的<b>最短路徑問題 (Shortest Path Problem)</b>。</p>
        <p><b>演算法與應用：</b></p>
        <ul>
            <li>在資訊科學中，解決此類問題最著名的演算法是 <b>Dijkstra 演算法</b>，它被廣泛應用於 Google Maps 等導航軟體中。</li>
            <li>在中級挑戰中，我們需要從起點 A 運送 50 根木頭到終點 H，目標是使途中損失的木頭最少。</li>
            <li>透過逐步計算從 A 到達每個節點的最小損失（類似<b>分治</b>與<b>動態規劃</b>的思維）：
                <ul>
                    <li>到達 B 的最小損失為 2（路徑 A-B）。</li>
                    <li>到達 C 的最小損失為 3（路徑 A-C，若走 A-B-C 為 5 故捨棄）。</li>
                    <li>到達 D 的最小損失為 5（走 A-C-D 損失 3+2=5，比走 A-B-D 損失 2+4=6 更划算）。</li>
                    <li>依此類推，最優路徑是 <b>A ➔ C ➔ D ➔ G ➔ H</b>，總損失為 <b>19</b> 根木頭，能安全運回最多 <b>31</b> 根木頭！</li>
                </ul>
            </li>
        </ul>
    `,

    init(level) {
        this.level = level;
        this.selectedPath = ['A']; // Start with 'A' selected

        if (level === 'easy') {
            this.startLogs = 30;
            this.minLoss = 11;
            this.setupEasyGraph();
        } else if (level === 'medium') {
            this.startLogs = 50;
            this.minLoss = 19;
            this.setupMediumGraph();
        } else { // hard
            this.startLogs = 100;
            this.minLoss = 12;
            this.setupHardGraph();
        }

        this.currentLogs = this.startLogs;
        this.maxLogs = this.startLogs - this.minLoss;

        this.renderInstructions();
        this.renderStage();
        this.renderControls();
    },

    setupEasyGraph() {
        this.nodes = {
            'A': { x: 50, y: 200, label: 'A (起點)' },
            'B': { x: 200, y: 100, label: 'B' },
            'C': { x: 200, y: 300, label: 'C' },
            'D': { x: 350, y: 200, label: 'D' },
            'E': { x: 500, y: 200, label: 'E (終點)' }
        };

        this.edges = [
            { from: 'A', to: 'B', weight: 5 },
            { from: 'A', to: 'C', weight: 3 },
            { from: 'B', to: 'D', weight: 2 },
            { from: 'C', to: 'D', weight: 6 },
            { from: 'D', to: 'E', weight: 4 },
            { from: 'B', to: 'E', weight: 9 }
        ];
    },

    setupMediumGraph() {
        // Exact 2024 Bebras Task coordinates and values
        this.nodes = {
            'A': { x: 60, y: 250, label: 'A (起點)' },
            'B': { x: 200, y: 110, label: 'B' },
            'C': { x: 200, y: 390, label: 'C' },
            'D': { x: 350, y: 250, label: 'D' },
            'E': { x: 420, y: 430, label: 'E' },
            'F': { x: 500, y: 110, label: 'F' },
            'G': { x: 520, y: 340, label: 'G' },
            'H': { x: 660, y: 250, label: 'H (終點)' }
        };

        this.edges = [
            { from: 'A', to: 'B', weight: 2 },
            { from: 'A', to: 'C', weight: 3 },
            { from: 'B', to: 'C', weight: 3 },
            { from: 'B', to: 'D', weight: 4 },
            { from: 'C', to: 'D', weight: 2 },
            { from: 'C', to: 'E', weight: 5 },
            { from: 'D', to: 'F', weight: 7 },
            { from: 'D', to: 'G', weight: 11 },
            { from: 'E', to: 'G', weight: 9 },
            { from: 'F', to: 'H', weight: 8 },
            { from: 'G', to: 'H', weight: 3 }
        ];
    },

    setupHardGraph() {
        this.nodes = {
            'A': { x: 50, y: 250, label: 'A (起點)' },
            'B': { x: 160, y: 130, label: 'B' },
            'C': { x: 160, y: 370, label: 'C' },
            'D': { x: 280, y: 80,  label: 'D' },
            'E': { x: 280, y: 250, label: 'E' },
            'F': { x: 280, y: 420, label: 'F' },
            'G': { x: 400, y: 80,  label: 'G' },
            'H': { x: 400, y: 250, label: 'H' },
            'I': { x: 400, y: 420, label: 'I' },
            'J': { x: 520, y: 160, label: 'J' },
            'K': { x: 650, y: 250, label: 'K (終點)' }
        };

        this.edges = [
            { from: 'A', to: 'B', weight: 4 },
            { from: 'A', to: 'C', weight: 3 },
            { from: 'B', to: 'D', weight: 6 },
            { from: 'B', to: 'E', weight: 5 },
            { from: 'C', to: 'E', weight: 2 },
            { from: 'C', to: 'F', weight: 8 },
            { from: 'D', to: 'G', weight: 3 },
            { from: 'D', to: 'H', weight: 9 },
            { from: 'E', to: 'H', weight: 4 },
            { from: 'E', to: 'I', weight: 5 },
            { from: 'F', to: 'I', weight: 1 },
            { from: 'G', to: 'J', weight: 7 },
            { from: 'H', to: 'J', weight: 2 },
            { from: 'H', to: 'K', weight: 6 },
            { from: 'I', to: 'K', weight: 3 },
            { from: 'J', to: 'K', weight: 1 }
        ];
    },

    renderInstructions() {
        let targetNode = this.level === 'easy' ? 'E' : this.level === 'medium' ? 'H' : 'K';
        let desc = `
            <p><b>河道運輸：</b> 小海狸想從 <b>A (起點)</b> 運送木頭到 <b>${targetNode} (終點)</b>。</p>
            <p>每條河道上的<b>數字</b>代表行經該路線會<b>損失的木頭數量</b>。起點共有 <b>${this.startLogs} 根木頭</b>。</p>
            <p>請在下方圖中依序點選節點來連成一條完整的運輸路線。目標是<b>安全運回最多根木頭</b>！</p>
        `;
        document.getElementById('game-instructions').innerHTML = desc;
    },

    renderStage() {
        const stage = document.getElementById('game-stage');
        
        // Build SVG dimensions
        const svgWidth = 720;
        const svgHeight = 500;

        stage.innerHTML = `
            <div class="river-game-container" style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%;">
                
                <!-- Logs status bar -->
                <div class="river-status-bar" id="river-status" style="font-size: 1.1rem; font-weight: 700; background: rgba(255,255,255,0.05); padding: 0.6rem 1.5rem; border-radius: 30px; border: 1px solid var(--border-color); width: 85%; display: flex; justify-content: space-between; align-items: center;">
                    <span>🪵 目前剩餘木頭: <strong id="river-logs-count" style="color: var(--success); font-size: 1.3rem;">${this.currentLogs}</strong> / ${this.startLogs} 根</span>
                    <span id="river-path-text" style="font-size: 0.9rem; color: var(--text-muted);">路徑: A</span>
                </div>

                <!-- Interactive SVG Graph -->
                <div class="svg-container" style="width: 100%; max-width: ${svgWidth}px; background: rgba(15,23,42,0.4); border-radius: var(--radius-lg); border: 1px solid var(--border-color); overflow: hidden; padding: 10px;">
                    <svg id="river-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto;">
                        <defs>
                            <!-- Glow effects -->
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <!-- Grid lines are drawn dynamically -->
                        <g id="river-svg-edges"></g>
                        <g id="river-svg-nodes"></g>
                    </svg>
                </div>
            </div>
        `;

        this.drawGraph();
    },

    drawGraph() {
        const edgesGroup = document.getElementById('river-svg-edges');
        const nodesGroup = document.getElementById('river-svg-nodes');
        
        edgesGroup.innerHTML = '';
        nodesGroup.innerHTML = '';

        // Helper to check if edge is selected
        const isEdgeSelected = (from, to) => {
            for (let i = 0; i < this.selectedPath.length - 1; i++) {
                const pFrom = this.selectedPath[i];
                const pTo = this.selectedPath[i+1];
                if ((pFrom === from && pTo === to) || (pFrom === to && pTo === from)) {
                    return true;
                }
            }
            return false;
        };

        // Draw Edges (Lines)
        this.edges.forEach((edge, index) => {
            const nFrom = this.nodes[edge.from];
            const nTo = this.nodes[edge.to];
            if (!nFrom || !nTo) return;

            const lineSelected = isEdgeSelected(edge.from, edge.to);

            // Draw line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', nFrom.x);
            line.setAttribute('y1', nFrom.y);
            line.setAttribute('x2', nTo.x);
            line.setAttribute('y2', nTo.y);
            line.setAttribute('stroke', lineSelected ? 'var(--success)' : 'rgba(255,255,255,0.15)');
            line.setAttribute('stroke-width', lineSelected ? '5' : '3');
            if (lineSelected) {
                line.setAttribute('filter', 'url(#glow)');
            }
            line.style.transition = 'all 0.3s ease';
            edgesGroup.appendChild(line);

            // Draw Edge Weight Label Box (background rect for readability)
            const labelX = (nFrom.x + nTo.x) / 2;
            const labelY = (nFrom.y + nTo.y) / 2;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', labelX - 14);
            rect.setAttribute('y', labelY - 14);
            rect.setAttribute('width', '28');
            rect.setAttribute('height', '28');
            rect.setAttribute('rx', '6');
            rect.setAttribute('fill', '#1e293b');
            rect.setAttribute('stroke', lineSelected ? 'var(--success)' : 'rgba(255,255,255,0.1)');
            rect.setAttribute('stroke-width', '1.5');
            rect.style.transition = 'all 0.3s ease';
            edgesGroup.appendChild(rect);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', labelX);
            text.setAttribute('y', labelY + 5); // vertically centered
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', lineSelected ? 'var(--success)' : 'var(--text-muted)');
            text.setAttribute('font-size', '12px');
            text.setAttribute('font-weight', 'bold');
            text.textContent = edge.weight;
            text.style.transition = 'all 0.3s ease';
            edgesGroup.appendChild(text);
        });

        // Draw Nodes (Circles)
        for (const nodeId in this.nodes) {
            const node = this.nodes[nodeId];
            const isSelected = this.selectedPath.includes(nodeId);
            const isLast = this.selectedPath[this.selectedPath.length - 1] === nodeId;

            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.style.cursor = 'pointer';

            // Glow backing for current end node
            if (isLast) {
                const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                glowCircle.setAttribute('cx', node.x);
                glowCircle.setAttribute('cy', node.y);
                glowCircle.setAttribute('r', '24');
                glowCircle.setAttribute('fill', 'var(--primary)');
                glowCircle.setAttribute('filter', 'url(#glow)');
                glowCircle.setAttribute('opacity', '0.6');
                group.appendChild(glowCircle);
            }

            // Main Circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', '20');
            
            let fill = '#1e293b';
            let stroke = 'rgba(255,255,255,0.2)';
            if (isSelected) {
                fill = 'rgba(16, 185, 129, 0.2)';
                stroke = 'var(--success)';
            }
            if (isLast) {
                fill = 'rgba(99, 102, 241, 0.3)';
                stroke = 'var(--primary)';
            }

            circle.setAttribute('fill', fill);
            circle.setAttribute('stroke', stroke);
            circle.setAttribute('stroke-width', isSelected || isLast ? '3' : '2');
            circle.style.transition = 'all 0.3s ease';
            group.appendChild(circle);

            // Node Text Label (inside circle)
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', node.x);
            text.setAttribute('y', node.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', isSelected || isLast ? 'var(--text-main)' : 'var(--text-muted)');
            text.setAttribute('font-size', '14px');
            text.setAttribute('font-weight', 'bold');
            text.textContent = nodeId;
            group.appendChild(text);

            // Node Outer Label (above circle)
            const outerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            outerText.setAttribute('x', node.x);
            outerText.setAttribute('y', node.y - 25);
            outerText.setAttribute('text-anchor', 'middle');
            outerText.setAttribute('fill', isLast ? 'var(--primary)' : 'var(--text-muted)');
            outerText.setAttribute('font-size', '11px');
            outerText.setAttribute('font-weight', 'bold');
            
            // Just display role (Start/End)
            if (nodeId === 'A') {
                outerText.textContent = '起點';
            } else if (this.level === 'easy' && nodeId === 'E') {
                outerText.textContent = '終點';
            } else if (this.level === 'medium' && nodeId === 'H') {
                outerText.textContent = '終點';
            } else if (this.level === 'hard' && nodeId === 'K') {
                outerText.textContent = '終點';
            } else {
                outerText.textContent = '';
            }
            group.appendChild(outerText);

            // Hover Scale Effect
            group.onmouseover = () => {
                circle.setAttribute('r', '23');
            };
            group.onmouseout = () => {
                circle.setAttribute('r', '20');
            };

            // Click listener to select node
            group.onclick = () => this.clickNode(nodeId);

            nodesGroup.appendChild(group);
        }
    },

    renderControls() {
        const controls = document.getElementById('game-controls');
        
        let pathString = this.selectedPath.join(' ➔ ');
        let totalLoss = this.calculatePathLoss();
        let remaining = this.startLogs - totalLoss;
        
        let endNode = this.level === 'easy' ? 'E' : this.level === 'medium' ? 'H' : 'K';
        let reachedEnd = this.selectedPath[this.selectedPath.length - 1] === endNode;

        controls.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
                <div style="display: flex; flex-direction: column; gap: 0.4rem; background: rgba(0,0,0,0.15); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <span style="color: var(--text-muted);">運送起點:</span>
                        <span>A節點</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <span style="color: var(--text-muted);">目前路徑總損失:</span>
                        <span style="color: var(--danger); font-weight: 700;">-${totalLoss} 根</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.4rem; margin-top: 0.4rem;">
                        <span style="color: var(--text-muted);">預計運抵終點量:</span>
                        <strong style="color: var(--success); font-size: 1.1rem;">${remaining} 根</strong>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; width: 100%;">
                    <button class="modal-btn secondary" id="btn-river-reset" style="flex: 1;">清除路徑</button>
                    <button class="modal-btn primary" id="btn-river-submit" style="flex: 2;" ${!reachedEnd ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>確認遞交</button>
                </div>
            </div>
        `;

        document.getElementById('btn-river-reset').onclick = () => {
            Sound.play('click');
            this.selectedPath = ['A'];
            this.updateLogsCount();
            this.drawGraph();
            this.renderControls();
        };

        if (reachedEnd) {
            document.getElementById('btn-river-submit').onclick = () => this.submitPath();
        }
    },

    clickNode(nodeId) {
        // If node is already in the path
        if (this.selectedPath.includes(nodeId)) {
            // If they click a previously clicked node, truncate path back to it (undo)
            const idx = this.selectedPath.indexOf(nodeId);
            if (idx === 0) {
                // Keep only start node 'A'
                this.selectedPath = ['A'];
            } else {
                this.selectedPath = this.selectedPath.slice(0, idx + 1);
            }
            Sound.play('click');
            this.updateLogsCount();
            this.drawGraph();
            this.renderControls();
            return;
        }

        // Check if there is an edge between the last node and the clicked node
        const lastNode = this.selectedPath[this.selectedPath.length - 1];
        const hasEdge = this.edges.some(edge => {
            return (edge.from === lastNode && edge.to === nodeId) || (edge.from === nodeId && edge.to === lastNode);
        });

        if (hasEdge) {
            Sound.play('click');
            this.selectedPath.push(nodeId);
            this.updateLogsCount();
            this.drawGraph();
            this.renderControls();
        } else {
            // Non-adjacent link click, trigger a shake or show warning
            Sound.play('fail');
            const statusBar = document.getElementById('river-status');
            statusBar.style.borderColor = 'var(--danger)';
            setTimeout(() => {
                statusBar.style.borderColor = 'var(--border-color)';
            }, 500);
        }
    },

    calculatePathLoss() {
        let total = 0;
        for (let i = 0; i < this.selectedPath.length - 1; i++) {
            const from = this.selectedPath[i];
            const to = this.selectedPath[i+1];
            
            // Find edge
            const edge = this.edges.find(e => {
                return (e.from === from && e.to === to) || (e.from === to && e.to === from);
            });
            if (edge) total += edge.weight;
        }
        return total;
    },

    updateLogsCount() {
        const loss = this.calculatePathLoss();
        this.currentLogs = this.startLogs - loss;
        document.getElementById('river-logs-count').textContent = this.currentLogs;
        document.getElementById('river-path-text').textContent = `路徑: ${this.selectedPath.join(' ➔ ')}`;
    },

    submitPath() {
        const totalLoss = this.calculatePathLoss();
        const logsTransported = this.startLogs - totalLoss;

        if (logsTransported === this.maxLogs) {
            // Optimal path
            App.completeLevel('river', this.level, this.ctExplanation);
        } else {
            // Suboptimal path
            App.failLevel(`
                <p>雖然成功運抵終點，但您運回了 <b>${logsTransported} 根木頭</b> (損失 ${totalLoss} 根)。</p>
                <p>這不是損失最少的最佳路線！最佳路線可以運回 <b>${this.maxLogs} 根木頭</b> (僅損失 ${this.minLoss} 根)。</p>
                <p>請重新清除路徑，試著找出其他損失更少的分支通路！</p>
            `);
        }
    },

    cleanup() {
        // Nothing special to cleanup
    }
};
