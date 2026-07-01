window.GameAquaponics = {
    level: 'easy',
    cols: 5,
    rows: 4,
    grid: [], // 2D array of cells { type, rotation, plant }
    obstacles: [], // array of "x,y" strings
    selectedTool: 'straight', // 'straight', 'corner', 't-split', 'valve', 'eraser'
    selectedMotor: 'weak', // 'weak', 'medium', 'strong'
    fishCount: 1,
    budget: 150,
    placedGrowBeds: [], // for Level 4 tracking
    hintStage: 0,
    
    hints: {
        easy: [
            "提示 1: 水流必須從左下角魚缸的右側出口開始，順著管道走，最後接回魚缸的底部入口。",
            "提示 2: 點選擺放的管材可以旋轉方向。如果是置放直管，必須旋轉至與水流一致的方向（水平或垂直）。",
            "提示 3: 水路必須在中間上方經過「過濾槽 ⚙️」，再繞到右側綠色的兩個「菜床 🥬」，最後接回魚缸。"
        ],
        medium: [
            "提示 1: 本關有高（y=4）與低（y=0）兩個菜床，需要在分岔路口使用「T型管 🔀」將水流分為兩路。",
            "提示 2: 弱馬達水壓不夠送到頂層；如果選擇強馬達，雖然水能上去，但會沖毀低處的植物。",
            "提示 3: 請在流向低處菜床的管道中（y=0 的橫向水管）插入一個「減壓閥 🎚️」，用以抵消強馬達產生的過剩水壓。"
        ],
        hard: [
            "提示 1: 本關重點是生態平衡。6 隻小魚每回合一共會產生 6 單位的氮肥。",
            "提示 2: 植物的養分吸收：萵苣🥬消耗 1 單位，番茄🍅消耗 3 單位。空槽不消耗養分。",
            "提示 3: 請點擊綠色菜床，種植植物使吸收總量剛好為 6。例如：2 盆番茄 ($3 \\times 2 = 6$)，或 1 盆番茄 + 3 盆萵苣 ($3 + 1 \\times 3 = 6$)。"
        ],
        sandbox: [
            "提示 1: 本關需要自己購買元件。建議先決定要養幾隻魚與種幾盆菜，這能幫你省下大筆預算！",
            "提示 2: 例如養 2 隻魚 ($20) + 種 2 盆萵苣 ($10)。再加上過濾槽 ($15) 與菜床 ($30)，還剩下充足預算購買馬達與水管。",
            "提示 3: 管線長度越短，摩擦力越小。高度差為 1 時，弱馬達或中馬達即可推動水流，不需要購買最貴的強馬達。"
        ]
    },
    
    ctExplanation: `
        <h3>💡 運算思維：演算法與系統工程</h3>
        <p>此遊戲完美結合了運算思維的多個核心面向：</p>
        <ul>
            <li><b>系統分解 (Decomposition)：</b> 將魚菜共生生態系統拆解為三個核心層面——管路水力圖論、馬達動力消耗計算，以及氮循環化學平衡。</li>
            <li><b>圖論與連通性 (Connectivity)：</b> 水流必須形成包含特定元件（魚缸、過濾、菜床）的閉合環路。我們使用<b>深度優先搜尋 (DFS)</b> 演算法來追蹤每格水路的出入口匹配，驗證迴路完整性。</li>
            <li><b>約束最佳化 (Constraint Optimization)：</b> 水壓隨高度與長度產生阻力。馬達太大會沖毀系統，太小則水上不去。玩家必須配置正確的馬達功率或安裝<b>減壓閥</b>來限制能量，達成系統最大化穩定性。</li>
            <li><b>平衡演算法 (State Balance)：</b> 輸入（氨氮產生量 = 魚隻 $\times 1$）與輸出（養分吸收量 = 萵苣 $\times 1$ + 番茄 $\times 3$）必須精準相等，體現了動態平衡的邏輯。</li>
        </ul>
    `,

    init(level) {
        this.level = level;
        this.selectedTool = 'straight';
        this.selectedMotor = 'weak';
        this.placedGrowBeds = [];
        this.placedFilters = [];
        this.budget = 150;
        this.hintStage = 0;

        if (level === 'easy') {
            this.cols = 5;
            this.rows = 4;
            this.fishCount = 2; // 2 units
            this.obstacles = ['2,2'];
            this.setupEasyGrid();
        } else if (level === 'medium') {
            this.cols = 6;
            this.rows = 5;
            this.fishCount = 4; // 4 units
            this.obstacles = ['1,1', '4,3'];
            this.setupMediumGrid();
        } else if (level === 'hard') {
            this.cols = 6;
            this.rows = 5;
            this.fishCount = 6; // 6 units
            this.obstacles = ['1,1', '4,2'];
            this.setupHardGrid();
        } else {
            // Level 4 (Comprehensive / Sandbox mode)
            this.cols = 6;
            this.rows = 5;
            this.fishCount = 0; // Selected by user
            this.obstacles = ['2,2', '3,1'];
            this.setupSandboxGrid();
        }

        this.renderInstructions();
        this.renderStage();
        this.renderControls();
    },

    setupEasyGrid() {
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null).map(() => ({ type: 'empty', rotation: 0, plant: null })));
        
        // Fixed elements
        this.grid[0][0] = { type: 'fish-tank', rotation: 0, plant: null }; // Bottom-left
        this.grid[3][2] = { type: 'filter', rotation: 0, plant: null };    // Top-middle
        this.grid[2][4] = { type: 'grow-bed', rotation: 0, plant: 'lettuce' }; // Middle-right (needs 1 unit)
        this.grid[1][4] = { type: 'grow-bed', rotation: 0, plant: 'lettuce' }; // Middle-right (needs 1 unit)
    },

    setupMediumGrid() {
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null).map(() => ({ type: 'empty', rotation: 0, plant: null })));
        
        this.grid[0][0] = { type: 'fish-tank', rotation: 0, plant: null };
        this.grid[4][2] = { type: 'filter', rotation: 0, plant: null };
        
        // Three grow beds at different elevations to require multiple valve branches
        this.grid[4][4] = { type: 'grow-bed', rotation: 0, plant: 'tomato' };  // elevation y=4 (Tomato, needs 3 units)
        this.grid[2][4] = { type: 'grow-bed', rotation: 0, plant: 'lettuce' }; // elevation y=2 (Lettuce, needs 1 unit)
        this.grid[0][4] = { type: 'grow-bed', rotation: 0, plant: 'lettuce' }; // elevation y=0 (Lettuce, needs 1 unit)
        
        this.fishCount = 5; // 5 units total
    },

    setupHardGrid() {
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null).map(() => ({ type: 'empty', rotation: 0, plant: null })));
        
        this.grid[0][0] = { type: 'fish-tank', rotation: 0, plant: null };
        this.grid[4][1] = { type: 'filter', rotation: 0, plant: null };
        
        // Four empty grow bed slots for player to choose crops and build pipes
        this.grid[4][4] = { type: 'grow-bed', rotation: 0, plant: null };
        this.grid[3][4] = { type: 'grow-bed', rotation: 0, plant: null };
        this.grid[2][4] = { type: 'grow-bed', rotation: 0, plant: null };
        this.grid[1][4] = { type: 'grow-bed', rotation: 0, plant: null };

        this.fishCount = 6; // 6 units total
        this.selectedMotor = 'weak'; // Let them select and calculate pressure
    },

    setupSandboxGrid() {
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null).map(() => ({ type: 'empty', rotation: 0, plant: null })));
        // In sandbox, the player must place EVERYTHING (Grow Beds, Filter, Fish, Plants, Pipes, Motor) under a budget.
    },

    layPipe(y, x, type, rotation) {
        this.grid[y][x] = { type, rotation, plant: null };
    },

    renderInstructions() {
        let desc = '';
        if (this.level === 'easy') {
            desc = `
                <p><b>初級挑戰 (水管工學徒)：</b> 鋪設管線以接通水路。</p>
                <p>點選右方<b>控制面板</b>中的水管工具，然後在左方地圖空格點選以放置。再次點選放置的管材可<b>旋轉方向</b>。</p>
                <p>目標是將左下角的<b>魚缸</b>、頂層的<b>過濾槽</b>與右側的兩個<b>葉菜床 (萵苣)</b>串聯成一個封閉的水流迴路，並點擊「啟動系統驗證」。</p>
            `;
        } else if (this.level === 'medium') {
            desc = `
                <p><b>中級挑戰 (動力精算師)：</b> 選擇合適的馬達並控制流速。</p>
                <p>系統有高低兩個植栽床，需要使用 <b>T型管</b> 來分流。</p>
                <p><b>馬達規則：</b> 弱馬達揚程低 (打不上高菜床)；強馬達流速過快 (小魚會累癱)，需要在低菜床的分支管道中安裝一個<b>「減壓閥 🎚️」</b>以降低低處水壓。</p>
            `;
        } else if (this.level === 'hard') {
            desc = `
                <p><b>高級挑戰 (生態平衡大師)：</b> 點選右側的菜床，在彈出選單中種植植物。</p>
                <p>目前系統中養了 6 隻小魚（產生 <b>6 單位氮肥</b>）。</p>
                <p>請在 4 個菜床空槽中，挑選正確的植物組合，讓它們吸收的肥料剛好等於 6 單位（<b>萵苣 = 1 單位，番茄 = 3 單位</b>）。</p>
            `;
        } else {
            desc = `
                <p><b>綜合挑戰 (沙盒魔王關)：</b> 利用 <b>$150 預算</b> 從頭規劃整個生態圈！</p>
                <p>使用右方市場購買魚隻 ($10)、植物、菜床 ($15)、過濾槽 ($15) 與馬達，在方格圖上完整組裝，並達成水流順暢、生態平衡的完美系統！</p>
            `;
        }

        // Add 3 progressive hints list
        const hintsList = this.hints[this.level];
        let hintsHTML = `<div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">`;
        if (this.hintStage === 0) {
            hintsHTML += `<button class="diff-btn" id="btn-aq-hint" style="padding: 0.5rem; font-size: 0.85rem; background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #a5b4fc;">💡 獲取過關提示 (0/3)</button>`;
        } else {
            hintsHTML += `<div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; color: #fcd34d; margin-bottom: 0.5rem; line-height: 1.4;">`;
            for (let i = 0; i < this.hintStage; i++) {
                hintsHTML += `<p style="margin-bottom: 4px;">📌 ${hintsList[i]}</p>`;
            }
            hintsHTML += `</div>`;
            if (this.hintStage < 3) {
                hintsHTML += `<button class="diff-btn" id="btn-aq-hint" style="padding: 0.4rem; font-size: 0.8rem; background: rgba(255,255,255,0.05);">🔓 顯示下一個提示 (${this.hintStage}/3)</button>`;
            }
        }
        hintsHTML += `</div>`;

        document.getElementById('game-instructions').innerHTML = desc + hintsHTML;

        // Bind hint click
        const hintBtn = document.getElementById('btn-aq-hint');
        if (hintBtn) {
            hintBtn.onclick = () => {
                Sound.play('click');
                this.hintStage++;
                this.renderInstructions();
            };
        }
    },

    renderStage() {
        const stage = document.getElementById('game-stage');
        
        // Define sizes
        const cellSize = 80;
        const gridWidth = this.cols * cellSize + 24;
        const gridHeight = this.rows * cellSize + 24;

        stage.innerHTML = `
            <div class="aquaponics-container">
                <!-- Status bar -->
                <div class="river-status-bar" id="aquaponics-status" style="font-size: 1.1rem; font-weight: 700; background: rgba(255,255,255,0.05); padding: 0.6rem 1.5rem; border-radius: 30px; border: 1px solid var(--border-color); width: 85%; display: flex; justify-content: space-between; align-items: center;">
                    <span id="aq-status-text">🟢 準備就緒，請開始設計水路。</span>
                    <span id="aq-budget-text" style="font-size: 0.95rem; color: var(--warning); display: ${this.level === 'hard' || this.level === 'medium' || this.level === 'easy' ? 'none' : 'inline'};">預算: $${this.budget}</span>
                </div>

                <!-- Grid Construction Panel -->
                <div class="aquaponics-grid" id="aq-grid" style="grid-template-columns: repeat(${this.cols}, ${cellSize}px); grid-template-rows: repeat(${this.rows}, ${cellSize}px); width: ${gridWidth}px; height: ${gridHeight}px;">
                    <!-- Cells dynamically rendered -->
                </div>
            </div>
        `;

        this.renderGrid();
    },

    renderGrid() {
        const gridContainer = document.getElementById('aq-grid');
        gridContainer.innerHTML = '';

        // Render from y = rows-1 (top row visually) to y = 0 (bottom row visually)
        for (let y = this.rows - 1; y >= 0; y--) {
            for (let x = 0; x < this.cols; x++) {
                const cellData = this.grid[y][x];
                const cell = document.createElement('div');
                cell.className = 'aquaponics-cell';
                
                const isObstacle = this.obstacles.includes(`${x},${y}`);
                if (isObstacle) {
                    cell.classList.add('obstacle');
                    cell.innerHTML = '🪨';
                    gridContainer.appendChild(cell);
                    continue;
                }

                if (cellData && cellData.type !== 'empty') {
                    cell.classList.add(cellData.type);
                    
                    // Draw overlay label
                    const label = document.createElement('span');
                    label.className = 'cell-overlay-text';

                    if (cellData.type === 'fish-tank') {
                        cell.innerHTML = '🐟';
                        label.textContent = '魚缸';
                        cell.classList.add('read-only');

                        const topLabel = document.createElement('div');
                        topLabel.className = 'tank-label-top';
                        topLabel.textContent = '出水 ⬆️';
                        cell.appendChild(topLabel);

                        const rightLabel = document.createElement('div');
                        rightLabel.className = 'tank-label-right';
                        rightLabel.textContent = '⬅️ 進水';
                        cell.appendChild(rightLabel);
                    } else if (cellData.type === 'filter') {
                        cell.innerHTML = '⚙️';
                        label.textContent = '過濾';
                        if (this.level !== 'sandbox') cell.classList.add('read-only');
                    } else if (cellData.type === 'grow-bed') {
                        const plantChar = cellData.plant === 'lettuce' ? '🥬' : cellData.plant === 'tomato' ? '🍅' : '🕳️';
                        cell.innerHTML = plantChar;
                        label.textContent = cellData.plant === 'lettuce' ? '萵苣' : cellData.plant === 'tomato' ? '番茄' : '空槽';
                        
                        // Level 3 & Sandbox crop selection click
                        if (this.level === 'hard' || this.level === 'sandbox') {
                            cell.onclick = (e) => this.showCropPicker(x, y, cell, e);
                        } else {
                            cell.classList.add('read-only');
                        }
                    } else {
                        // Drawing pipes using SVGs
                        this.drawPipeInCell(cell, cellData.type, cellData.rotation);
                        
                        // Let player delete/rotate pipe
                        cell.onclick = () => this.handleCellClick(x, y);
                    }
                    cell.appendChild(label);
                } else {
                    // Empty cell click to place pipe
                    cell.onclick = () => this.handleCellClick(x, y);
                }

                gridContainer.appendChild(cell);
            }
        }
    },

    drawPipeInCell(cell, type, rotation) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'pipe-svg');
        svg.setAttribute('viewBox', '0 0 50 50');

        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path'); // flow overlay
        path2.setAttribute('class', 'water-glow');

        let d = '';
        const isVertical = (rotation === 90 || rotation === 270);

        if (type === 'straight-h' || type === 'straight') {
            d = isVertical ? 'M 25 0 L 25 50' : 'M 0 25 L 50 25';
        } else if (type === 'straight-v') {
            d = 'M 25 0 L 25 50';
        } else if (type === 'corner') {
            // L-shape Corner depending on rotation
            if (rotation === 0) d = 'M 25 0 Q 25 25 50 25';
            else if (rotation === 90) d = 'M 50 25 Q 25 25 25 50';
            else if (rotation === 180) d = 'M 25 50 Q 25 25 0 25';
            else if (rotation === 270) d = 'M 0 25 Q 25 25 25 0';
        } else if (type === 't-split') {
            // T-junction depending on rotation
            if (rotation === 0) d = 'M 0 25 L 50 25 M 25 25 L 25 50';
            else if (rotation === 90) d = 'M 25 0 L 25 50 M 25 25 L 0 25';
            else if (rotation === 180) d = 'M 0 25 L 50 25 M 25 25 L 25 0';
            else if (rotation === 270) d = 'M 25 0 L 25 50 M 25 25 L 50 25';
        } else if (type === 'valve') {
            // Valve draws a straight pipe and a small box
            d = isVertical ? 'M 25 0 L 25 50' : 'M 0 25 L 50 25';
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', '15');
            rect.setAttribute('y', '15');
            rect.setAttribute('width', '20');
            rect.setAttribute('height', '20');
            rect.setAttribute('rx', '3');
            rect.setAttribute('fill', 'var(--warning)');
            svg.appendChild(rect);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', '25');
            label.setAttribute('y', '28');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', '#000');
            label.setAttribute('font-size', '10px');
            label.setAttribute('font-weight', 'bold');
            label.textContent = 'V';
            svg.appendChild(label);
        }

        path1.setAttribute('d', d);
        path2.setAttribute('d', d);

        svg.appendChild(path1);
        svg.appendChild(path2);

        cell.appendChild(svg);
    },

    handleCellClick(x, y) {
        if (this.isReadOnly(x, y)) return;

        Sound.play('click');
        const cellData = this.grid[y][x];

        if (this.selectedTool === 'eraser') {
            // Remove element, refund budget in Level 4
            if (this.level === 'sandbox') {
                this.refundItem(cellData);
            }
            this.grid[y][x] = { type: 'empty', rotation: 0, plant: null };
        } else if (cellData && cellData.type === this.selectedTool) {
            // Cycle rotations: 0 -> 90 -> 180 -> 270 -> 0
            cellData.rotation = (cellData.rotation + 90) % 360;
        } else {
            // Place new tool
            // Check budget in Level 4
            if (this.level === 'sandbox') {
                const cost = this.getItemCost(this.selectedTool);
                if (this.budget < cost) {
                    alert("預算不足！無法購買此元件。");
                    return;
                }
                this.budget -= cost;
                document.getElementById('aq-budget-text').textContent = `預算: $${this.budget}`;
            }

            this.grid[y][x] = { type: this.selectedTool, rotation: 0, plant: null };
        }

        this.renderGrid();
    },

    isReadOnly(x, y) {
        const cellData = this.grid[y][x];
        if (!cellData) return false;
        
        // Sandbox allows moving grow beds and filters
        if (this.level === 'sandbox') {
            return cellData.type === 'fish-tank'; // Only fish tank is locked
        }

        // Other levels have pre-defined beds, filters, tanks locked
        return cellData.type === 'fish-tank' || cellData.type === 'filter' || cellData.type === 'grow-bed';
    },

    getItemCost(type) {
        switch (type) {
            case 'straight': return 5;
            case 'corner': return 5;
            case 't-split': return 8;
            case 'valve': return 12;
            case 'grow-bed': return 15;
            case 'filter': return 15;
        }
        return 0;
    },

    refundItem(cellData) {
        if (!cellData) return;
        const cost = this.getItemCost(cellData.type);
        this.budget += cost;
        
        // Also refund crops or fish if grow-bed is deleted
        if (cellData.type === 'grow-bed' && cellData.plant) {
            this.budget += cellData.plant === 'lettuce' ? 5 : 12;
        }
        
        document.getElementById('aq-budget-text').textContent = `預算: $${this.budget}`;
    },

    showCropPicker(x, y, cell, e) {
        e.stopPropagation(); // Stop click propagating to cell lay/rotate pipe
        Sound.play('click');

        // Create overlay picker
        const picker = document.createElement('div');
        picker.className = 'plant-slot-picker';
        
        // Position picker near the click
        picker.style.left = `${e.clientX - 60}px`;
        picker.style.top = `${e.clientY - 80}px`;
        picker.style.position = 'fixed';

        picker.innerHTML = `
            <button class="plant-pick-btn" id="pick-lettuce">🥬 萵苣 (消耗 1 單位)</button>
            <button class="plant-pick-btn" id="pick-tomato">🍅 番茄 (消耗 3 單位)</button>
            <button class="plant-pick-btn" id="pick-empty" style="color:var(--danger)">🗑️ 清除作物</button>
        `;

        document.body.appendChild(picker);

        // Bind picker buttons
        document.getElementById('pick-lettuce').onclick = () => {
            this.setPlant(x, y, 'lettuce');
            picker.remove();
        };
        document.getElementById('pick-tomato').onclick = () => {
            this.setPlant(x, y, 'tomato');
            picker.remove();
        };
        document.getElementById('pick-empty').onclick = () => {
            this.setPlant(x, y, null);
            picker.remove();
        };

        // Click outside to close
        const closePicker = () => {
            picker.remove();
            document.removeEventListener('click', closePicker);
        };
        setTimeout(() => document.addEventListener('click', closePicker), 10);
    },

    setPlant(x, y, plant) {
        Sound.play('click');
        const cellData = this.grid[y][x];
        
        // Handle budget in Level 4
        if (this.level === 'sandbox') {
            const currentCost = cellData.plant ? (cellData.plant === 'lettuce' ? 5 : 12) : 0;
            const newCost = plant ? (plant === 'lettuce' ? 5 : 12) : 0;
            
            const costDiff = newCost - currentCost;
            if (this.budget < costDiff) {
                alert("預算不足！無法購買此作物。");
                return;
            }
            this.budget -= costDiff;
            document.getElementById('aq-budget-text').textContent = `預算: $${this.budget}`;
        }

        cellData.plant = plant;
        this.renderGrid();
    },

    renderControls() {
        const controls = document.getElementById('game-controls');
        
        // Tool buttons palette
        let toolSelectorHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
                <div style="font-size: 0.9rem; font-weight: bold; color: var(--text-muted);">🛠️ 工具選單:</div>
                <div class="tool-palette">
                    <button class="tool-btn ${this.selectedTool === 'straight' ? 'active' : ''}" data-tool="straight">
                        <span class="tool-btn-icon">➖</span>
                        <span>直管 ($5)</span>
                    </button>
                    <button class="tool-btn ${this.selectedTool === 'corner' ? 'active' : ''}" data-tool="corner">
                        <span class="tool-btn-icon">↪️</span>
                        <span>L型管 ($5)</span>
                    </button>
                    <button class="tool-btn ${this.selectedTool === 't-split' ? 'active' : ''}" data-tool="t-split">
                        <span class="tool-btn-icon">🔀</span>
                        <span>T型管 ($8)</span>
                    </button>
                    <button class="tool-btn ${this.selectedTool === 'valve' ? 'active' : ''}" data-tool="valve">
                        <span class="tool-btn-icon">🎚️</span>
                        <span>減壓閥 ($12)</span>
                    </button>
                    <!-- Grow bed and filter tools only in sandbox -->
                    ${this.level === 'sandbox' ? `
                        <button class="tool-btn ${this.selectedTool === 'grow-bed' ? 'active' : ''}" data-tool="grow-bed">
                            <span class="tool-btn-icon">🥬</span>
                            <span>菜床 ($15)</span>
                        </button>
                        <button class="tool-btn ${this.selectedTool === 'filter' ? 'active' : ''}" data-tool="filter">
                            <span class="tool-btn-icon">⚙️</span>
                            <span>過濾槽 ($15)</span>
                        </button>
                    ` : ''}
                    <button class="tool-btn ${this.selectedTool === 'eraser' ? 'active' : ''}" data-tool="eraser">
                        <span class="tool-btn-icon">🗑️</span>
                        <span>移除工具</span>
                    </button>
                </div>
            </div>
        `;

        // Motor selection
        let motorSelectorHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%; margin-top: 0.75rem;">
                <div style="font-size: 0.9rem; font-weight: bold; color: var(--text-muted);">🔌 馬達功率選擇:</div>
                <div style="display: flex; gap: 0.5rem; width: 100%;">
                    <button class="modal-btn secondary ${this.selectedMotor === 'weak' ? 'primary' : ''}" id="motor-weak" style="flex:1; padding: 0.5rem 0; font-size:0.85rem;">弱馬達 ${this.level === 'sandbox' ? '($15)' : ''}</button>
                    <button class="modal-btn secondary ${this.selectedMotor === 'medium' ? 'primary' : ''}" id="motor-medium" style="flex:1; padding: 0.5rem 0; font-size:0.85rem;">中馬達 ${this.level === 'sandbox' ? '($30)' : ''}</button>
                    <button class="modal-btn secondary ${this.selectedMotor === 'strong' ? 'primary' : ''}" id="motor-strong" style="flex:1; padding: 0.5rem 0; font-size:0.85rem;">強馬達 ${this.level === 'sandbox' ? '($50)' : ''}</button>
                </div>
            </div>
        `;

        // Sandbox market for fish and crops
        let sandboxMarketHTML = '';
        if (this.level === 'sandbox') {
            sandboxMarketHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%; margin-top: 0.75rem;">
                    <div style="font-size: 0.9rem; font-weight: bold; color: var(--text-muted);">🐟 生態購買市場:</div>
                    <div class="market-grid">
                        <div class="market-item">
                            <span>魚隻 ($10)</span>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <button id="fish-minus">-</button>
                                <strong>${this.fishCount}</strong>
                                <button id="fish-plus">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        controls.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
                ${toolSelectorHTML}
                ${motorSelectorHTML}
                ${sandboxMarketHTML}
                
                <div style="display: flex; gap: 0.5rem; width: 100%; margin-top: 1rem;">
                    <button class="modal-btn secondary" id="btn-aq-reset" style="flex: 1;">排空系統</button>
                    <button class="modal-btn primary" id="btn-aq-submit" style="flex: 2;">啟動系統驗證</button>
                </div>
            </div>
        `;

        // Bind Tool Clicks
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.onclick = () => {
                Sound.play('click');
                this.selectedTool = btn.dataset.tool;
                this.renderControls();
            };
        });

        // Bind Motor Clicks
        const bindMotor = (id, type, cost) => {
            document.getElementById(id).onclick = () => {
                Sound.play('click');
                if (this.level === 'sandbox') {
                    // Check budget diff
                    const currentCost = this.selectedMotor === 'weak' ? 15 : (this.selectedMotor === 'medium' ? 30 : 50);
                    const diff = cost - currentCost;
                    if (this.budget < diff) {
                        alert("預算不足！無法購買此馬達。");
                        return;
                    }
                    this.budget -= diff;
                    document.getElementById('aq-budget-text').textContent = `預算: $${this.budget}`;
                }
                this.selectedMotor = type;
                this.renderControls();
            };
        };
        bindMotor('motor-weak', 'weak', 15);
        bindMotor('motor-medium', 'medium', 30);
        bindMotor('motor-strong', 'strong', 50);

        // Bind Sandbox Buttons
        if (this.level === 'sandbox') {
            document.getElementById('fish-plus').onclick = () => {
                if (this.budget < 10) {
                    alert("預算不足！");
                    return;
                }
                Sound.play('click');
                this.fishCount++;
                this.budget -= 10;
                document.getElementById('aq-budget-text').textContent = `預算: $${this.budget}`;
                this.renderControls();
            };
            document.getElementById('fish-minus').onclick = () => {
                if (this.fishCount <= 0) return;
                Sound.play('click');
                this.fishCount--;
                this.budget += 10;
                document.getElementById('aq-budget-text').textContent = `預算: $${this.budget}`;
                this.renderControls();
            };
        }

        // Reset
        document.getElementById('btn-aq-reset').onclick = () => {
            if (confirm("確定要排空所有管線與重新設計嗎？")) {
                this.init(this.level);
            }
        };

        // Submit
        document.getElementById('btn-aq-submit').onclick = () => this.verifySystem();
    },

    verifySystem() {
        Sound.play('click');
        
        // Clear previous flow animations & error highlights
        const cells = document.querySelectorAll('.aquaponics-cell');
        cells.forEach(c => {
            c.classList.remove('active-flow');
            c.classList.remove('flow-reversed');
            c.classList.remove('flow-error');
        });

        // Reset tank labels to default (north outlet, east inlet)
        const topL = document.querySelector('.tank-label-top');
        const rightL = document.querySelector('.tank-label-right');
        if (topL) topL.textContent = '出水 ⬆️';
        if (rightL) rightL.textContent = '⬅️ 進水';
        
        // Step 1: Trace flow connectivity
        const traceResult = this.traceWaterFlow();
        const statusText = document.getElementById('aq-status-text');

        if (!traceResult.valid) {
            statusText.textContent = `❌ 水路不通: ${traceResult.error}`;
            statusText.style.color = 'var(--danger)';
            
            // Highlight the cell where the flow got stuck in red!
            if (traceResult.stuckCell) {
                const [scx, scy] = traceResult.stuckCell;
                const htmlIdx = (this.rows - 1 - scy) * this.cols + scx;
                if (cells[htmlIdx]) {
                    cells[htmlIdx].classList.add('flow-error');
                }
            }
            return;
        }

        // Update tank labels based on successful flow direction
        if (traceResult.direction === 'east') {
            if (topL) topL.textContent = '進水 ⬇️';
            if (rightL) rightL.textContent = '➡️ 出水';
        } else {
            if (topL) topL.textContent = '出水 ⬆️';
            if (rightL) rightL.textContent = '⬅️ 進水';
        }

        // Show active flow animation in cells
        traceResult.activeCells.forEach(([cx, cy]) => {
            const htmlIdx = (this.rows - 1 - cy) * this.cols + cx;
            if (cells[htmlIdx]) {
                cells[htmlIdx].classList.add('active-flow');
                const cellKey = `${cx},${cy}`;
                if (traceResult.reversedCells && traceResult.reversedCells.includes(cellKey)) {
                    cells[htmlIdx].classList.add('flow-reversed');
                } else {
                    cells[htmlIdx].classList.remove('flow-reversed');
                }
            }
        });

        // Step 2: Validate Pump Pressure for each Grow Bed branch
        let growBedsCount = 0;
        let filterCount = 0;

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                if (cell && cell.type === 'grow-bed') growBedsCount++;
                if (cell && cell.type === 'filter') filterCount++;
            }
        }

        let motorPressure = 0;
        if (this.selectedMotor === 'weak') motorPressure = 10;
        else if (this.selectedMotor === 'medium') motorPressure = 22;
        else if (this.selectedMotor === 'strong') motorPressure = 40;

        // Check local pressure for each grow bed branch
        for (const key in traceResult.bedPaths) {
            const bedPath = traceResult.bedPaths[key];
            const [bx, by] = key.split(',').map(Number);
            const valvesOnPath = bedPath.filter(([x, y]) => this.grid[y][x].type === 'valve').length;
            const pathLength = bedPath.length;
            const required = by * 3 + pathLength * 0.5;
            const effective = motorPressure - valvesOnPath * 12;

            if (effective < required) {
                statusText.textContent = `❌ 動力不足！水流無法送達高度為 ${by} 的菜床。`;
                statusText.style.color = 'var(--danger)';
                const htmlIdx = (this.rows - 1 - by) * this.cols + bx;
                if (cells[htmlIdx]) cells[htmlIdx].classList.add('flow-error');
                return;
            }

            if (effective > required + 8) {
                statusText.textContent = `❌ 水壓過強！高度為 ${by} 的菜床流速過大，會沖毀植物根系！`;
                statusText.style.color = 'var(--danger)';
                const htmlIdx = (this.rows - 1 - by) * this.cols + bx;
                if (cells[htmlIdx]) cells[htmlIdx].classList.add('flow-error');
                return;
            }
        }

        // Step 3: Validate Nutrient Balance
        const nutrientInput = this.fishCount;
        let nutrientOutput = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                if (cell && cell.type === 'grow-bed' && cell.plant) {
                    nutrientOutput += cell.plant === 'lettuce' ? 1 : 3;
                }
            }
        }

        if (nutrientOutput > nutrientInput) {
            statusText.textContent = `❌ 養分不足！植物因為氮肥不夠而枯萎。`;
            statusText.style.color = 'var(--danger)';
            
            // Highlight all grow beds
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    if (this.grid[y][x].type === 'grow-bed') {
                        const htmlIdx = (this.rows - 1 - y) * this.cols + x;
                        if (cells[htmlIdx]) cells[htmlIdx].classList.add('flow-error');
                    }
                }
            }
            return;
        } else if (nutrientOutput < nutrientInput) {
            statusText.textContent = `❌ 毒素過盛！水質惡化，魚中毒生病。`;
            statusText.style.color = 'var(--danger)';
            
            // Highlight fish tank
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    if (this.grid[y][x].type === 'fish-tank') {
                        const htmlIdx = (this.rows - 1 - y) * this.cols + x;
                        if (cells[htmlIdx]) cells[htmlIdx].classList.add('flow-error');
                    }
                }
            }
            return;
        }

        if (this.level === 'sandbox') {
            if (growBedsCount === 0 || filterCount === 0) {
                statusText.textContent = `❌ 系統元件不全！需要包含魚缸、過濾槽與菜床。`;
                statusText.style.color = 'var(--danger)';
                return;
            }
        }

        // SUCCESS!
        statusText.textContent = `🟢 系統平衡達成！水流順暢、生態平衡。`;
        statusText.style.color = 'var(--success)';
        
        setTimeout(() => {
            App.completeLevel('aquaponics', this.level, this.ctExplanation);
        }, 1200);
    },

    traceWaterFlow() {
        let startX = 0;
        let startY = 0;
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] && this.grid[y][x].type === 'fish-tank') {
                    startX = x;
                    startY = y;
                    break;
                }
            }
        }

        const getPorts = (x, y) => {
            const cell = this.grid[y][x];
            if (!cell) return [];
            
            if (cell.type === 'fish-tank') {
                return ['north', 'east'];
            }
            if (cell.type === 'filter') {
                return ['north', 'south', 'east', 'west'];
            }
            if (cell.type === 'grow-bed') {
                return ['north', 'south', 'east', 'west'];
            }
            
            if (cell.type === 'straight' || cell.type === 'straight-h') {
                return (cell.rotation === 90 || cell.rotation === 270) ? ['north', 'south'] : ['east', 'west'];
            }
            if (cell.type === 'straight-v') {
                return ['north', 'south'];
            }
            if (cell.type === 'valve') {
                return (cell.rotation === 90 || cell.rotation === 270) ? ['north', 'south'] : ['east', 'west'];
            }
            if (cell.type === 'corner') {
                if (cell.rotation === 0) return ['north', 'east'];
                if (cell.rotation === 90) return ['east', 'south'];
                if (cell.rotation === 180) return ['south', 'west'];
                if (cell.rotation === 270) return ['west', 'north'];
            }
            if (cell.type === 't-split') {
                if (cell.rotation === 0) return ['east', 'west', 'south'];
                if (cell.rotation === 90) return ['north', 'south', 'west'];
                if (cell.rotation === 180) return ['east', 'west', 'north'];
                if (cell.rotation === 270) return ['north', 'south', 'east'];
            }
            return [];
        };

        const oppDir = { 'north': 'south', 'south': 'north', 'east': 'west', 'west': 'east' };
        const dirOffset = {
            'north': [0, 1],
            'south': [0, -1],
            'east': [1, 0],
            'west': [-1, 0]
        };

        const isFlowReversed = (type, rotation, fromDir) => {
            if (!fromDir) return false;
            
            if (type === 'straight' || type === 'straight-h' || type === 'valve') {
                const isVertical = (rotation === 90 || rotation === 270);
                if (isVertical) {
                    return fromDir === 'north'; // Natural flow goes South (fromDir === 'south')
                } else {
                    return fromDir === 'west';  // Natural flow goes East (fromDir === 'east')
                }
            }
            if (type === 'straight-v') {
                return fromDir === 'north';
            }
            if (type === 'corner') {
                if (rotation === 0) return fromDir === 'west';   // Natural is North -> East (fromDir === 'south')
                if (rotation === 90) return fromDir === 'north';  // Natural is East -> South (fromDir === 'west')
                if (rotation === 180) return fromDir === 'east';  // Natural is South -> West (fromDir === 'north')
                if (rotation === 270) return fromDir === 'south'; // Natural is West -> North (fromDir === 'east')
            }
            if (type === 't-split') {
                if (rotation === 0) return fromDir === 'west' || fromDir === 'north';
                if (rotation === 90) return fromDir === 'north' || fromDir === 'east';
                if (rotation === 180) return fromDir === 'west' || fromDir === 'south';
                if (rotation === 270) return fromDir === 'north' || fromDir === 'west';
            }
            return false;
        };

        const tryTrace = (initialOutlet, targetInlet) => {
            let visited = new Set();
            let path = [];
            let filterVisited = false;
            let bedsVisited = [];
            let stuckCell = [startX, startY];
            let bedPaths = {};
            let activeFlowCells = new Set();
            let activeReversedCells = new Set();

            const trace = (cx, cy, fromDir) => {
                const cellKey = `${cx},${cy}`;
                if (visited.has(cellKey)) {
                    if (cx === startX && cy === startY && fromDir === targetInlet) {
                        return true;
                    }
                    return false;
                }

                visited.add(cellKey);
                path.push([cx, cy]);

                const cell = this.grid[cy][cx];
                if (cell.type === 'filter') filterVisited = true;
                if (cell.type === 'grow-bed') {
                    if (!bedsVisited.includes(cellKey)) bedsVisited.push(cellKey);
                    bedPaths[cellKey] = [...path];
                }

                const ports = getPorts(cx, cy);
                if (fromDir && !ports.includes(oppDir[fromDir])) {
                    stuckCell = [cx, cy];
                    path.pop();
                    visited.delete(cellKey);
                    return false;
                }

                const exits = fromDir ? ports.filter(p => p !== oppDir[fromDir]) : [initialOutlet];

                let success = false;
                let hasNeighbors = false;

                for (let i = 0; i < exits.length; i++) {
                    const exitDir = exits[i];
                    const offset = dirOffset[exitDir];
                    const nx = cx + offset[0];
                    const ny = cy + offset[1];

                    if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                        const neighbor = this.grid[ny][nx];
                        if (neighbor && neighbor.type !== 'empty') {
                            const nPorts = getPorts(nx, ny);
                            if (nPorts.includes(oppDir[exitDir])) {
                                hasNeighbors = true;
                                const res = trace(nx, ny, exitDir);
                                if (res) {
                                    success = true;
                                    activeFlowCells.add(cellKey);
                                    activeFlowCells.add(`${nx},${ny}`);
                                }
                            }
                        }
                    }
                }

                if (!hasNeighbors && !success) {
                    stuckCell = [cx, cy];
                }

                if (success) {
                    activeFlowCells.add(cellKey);
                    if (isFlowReversed(cell.type, cell.rotation, fromDir)) {
                        activeReversedCells.add(cellKey);
                    }
                }

                path.pop();
                visited.delete(cellKey);

                return success;
            };

            const loopClosed = trace(startX, startY, null);
            return {
                loopClosed,
                path,
                filterVisited,
                bedsVisited,
                stuckCell,
                bedPaths,
                activeFlowCells,
                reversedCells: Array.from(activeReversedCells)
            };
        };

        const resNorth = tryTrace('north', 'west');
        const resEast = tryTrace('east', 'south');

        let expectedBeds = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] && this.grid[y][x].type === 'grow-bed') {
                    expectedBeds++;
                }
            }
        }

        const isValid = (res) => {
            return res.loopClosed && res.filterVisited && res.bedsVisited.length >= expectedBeds;
        };

        let bestRes = resNorth;
        if (isValid(resEast)) {
            bestRes = resEast;
        } else if (isValid(resNorth)) {
            bestRes = resNorth;
        } else {
            bestRes = (resEast.activeFlowCells.size >= resNorth.activeFlowCells.size) ? resEast : resNorth;
        }

        const activeCells = Array.from(bestRes.activeFlowCells).map(k => k.split(',').map(Number));

        if (!bestRes.loopClosed) {
            return { valid: false, error: '管線沒有完整接回魚缸的進水口（右側或上方），或者接口方向沒有對齊。', activeCells: [], stuckCell: bestRes.stuckCell };
        }
        if (!bestRes.filterVisited) {
            return { valid: false, error: '水流沒有經過「過濾槽 ⚙️」。過濾是將魚排泄物分解為肥料的關鍵步驟！', activeCells: [], stuckCell: bestRes.stuckCell };
        }
        if (bestRes.bedsVisited.length < expectedBeds) {
            return { valid: false, error: '水流沒有完全覆蓋所有的「植栽床 🥬」。植物會枯萎！', activeCells: [], stuckCell: bestRes.stuckCell };
        }

        return { valid: true, activeCells: activeCells, bedPaths: bestRes.bedPaths, reversedCells: bestRes.reversedCells, direction: bestRes === resEast ? 'east' : 'north' };
    },

    cleanup() {
        if (this.simulationInterval) clearInterval(this.simulationInterval);
    }
};
