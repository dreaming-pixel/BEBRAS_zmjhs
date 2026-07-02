window.GameTaxi = {
    level: 'easy',
    nodes: {},
    edges: [],
    taxi: { x: 0, y: 0, dirX: 0, dirY: 0, currentPath: [], lastNode: null },
    destination: { x: 0, y: 0 },
    userGuess: '',
    simulationInterval: null,
    isAnimating: false,
    correctSequence: '',
    
    ctExplanation: `
        <h3>💡 運算思維：演算法執行與狀態機</h3>
        <p>此遊戲探討了<b>演算法的精確執行</b>。電腦（自動駕駛車）本身沒有自主意識，牠只能死板地執行人類編寫的三條規則：</p>
        <ol>
            <li>無岔路時，沿著路直行。</li>
            <li>有岔路時，計算每條路與目的地所形成的幾何夾角，並走<b>夾角最小</b>的一條。</li>
            <li>死路時，原地迴轉。</li>
        </ol>
        <p><b>幾何向量與夾角計算：</b></p>
        <ul>
            <li>在有向圖中，每次車輛到達路口，系統會計算各個出口方向的向量 $\\vec{u}$，與路口指向目的地向量 $\\vec{v}$。</li>
            <li>利用向量內積公式：$\\cos \\theta = \\frac{\\vec{u} \\cdot \\vec{v}}{\\|\\vec{u}\\| \\|\\vec{v}\\|}$，計算出夾角 $\\theta$。</li>
            <li>計程車會選擇 $\\theta$ 最小的方向。在中級挑戰中，計程車在 <b>E</b> 路口選擇向右（直行）前往 <b>F</b>；到達 <b>F</b> 後，因為向上前往 <b>B</b> 的夾角為 0 度，故左轉向上，並在途中抵達黃色目的地。</li>
            <li>因此，經過的路口順序為：<b>EF</b>。</li>
        </ul>
    `,

    init(level) {
        this.level = level;
        this.userGuess = '';
        this.isAnimating = false;
        if (this.simulationInterval) clearInterval(this.simulationInterval);

        if (level === 'easy') {
            this.setupEasy();
        } else if (level === 'medium') {
            this.setupMedium();
        } else {
            this.setupHard();
        }

        // Precalculate the correct path using the algorithm
        this.correctSequence = this.simulateAlgorithm();

        this.renderInstructions();
        this.renderStage();
        this.renderControls();
    },

    setupEasy() {
        // Simple T junction
        this.nodes = {
            'D': { x: 100, y: 250, type: 'deadend' },
            'E': { x: 350, y: 250, type: 'junction' },
            'A': { x: 350, y: 100, type: 'deadend' }
        };
        
        this.edges = [
            { from: 'D', to: 'E' },
            { from: 'E', to: 'A' }
        ];

        // Destination is on E-A, at y=170
        this.destination = { x: 350, y: 150 };

        // Taxi starts between D and E
        this.taxi = {
            x: 200, y: 250,
            dirX: 1, dirY: 0,
            lastNode: 'D',
            currentPath: []
        };
    },

    setupMedium() {
        // The exact Bebras task layout
        this.nodes = {
            'D': { x: 80, y: 350, type: 'deadend' },
            'E': { x: 220, y: 350, type: 'junction' },
            'A': { x: 220, y: 180, type: 'junction' },
            'B': { x: 420, y: 180, type: 'junction' },
            'C': { x: 580, y: 180, type: 'deadend' },
            'F': { x: 420, y: 350, type: 'junction' }
        };

        this.edges = [
            { from: 'D', to: 'E' },
            { from: 'E', to: 'A' },
            { from: 'E', to: 'F' },
            { from: 'A', to: 'B' },
            // Add a deadend to the left of A for realistic branch
            { from: 'A', to: 'A_dead', fake: true, x: 80, y: 180 },
            { from: 'B', to: 'C' },
            { from: 'B', to: 'F' },
            // Add a deadend below F (house)
            { from: 'F', to: 'F_dead', fake: true, x: 420, y: 440 }
        ];

        // Destination: on the B-F vertical road at y=250
        this.destination = { x: 420, y: 260 };

        // Taxi starts between D and E, facing E
        this.taxi = {
            x: 140, y: 350,
            dirX: 1, dirY: 0,
            lastNode: 'D',
            currentPath: []
        };
    },

    setupHard() {
        // Complex maze map
        this.nodes = {
            'D': { x: 80, y: 350, type: 'deadend' },
            'E': { x: 200, y: 350, type: 'junction' },
            'A': { x: 200, y: 200, type: 'junction' },
            'B': { x: 380, y: 200, type: 'junction' },
            'C': { x: 380, y: 350, type: 'junction' },
            'F': { x: 540, y: 350, type: 'junction' },
            'G': { x: 540, y: 200, type: 'junction' },
            'H': { x: 540, y: 80,  type: 'deadend' }
        };

        this.edges = [
            { from: 'D', to: 'E' },
            { from: 'E', to: 'A' },
            { from: 'E', to: 'C' },
            { from: 'A', to: 'B' },
            { from: 'B', to: 'C' },
            { from: 'C', to: 'F' },
            { from: 'B', to: 'G' },
            { from: 'F', to: 'G' },
            { from: 'G', to: 'H' }
        ];

        // Destination is at H
        this.destination = { x: 540, y: 80 };

        // Taxi starts between D and E
        this.taxi = {
            x: 130, y: 350,
            dirX: 1, dirY: 0,
            lastNode: 'D',
            currentPath: []
        };
    },

    // Runs a mathematical simulation of the rules to compute the exact junction sequence
    simulateAlgorithm() {
        // Clone taxi state
        let x = this.taxi.x;
        let y = this.taxi.y;
        let dx = this.taxi.dirX;
        let dy = this.taxi.dirY;
        let lastNode = this.taxi.lastNode;
        let path = [];

        let dest = this.destination;
        let step = 5; // Pixels per step
        let maxSteps = 1000;

        for (let s = 0; s < maxSteps; s++) {
            // Check if reached destination
            let distToDest = Math.hypot(x - dest.x, y - dest.y);
            if (distToDest < 10) {
                break;
            }

            // Move
            x += dx * step;
            y += dy * step;

            // Check if we hit any node (except fake ones)
            let hitNode = null;
            for (const nodeId in this.nodes) {
                const node = this.nodes[nodeId];
                if (Math.hypot(x - node.x, y - node.y) < 6) {
                    hitNode = nodeId;
                    break;
                }
            }

            // Also check fake node coordinates (for deadends)
            let hitFake = null;
            this.edges.forEach(edge => {
                if (edge.fake) {
                    if (Math.hypot(x - edge.x, y - edge.y) < 6) {
                        hitFake = edge;
                    }
                }
            });

            if (hitFake) {
                // Dead end: Turn back!
                dx = -dx;
                dy = -dy;
                // Offset slightly to prevent re-triggering
                x += dx * 10;
                y += dy * 10;
            }

            if (hitNode && hitNode !== lastNode) {
                // We reached a node!
                // Add to path if it's a real junction
                if (this.nodes[hitNode].type === 'junction') {
                    path.push(hitNode);
                }

                // If it's a deadend, U-turn
                if (this.nodes[hitNode].type === 'deadend') {
                    dx = -dx;
                    dy = -dy;
                    x += dx * 10;
                    y += dy * 10;
                    lastNode = hitNode;
                    continue;
                }

                // Junction: Choose branching direction
                // Get all outgoing edges from this node
                let branches = [];
                this.edges.forEach(edge => {
                    let neighbor = null;
                    let fakeX = null, fakeY = null;
                    if (edge.from === hitNode) {
                        neighbor = edge.to;
                        if (edge.fake) { fakeX = edge.x; fakeY = edge.y; }
                    } else if (edge.to === hitNode) {
                        neighbor = edge.from;
                    }

                    if (neighbor) {
                        // Calculate direction vector of branch
                        let nx = fakeX !== null ? fakeX : (this.nodes[neighbor] ? this.nodes[neighbor].x : 0);
                        let ny = fakeY !== null ? fakeY : (this.nodes[neighbor] ? this.nodes[neighbor].y : 0);
                        let bdx = nx - x;
                        let bdy = ny - y;
                        let len = Math.hypot(bdx, bdy);
                        bdx /= len;
                        bdy /= len;

                        // Don't go back directly (180 degree U-turn is forbidden at junctions unless deadend)
                        let dotPrev = bdx * dx + bdy * dy;
                        if (dotPrev < -0.9) return; // Skip going back

                        branches.push({ dx: bdx, dy: bdy, name: neighbor });
                    }
                });

                if (branches.length > 0) {
                    // Vector to destination
                    let vX = dest.x - x;
                    let vY = dest.y - y;
                    let vLen = Math.hypot(vX, vY);
                    vX /= vLen;
                    vY /= vLen;

                    // Find branch with smallest angle (largest cosine)
                    let bestBranch = null;
                    let maxCos = -2;

                    branches.forEach(b => {
                        let dot = b.dx * vX + b.dy * vY;
                        if (dot > maxCos) {
                            maxCos = dot;
                            bestBranch = b;
                        }
                    });

                    if (bestBranch) {
                        dx = bestBranch.dx;
                        dy = bestBranch.dy;
                    }
                }

                lastNode = hitNode;
            }
        }

        return path.join('');
    },

    renderInstructions() {
        let desc = `
            <p><b>🚕 自動駕駛計程車：</b></p>
            <p>計程車會依序執行以下三條精確的演算法規則：</p>
            <ol style="margin-left: 1.25rem; margin-bottom: 0.8rem; line-height: 1.5;">
                <li><b>沒有岔路時：</b>持續沿著路前進。</li>
                <li><b>遇到有岔路的路口時：</b>在所有往前分支的道路方向中，選擇與<b>「指向黃色目的地的向量方向」夾角最小</b>的一條路前進。（不走回頭路）</li>
                <li><b>遇到死路（路底房屋或樹木）時：</b>原地 180 度迴轉。</li>
            </ol>
            <p style="margin-bottom: 0.8rem;">🎯 <b>任務目標：</b> 推演計程車從起點出發前往<b>黃色雙圓目的地</b>所依序經過的<b>所有「有標記字母的路口」</b>！</p>
            <p style="color: var(--warning); font-size: 0.9rem;">💡 <b>提示：</b> 請在右側控制面板的輸入框中，依序填入經過的路口（例如：<code>EF</code>。若有路口被重複經過，請重複輸入，如 <code>EAEB</code>），然後點選「啟動自動駕駛」驗證您的推演路徑！</p>
        `;
        document.getElementById('game-instructions').innerHTML = desc;
    },

    renderStage() {
        const stage = document.getElementById('game-stage');
        stage.innerHTML = `
            <div class="taxi-game-container" style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%;">
                
                <!-- Status bar -->
                <div class="taxi-status-bar" id="taxi-status" style="font-size: 1.1rem; font-weight: 700; background: rgba(255,255,255,0.05); padding: 0.6rem 1.5rem; border-radius: 30px; border: 1px solid var(--border-color); width: 85%; text-align: center;">
                    請在右側控制面板輸入預測的路口序列。
                </div>
 
                <!-- SVG Map View -->
                <div class="svg-container" style="width: 100%; max-width: 800px; background: rgba(15,23,42,0.4); border-radius: var(--radius-lg); border: 1px solid var(--border-color); overflow: hidden; padding: 12px;">
                    <svg id="taxi-svg" viewBox="0 0 650 480" style="width: 100%; height: auto;">
                        <g id="taxi-roads"></g>
                        <!-- Labeled Nodes -->
                        <g id="taxi-junctions-nodes"></g>
                        <!-- Destination Element (Drawn on top of nodes) -->
                        <g id="taxi-dest-group" style="pointer-events: none;"></g>
                        <!-- Car element -->
                        <g id="taxi-car-group"></g>
                    </svg>
                </div>
            </div>
        `;

        this.drawMap();
    },

    drawMap() {
        const roads = document.getElementById('taxi-roads');
        const destGroup = document.getElementById('taxi-dest-group');
        const nodesGroup = document.getElementById('taxi-junctions-nodes');
        const carGroup = document.getElementById('taxi-car-group');

        roads.innerHTML = '';
        destGroup.innerHTML = '';
        nodesGroup.innerHTML = '';
        carGroup.innerHTML = '';

        // Draw Roads (background tracks)
        this.edges.forEach(edge => {
            const nFrom = this.nodes[edge.from] || { x: edge.x, y: edge.y };
            const nTo = this.nodes[edge.to] || { x: edge.x, y: edge.y };

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', nFrom.x);
            line.setAttribute('y1', nFrom.y);
            line.setAttribute('x2', nTo.x);
            line.setAttribute('y2', nTo.y);
            line.setAttribute('stroke', '#334155');
            line.setAttribute('stroke-width', '18');
            line.setAttribute('stroke-linecap', 'round');
            roads.appendChild(line);

            // Faint inner lane line
            const innerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            innerLine.setAttribute('x1', nFrom.x);
            innerLine.setAttribute('y1', nFrom.y);
            innerLine.setAttribute('x2', nTo.x);
            innerLine.setAttribute('y2', nTo.y);
            innerLine.setAttribute('stroke', 'rgba(255,255,255,0.05)');
            innerLine.setAttribute('stroke-width', '2');
            innerLine.setAttribute('stroke-dasharray', '5,5');
            roads.appendChild(innerLine);
        });

        // Draw Destination (Hollow target styling to not cover node letters)
        const dCircleOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dCircleOuter.setAttribute('cx', this.destination.x);
        dCircleOuter.setAttribute('cy', this.destination.y);
        dCircleOuter.setAttribute('r', '20'); // Outer dotted circle (larger than node circle)
        dCircleOuter.setAttribute('fill', 'rgba(245, 158, 11, 0.1)');
        dCircleOuter.setAttribute('stroke', 'var(--warning)');
        dCircleOuter.setAttribute('stroke-width', '2');
        dCircleOuter.setAttribute('stroke-dasharray', '4,3');
        dCircleOuter.setAttribute('pointer-events', 'none');
        destGroup.appendChild(dCircleOuter);

        const dCircleInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dCircleInner.setAttribute('cx', this.destination.x);
        dCircleInner.setAttribute('cy', this.destination.y);
        dCircleInner.setAttribute('r', '9'); // Inner solid ring
        dCircleInner.setAttribute('fill', 'none');
        dCircleInner.setAttribute('stroke', 'var(--warning)');
        dCircleInner.setAttribute('stroke-width', '2');
        dCircleInner.setAttribute('pointer-events', 'none');
        destGroup.appendChild(dCircleInner);

        // Draw Nodes
        for (const nodeId in this.nodes) {
            const node = this.nodes[nodeId];
            if (nodeId.includes('dead')) continue; // Skip fake deadends

            const gNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gNode.style.cursor = 'pointer';

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', '15'); // Slightly larger circle for better click target
            circle.setAttribute('fill', '#1e293b');
            circle.setAttribute('stroke', node.type === 'junction' ? 'var(--primary)' : 'var(--text-muted)');
            circle.setAttribute('stroke-width', '2.5');
            gNode.appendChild(circle);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', node.x);
            text.setAttribute('y', node.y + 4.5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'var(--text-main)');
            text.setAttribute('font-size', '12px');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('pointer-events', 'none'); // Allow clicks to pass to group
            text.textContent = nodeId;
            gNode.appendChild(text);

            // Click node to append letter to guess input
            gNode.onclick = () => {
                if (this.isAnimating) return;
                Sound.play('click');
                this.userGuess += nodeId;
                const input = document.getElementById('input-taxi-guess');
                if (input) {
                    input.value = this.userGuess;
                    input.dispatchEvent(new Event('input'));
                }
            };

            // Hover highlight effect
            gNode.onmouseover = () => {
                if (this.isAnimating) return;
                circle.setAttribute('fill', 'rgba(99, 102, 241, 0.4)');
                circle.setAttribute('stroke', 'var(--success)');
            };
            gNode.onmouseout = () => {
                circle.setAttribute('fill', '#1e293b');
                circle.setAttribute('stroke', node.type === 'junction' ? 'var(--primary)' : 'var(--text-muted)');
            };

            nodesGroup.appendChild(gNode);
        }

        // Draw Dead Ends (House / Trees icon representation)
        this.edges.forEach(edge => {
            if (edge.fake) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', edge.x);
                text.setAttribute('y', edge.y + 6);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '16px');
                text.textContent = edge.to.includes('dead') ? '🏠' : '🌲';
                roads.appendChild(text);
            }
        });

        // Draw Taxi (Car) - Enlarged by 1.6x
        const car = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        car.setAttribute('id', 'taxi-car');
        car.setAttribute('x', this.taxi.x);
        car.setAttribute('y', this.taxi.y + 11);
        car.setAttribute('text-anchor', 'middle');
        car.setAttribute('font-size', '32px');
        car.textContent = '🚕';
        car.style.transition = 'all 0.05s linear';
        carGroup.appendChild(car);
    },

    renderControls() {
        const controls = document.getElementById('game-controls');
        controls.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                    <label style="font-size: 0.9rem; color: var(--text-muted); font-weight: bold;">預測經過路口順序 (大寫字母):</label>
                    <input type="text" id="input-taxi-guess" placeholder="例如: EF" style="width: 100%; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-main); font-family: var(--font-outfit); font-size: 1.1rem; text-transform: uppercase;" ${this.isAnimating ? 'disabled' : ''}>
                </div>
                <button class="modal-btn primary" id="btn-taxi-simulate" style="width: 100%;" ${this.isAnimating ? 'disabled' : ''}>
                    ${this.isAnimating ? '正在模擬中...' : '🎬 啟動自動駕駛'}
                </button>
            </div>
        `;

        const input = document.getElementById('input-taxi-guess');
        input.value = this.userGuess;
        input.addEventListener('input', (e) => {
            this.userGuess = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
            input.value = this.userGuess;
        });

        document.getElementById('btn-taxi-simulate').onclick = () => {
            if (this.isAnimating) return;
            this.runSimulation();
        };
    },

    runSimulation() {
        if (this.userGuess.trim() === '') {
            alert("請輸入您預測的路口順序！");
            return;
        }

        this.isAnimating = true;
        this.renderControls();

        // Reset Taxi Position
        if (this.level === 'easy') {
            this.taxi = { x: 200, y: 250, dirX: 1, dirY: 0, lastNode: 'D', currentPath: [] };
        } else if (this.level === 'medium') {
            this.taxi = { x: 140, y: 350, dirX: 1, dirY: 0, lastNode: 'D', currentPath: [] };
        } else {
            this.taxi = { x: 130, y: 350, dirX: 1, dirY: 0, lastNode: 'D', currentPath: [] };
        }

        const car = document.getElementById('taxi-car');
        const statusBar = document.getElementById('taxi-status');
        
        statusBar.innerHTML = '🚗 導航系統啟動，計程車前進中...';
        statusBar.style.color = 'var(--text-main)';

        let step = 4; // pixels per simulation frame
        let dest = this.destination;
        let lastNode = this.taxi.lastNode;
        
        this.simulationInterval = setInterval(() => {
            let tx = this.taxi.x;
            let ty = this.taxi.y;
            let tdx = this.taxi.dirX;
            let tdy = this.taxi.dirY;

            // Check distance to destination
            let dist = Math.hypot(tx - dest.x, ty - dest.y);
            if (dist < 10) {
                clearInterval(this.simulationInterval);
                this.isAnimating = false;
                this.renderControls();
                this.evaluateResult();
                return;
            }

            // Move
            tx += tdx * step;
            ty += tdy * step;

            // Update DOM element position and rotation
            car.setAttribute('x', tx);
            car.setAttribute('y', ty + 11);
            
            // Adjust car direction emoji rotation
            let angle = Math.atan2(tdy, tdx) * 180 / Math.PI;
            car.setAttribute('transform', `rotate(${angle}, ${tx}, ${ty})`);

            this.taxi.x = tx;
            this.taxi.y = ty;

            // Check if we hit any node (except fake ones)
            let hitNode = null;
            for (const nodeId in this.nodes) {
                const node = this.nodes[nodeId];
                if (Math.hypot(tx - node.x, ty - node.y) < 6) {
                    hitNode = nodeId;
                    break;
                }
            }

            // Check fake node deadends
            let hitFake = null;
            this.edges.forEach(edge => {
                if (edge.fake) {
                    if (Math.hypot(tx - edge.x, ty - edge.y) < 6) {
                        hitFake = edge;
                    }
                }
            });

            if (hitFake) {
                // Dead end U-turn
                tdx = -tdx;
                tdy = -tdy;
                this.taxi.dirX = tdx;
                this.taxi.dirY = tdy;
                // Offset
                this.taxi.x += tdx * 12;
                this.taxi.y += tdy * 12;
                Sound.play('fail');
                statusBar.innerHTML = '🛑 遇到死路！執行安全迴轉。';
            }

            if (hitNode && hitNode !== this.taxi.lastNode) {
                // Hit a real node
                if (this.nodes[hitNode].type === 'junction') {
                    this.taxi.currentPath.push(hitNode);
                    statusBar.innerHTML = `📍 經過路口: <strong>${this.taxi.currentPath.join(' ➔ ')}</strong>`;
                    Sound.play('click');
                }

                // U-turn at deadends
                if (this.nodes[hitNode].type === 'deadend') {
                    tdx = -tdx;
                    tdy = -tdy;
                    this.taxi.dirX = tdx;
                    this.taxi.dirY = tdy;
                    this.taxi.x += tdx * 12;
                    this.taxi.y += tdy * 12;
                    this.taxi.lastNode = hitNode;
                    Sound.play('fail');
                    statusBar.innerHTML = '🛑 遇到死路！執行安全迴轉。';
                    return;
                }

                // Branch selection at junctions
                let branches = [];
                this.edges.forEach(edge => {
                    let neighbor = null;
                    let fakeX = null, fakeY = null;
                    if (edge.from === hitNode) {
                        neighbor = edge.to;
                        if (edge.fake) { fakeX = edge.x; fakeY = edge.y; }
                    } else if (edge.to === hitNode) {
                        neighbor = edge.from;
                    }

                    if (neighbor) {
                        let nx = fakeX !== null ? fakeX : (this.nodes[neighbor] ? this.nodes[neighbor].x : 0);
                        let ny = fakeY !== null ? fakeY : (this.nodes[neighbor] ? this.nodes[neighbor].y : 0);
                        let bdx = nx - tx;
                        let bdy = ny - ty;
                        let len = Math.hypot(bdx, bdy);
                        bdx /= len;
                        bdy /= len;

                        // No direct U-turns at junctions
                        let dotPrev = bdx * tdx + bdy * tdy;
                        if (dotPrev < -0.9) return;

                        branches.push({ dx: bdx, dy: bdy, name: neighbor });
                    }
                });

                if (branches.length > 0) {
                    let vX = dest.x - tx;
                    let vY = dest.y - ty;
                    let vLen = Math.hypot(vX, vY);
                    vX /= vLen;
                    vY /= vLen;

                    let bestBranch = null;
                    let maxCos = -2;

                    branches.forEach(b => {
                        let dot = b.dx * vX + b.dy * vY;
                        if (dot > maxCos) {
                            maxCos = dot;
                            bestBranch = b;
                        }
                    });

                    if (bestBranch) {
                        this.taxi.dirX = bestBranch.dx;
                        this.taxi.dirY = bestBranch.dy;
                    }
                }

                this.taxi.lastNode = hitNode;
            }

        }, 40);
    },

    evaluateResult() {
        const finalPath = this.taxi.currentPath.join('');
        const statusBar = document.getElementById('taxi-status');

        if (finalPath === this.userGuess) {
            statusBar.innerHTML = '🎉 自動駕駛安全抵達目的地！路口序列完全正確！';
            statusBar.style.color = 'var(--success)';
            setTimeout(() => {
                App.completeLevel('taxi', this.level, this.ctExplanation);
            }, 1000);
        } else {
            statusBar.innerHTML = '❌ 預測失敗！計程車行經的路口與您的預測不符。';
            statusBar.style.color = 'var(--danger)';
            setTimeout(() => {
                App.failLevel(`
                    <p>自動駕駛順利到達了目的地，但牠行經的路口序列是：<strong style="color: var(--success); font-size: 1.2rem;">${finalPath || '(無路口)'}</strong>。</p>
                    <p>而您預測的序列是：<strong style="color: var(--danger); font-size: 1.2rem;">${this.userGuess || '(空)'}</strong>。</p>
                    <p>請重新觀察地圖與夾角規則，修改您的預測後再次啟動！</p>
                `);
            }, 1000);
        }
    },

    cleanup() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
    }
};
