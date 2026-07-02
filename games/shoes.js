window.GameShoes = {
    gridSize: 3, // 3, 5, or 7
    targetX: 0,
    targetY: 0,
    clicksCount: 0,
    maxClicks: 3,
    eliminated: [], // 2D array of booleans
    clicked: {}, // key: "x,y", value: { lengthFeedback, widthFeedback }
    level: 'easy',

    ctExplanation: `
        <h3>💡 運算思維：二元搜尋法 (Binary Search)</h3>
        <p>此遊戲展示了<b>二元搜尋法 (Binary Search)</b>在二維空間中的應用（有時稱為二維分治法）。</p>
        <p><b>搜尋策略分析：</b></p>
        <ul>
            <li>在一個已排序的陣列或網格中，最有效率的查找方式不是挨個尋找（線性搜尋，最壞需要 $N \times M$ 次），而是每次都從<b>可能範圍的正中間</b>進行測試。</li>
            <li>在<b>高級挑戰 (7x7)</b> 中，最佳的第一步是試穿正中間的格子 <b>E (y=3, x=3)</b>。</li>
            <li>如果鞋子太長且太窄，我們就能一次排除掉一整片區域：所有比 E 長的列（y=3~6）和比 E 窄的行（x=0~3），剩餘空間縮小為一個 3x3 的子網格。</li>
            <li>第二步，我們再選這個 3x3 子網格的正中心進行試穿。依此類推，在<b>3 次以內</b>必定能找出那雙唯一合腳的鞋子！這就是對數時間複雜度 $O(\log N)$ 的強大威力。</li>
        </ul>
    `,

    init(level) {
        this.level = level;
        this.clicksCount = 0;
        this.clicked = {};

        if (level === 'easy') {
            this.gridSize = 3;
            this.maxClicks = 2;
        } else if (level === 'medium') {
            this.gridSize = 5;
            this.maxClicks = 3;
        } else { // hard
            this.gridSize = 7;
            this.maxClicks = 3;
        }

        // Initialize elimination grid
        this.eliminated = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));

        // Randomly set target shoe
        this.targetX = Math.floor(Math.random() * this.gridSize);
        this.targetY = Math.floor(Math.random() * this.gridSize);

        this.renderInstructions();
        this.renderStage();
        this.renderControls();
    },

    renderInstructions() {
        let desc = '';
        if (this.level === 'easy') {
            desc = `
                <p><b>初級挑戰：</b> 3x3 展示櫃。你有 <b>2 次試穿機會</b>。</p>
                <p>點選展示櫃中的任何一雙鞋子來試穿。利用回饋排除不合適的鞋子！</p>
            `;
        } else if (this.level === 'medium') {
            desc = `
                <p><b>中級挑戰：</b> 5x5 展示櫃。你有 <b>3 次試穿機會</b>。</p>
                <p>展示櫃變大囉，請務必點選每次可能範圍的「正中心」以發揮二元搜尋法的最大效果！</p>
            `;
        } else {
            desc = `
                <p><b>高級挑戰 (Bebras 原題)：</b> 7x7 展示櫃。你有 <b>3 次試穿機會</b>。</p>
                <p>點選正中間的鞋子開始。只要策略正確，即使是 49 雙鞋，在 3 次試穿內也一定能百分之百找到合適的鞋子！</p>
            `;
        }
        document.getElementById('game-instructions').innerHTML = desc;
    },

    renderStage() {
        const stage = document.getElementById('game-stage');
        
        // Define axis labels:
        // Width: Left (窄) to Right (寬)
        // Length: Bottom (短) to Top (長)
        stage.innerHTML = `
            <div class="shoes-game-container" style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%;">
                
                <!-- Status Bar -->
                <div class="shoes-status-bar" id="shoes-status" style="font-size: 1.1rem; font-weight: 700; background: rgba(255,255,255,0.05); padding: 0.6rem 1.5rem; border-radius: 30px; border: 1px solid var(--border-color); width: 85%; text-align: center;">
                    請試穿第一雙鞋。目標：長度適中，寬度適中。
                </div>

                <!-- Grid wrapper with Axes -->
                <div class="grid-layout-wrapper" style="display: grid; grid-template-columns: auto 1fr; grid-template-rows: 1fr auto; gap: 10px; margin: 10px 0;">
                    
                    <!-- Y Axis (Length: Short at bottom, Long at top) -->
                    <div class="y-axis" style="display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 10px 0; color: var(--text-muted); font-size: 0.9rem; font-weight: bold;">
                        <span>長 (Long) ⬆️</span>
                        <span>⬇️ 短 (Short)</span>
                    </div>

                    <!-- Main Grid Area -->
                    <div class="shoes-grid-outer" style="background: rgba(0,0,0,0.2); border-radius: var(--radius-lg); padding: 12px; border: 1px solid var(--border-color);">
                        <div id="shoes-grid" style="display: grid; grid-template-columns: repeat(${this.gridSize}, 1fr); gap: 8px;">
                            <!-- Cells dynamically rendered -->
                        </div>
                    </div>

                    <!-- Placeholder for bottom-left corner -->
                    <div></div>

                    <!-- X Axis (Width: Narrow at left, Wide at right) -->
                    <div class="x-axis" style="display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.9rem; font-weight: bold;">
                        <span>⬅️ 窄 (Narrow)</span>
                        <span>寬 (Wide) ➡️</span>
                    </div>
                </div>
            </div>
        `;

        this.renderGridCells();
    },

    renderGridCells() {
        const grid = document.getElementById('shoes-grid');
        grid.innerHTML = '';

        // Grid cells: We render from top row (y = gridSize-1) to bottom row (y = 0)
        // so that y=0 is at the bottom visually.
        for (let y = this.gridSize - 1; y >= 0; y--) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'shoe-cell';
                
                // Style cell
                const cellSize = this.gridSize === 3 ? '120px' : this.gridSize === 5 ? '90px' : '70px';
                cell.style.width = cellSize;
                cell.style.height = cellSize;
                cell.style.borderRadius = '8px';
                cell.style.position = 'relative';
                cell.style.cursor = 'pointer';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.transition = 'all 0.25s ease';

                // Check cell state
                const clickKey = `${x},${y}`;
                const isClicked = this.clicked[clickKey];
                const isEliminated = this.eliminated[y][x];

                // Tips (dimming/crosses) are ONLY shown in Easy level
                const showHint = (this.level === 'easy') && isEliminated;

                // Default background
                if (isClicked) {
                    // Current clicked shoe
                    cell.style.background = 'rgba(99, 102, 241, 0.25)';
                    cell.style.border = '2px solid var(--primary)';
                } else if (showHint) {
                    // Darkened/Eliminated shoe (Only in Easy)
                    cell.style.background = 'rgba(0, 0, 0, 0.5)';
                    cell.style.border = '1px solid rgba(255, 255, 255, 0.03)';
                    cell.style.opacity = '0.3';
                    cell.style.cursor = 'not-allowed';
                } else {
                    // Active shoe
                    cell.style.background = 'rgba(255, 255, 255, 0.05)';
                    cell.style.border = '1px solid var(--border-color)';
                }

                // Add hover effect for active shoes
                if (!showHint && !isClicked) {
                    cell.onmouseover = () => {
                        cell.style.background = 'rgba(255,255,255,0.1)';
                        cell.style.transform = 'scale(1.05)';
                    };
                    cell.onmouseout = () => {
                        cell.style.background = 'rgba(255,255,255,0.05)';
                        cell.style.transform = 'scale(1)';
                    };
                    cell.onclick = () => this.clickShoe(x, y);
                }

                // Draw a simple shoe representation inside the cell using CSS/Emoji
                const shoeEmoji = document.createElement('span');
                shoeEmoji.textContent = '👟';
                shoeEmoji.style.fontSize = this.gridSize === 3 ? '3.5rem' : this.gridSize === 5 ? '2.5rem' : '1.8rem';
                shoeEmoji.style.filter = showHint ? 'grayscale(100%)' : 'none';
                cell.appendChild(shoeEmoji);

                // If clicked, draw a small indicator showing feedback
                if (isClicked) {
                    const tooltip = document.createElement('div');
                    tooltip.style.position = 'absolute';
                    tooltip.style.bottom = '-4px';
                    tooltip.style.background = '#0f172a';
                    tooltip.style.border = '1px solid var(--primary)';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.padding = '2px 4px';
                    tooltip.style.fontSize = '0.65rem';
                    tooltip.style.whiteSpace = 'nowrap';
                    tooltip.style.zIndex = '10';
                    
                    const lenF = isClicked.len === 'fit' ? '適中' : isClicked.len === 'long' ? '太長' : '太短';
                    const widF = isClicked.wid === 'fit' ? '適中' : isClicked.wid === 'wide' ? '太寬' : '太窄';
                    tooltip.textContent = `長:${lenF}|寬:${widF}`;
                    cell.appendChild(tooltip);
                }

                // If eliminated, show a faint cross (Only in Easy)
                if (showHint) {
                    const cross = document.createElement('div');
                    cross.style.position = 'absolute';
                    cross.style.width = '70%';
                    cross.style.height = '2px';
                    cross.style.background = 'var(--danger)';
                    cross.style.transform = 'rotate(45deg)';
                    cell.appendChild(cross);
                }

                // Label cells for 7x7 grid matching the Bebras diagram
                if (this.level === 'hard' && y === 3 && x === 3) {
                    const label = document.createElement('span');
                    label.textContent = 'E';
                    label.style.position = 'absolute';
                    label.style.top = '2px';
                    label.style.left = '4px';
                    label.style.fontSize = '0.75rem';
                    label.style.fontWeight = 'bold';
                    label.style.color = 'var(--warning)';
                    cell.appendChild(label);
                }

                grid.appendChild(cell);
            }
        }
    },

    renderControls() {
        const controls = document.getElementById('game-controls');
        const tipHtml = this.level === 'easy' ? `
            <div style="font-size: 0.9rem; line-height: 1.5; color: var(--text-muted); margin-top: 0.5rem;">
                <strong>💡 提示：</strong> 選擇剩餘可能範圍「正中間」的格子，可以排除掉最多不合適的鞋子。
            </div>
        ` : '';

        controls.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">已試穿次數:</span>
                    <strong style="color: var(--text-main); font-size: 1.1rem;">${this.clicksCount} / ${this.maxClicks}</strong>
                </div>
                ${tipHtml}
            </div>
        `;
    },

    clickShoe(x, y) {
        Sound.play('click');
        this.clicksCount++;

        // Determine feedback
        let lenFeedback = ''; // 'fit', 'long', 'short'
        let widthFeedback = ''; // 'fit', 'wide', 'narrow'

        // Length checks (y-axis)
        if (y > this.targetY) {
            lenFeedback = 'long';
        } else if (y < this.targetY) {
            lenFeedback = 'short';
        } else {
            lenFeedback = 'fit';
        }

        // Width checks (x-axis)
        if (x > this.targetX) {
            widthFeedback = 'wide';
        } else if (x < this.targetX) {
            widthFeedback = 'narrow';
        } else {
            widthFeedback = 'fit';
        }

        // Save clicked info
        this.clicked[`${x},${y}`] = { len: lenFeedback, wid: widthFeedback };

        // Apply elimination rules
        // If shoe is too wide (x > targetX), then all columns x' >= x are too wide.
        if (widthFeedback === 'wide') {
            for (let col = x; col < this.gridSize; col++) {
                for (let r = 0; r < this.gridSize; r++) {
                    this.eliminated[r][col] = true;
                }
            }
        }
        // If shoe is too narrow (x < targetX), then all columns x' <= x are too narrow.
        if (widthFeedback === 'narrow') {
            for (let col = 0; col <= x; col++) {
                for (let r = 0; r < this.gridSize; r++) {
                    this.eliminated[r][col] = true;
                }
            }
        }
        // If width is fit, then all columns other than x are eliminated
        if (widthFeedback === 'fit') {
            for (let col = 0; col < this.gridSize; col++) {
                if (col !== x) {
                    for (let r = 0; r < this.gridSize; r++) {
                        this.eliminated[r][col] = true;
                    }
                }
            }
        }

        // Length elimination:
        // If too long (y > targetY), all rows r >= y are too long.
        if (lenFeedback === 'long') {
            for (let r = y; r < this.gridSize; r++) {
                for (let col = 0; col < this.gridSize; col++) {
                    this.eliminated[r][col] = true;
                }
            }
        }
        // If too short (y < targetY), all rows r <= y are too short.
        if (lenFeedback === 'short') {
            for (let r = 0; r <= y; r++) {
                for (let col = 0; col < this.gridSize; col++) {
                    this.eliminated[r][col] = true;
                }
            }
        }
        // If length is fit, all other rows are eliminated
        if (lenFeedback === 'fit') {
            for (let r = 0; r < this.gridSize; r++) {
                if (r !== y) {
                    for (let col = 0; col < this.gridSize; col++) {
                        this.eliminated[r][col] = true;
                    }
                }
            }
        }

        // Check Win/Loss
        const isWin = (x === this.targetX && y === this.targetY);
        
        this.renderGridCells();
        this.renderControls();

        // Update status text
        const status = document.getElementById('shoes-status');
        const lenTxt = lenFeedback === 'fit' ? '適中' : lenFeedback === 'long' ? '太長 ⬇️' : '太短 ⬆️';
        const widTxt = widthFeedback === 'fit' ? '適中' : widthFeedback === 'wide' ? '太寬 ⬅️' : '太窄 ➡️';
        status.innerHTML = `試穿結果：長度${lenTxt}，寬度${widTxt}`;

        if (isWin) {
            setTimeout(() => {
                App.completeLevel('shoes', this.level, this.ctExplanation);
            }, 1000);
            return;
        }

        if (this.clicksCount >= this.maxClicks) {
            setTimeout(() => {
                App.failLevel(`很遺憾，您用完了 ${this.maxClicks} 次機會！合適的鞋子在 (${this.targetX + 1}, ${this.targetY + 1})。再試一次，試試看每次都選中間的鞋子。`);
            }, 1000);
        }
    },

    cleanup() {
        // Nothing special to cleanup
    }
};
