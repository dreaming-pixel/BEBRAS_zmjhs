window.GameStones = {
    stonesCount: 0,
    selectedCount: 0,
    isUserTurn: true,
    level: 'easy',

    ctExplanation: `
        <h3>💡 運算思維：賽局理論 (Game Theory)</h3>
        <p>此遊戲是著名的<b>巴什博弈 (Bash Game)</b>，屬於賽局理論中的「雙人對稱完全資訊博弈」。</p>
        <p><b>必勝策略分析：</b></p>
        <ul>
            <li>每回合最多可以拿走 3 顆，最少 1 顆，故每輪的「必勝組合數」為 <b>1 + 3 = 4</b> 顆。</li>
            <li>如果每次拿完後，留給對方的石頭數都是 <b>4 的倍數</b>，你就能保證獲勝。</li>
            <li>在<b>中級 (15 顆)</b> 中，你是先手。15 除以 4 餘 3，因此第一步你必須<b>先拿走 3 顆</b>，留下 12 顆（4 的倍數）。之後不論海狸拿走 $x$ 顆，你只要拿走 $4 - x$ 顆，就能在最後穩贏！</li>
            <li>在<b>高級 (21 顆)</b> 中，海狸先手。因為 21 除以 4 餘 1，海狸會先拿 1 顆留下 20 顆。此時你需要仔細觀察，如果海狸中途出錯，立刻搶回 4 的倍數主導權即可反敗為勝！</li>
        </ul>
    `,

    init(level) {
        this.level = level;
        this.selectedCount = 0;
        
        // Setup initial stone counts and turns
        if (level === 'easy') {
            this.stonesCount = 9;
            this.isUserTurn = true;
            this.renderInstructions();
            this.renderStage();
            this.renderControls();
        } else if (level === 'medium') {
            this.stonesCount = 15;
            this.isUserTurn = true;
            this.renderInstructions();
            this.renderStage();
            this.renderControls();
        } else { // hard
            this.stonesCount = 21;
            this.isUserTurn = false; // Decided by RPS
            this.renderInstructions();
            this.renderRPS(); // Show Rock-Paper-Scissors first
        }
    },

    renderRPS() {
        const stage = document.getElementById('game-stage');
        const controls = document.getElementById('game-controls');

        stage.innerHTML = `
            <div class="rps-container" style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%; padding: 1rem 0;">
                <div class="turn-status-bar" id="rps-status" style="font-size: 1.1rem; font-weight: 700; background: rgba(255,255,255,0.05); padding: 0.6rem 2rem; border-radius: 30px; border: 1px solid var(--border-color); width: 85%; text-align: center; color: var(--primary);">
                    ✊✌️✋ 猜拳決定誰先手！
                </div>
                
                <div style="display: flex; justify-content: space-around; width: 100%; max-width: 400px; align-items: center; margin: 0.5rem 0;">
                    <!-- Player Side -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: bold;">你</span>
                        <div id="player-rps-choice" style="font-size: 2.5rem; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 50%; border: 2px dashed var(--border-color); transition: all 0.3s ease;">❓</div>
                    </div>

                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-light);">VS</div>

                    <!-- Beaver Side -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: bold;">海狸</span>
                        <div id="beaver-rps-choice" style="font-size: 2.5rem; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 50%; border: 2px dashed var(--border-color); transition: all 0.3s ease;">❓</div>
                    </div>
                </div>

                <div id="rps-bubble" style="background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 12px; font-size: 0.9rem; border: 1px solid var(--border-color); min-height: 2.2rem; display: flex; align-items: center; max-width: 90%; text-align: center;">
                    海狸：贏的人先挑石頭喔，準備好了嗎？
                </div>
            </div>
        `;

        controls.innerHTML = `
            <div style="display: flex; gap: 0.5rem; width: 100%;">
                <button class="modal-btn secondary" id="btn-rps-rock" style="flex: 1; padding: 0.8rem 0; font-size: 1.1rem;">✊ 石頭</button>
                <button class="modal-btn secondary" id="btn-rps-scissors" style="flex: 1; padding: 0.8rem 0; font-size: 1.1rem;">✌️ 剪刀</button>
                <button class="modal-btn secondary" id="btn-rps-paper" style="flex: 1; padding: 0.8rem 0; font-size: 1.1rem;">✋ 布</button>
            </div>
        `;

        document.getElementById('btn-rps-rock').onclick = () => this.playRPS('rock');
        document.getElementById('btn-rps-scissors').onclick = () => this.playRPS('scissors');
        document.getElementById('btn-rps-paper').onclick = () => this.playRPS('paper');
    },

    playRPS(playerChoice) {
        Sound.play('click');
        
        // Disable buttons
        document.getElementById('btn-rps-rock').disabled = true;
        document.getElementById('btn-rps-scissors').disabled = true;
        document.getElementById('btn-rps-paper').disabled = true;

        const emojiMap = {
            'rock': '✊',
            'scissors': '✌️',
            'paper': '✋'
        };

        const choices = ['rock', 'scissors', 'paper'];
        const beaverChoice = choices[Math.floor(Math.random() * 3)];

        // Update displays
        const playerDisplay = document.getElementById('player-rps-choice');
        playerDisplay.textContent = emojiMap[playerChoice];
        playerDisplay.style.borderStyle = 'solid';
        playerDisplay.style.borderColor = 'var(--primary)';
        playerDisplay.style.background = 'rgba(59, 130, 246, 0.1)';

        const beaverDisplay = document.getElementById('beaver-rps-choice');
        beaverDisplay.textContent = '🤔';
        
        setTimeout(() => {
            beaverDisplay.textContent = emojiMap[beaverChoice];
            beaverDisplay.style.borderStyle = 'solid';
            beaverDisplay.style.borderColor = 'var(--success)';
            beaverDisplay.style.background = 'rgba(34, 197, 94, 0.1)';

            // Determine winner
            let resultText = '';
            let isUserWinner = false;
            let tie = false;

            if (playerChoice === beaverChoice) {
                tie = true;
            } else if (
                (playerChoice === 'rock' && beaverChoice === 'scissors') ||
                (playerChoice === 'scissors' && beaverChoice === 'paper') ||
                (playerChoice === 'paper' && beaverChoice === 'rock')
            ) {
                isUserWinner = true;
            }

            const status = document.getElementById('rps-status');
            const bubble = document.getElementById('rps-bubble');

            if (tie) {
                status.textContent = '🤝 平手！再來一次！';
                status.style.color = 'var(--warning)';
                bubble.textContent = '海狸：哎呀，我們心靈相通呢！再來一拳！';
                
                setTimeout(() => {
                    this.renderRPS();
                }, 1500);
            } else if (isUserWinner) {
                status.textContent = '🎉 你贏了！獲得先手機會！';
                status.style.color = 'var(--success)';
                bubble.textContent = '海狸：可惡，被你猜中了！讓你先開始吧。';
                this.isUserTurn = true;
                
                setTimeout(() => {
                    this.startGameAfterRPS();
                }, 1800);
            } else {
                status.textContent = '😢 海狸贏了！海狸先手。';
                status.style.color = 'var(--danger)';
                bubble.textContent = '海狸：哈哈！我贏了！那我就先開始囉！';
                this.isUserTurn = false;
                
                setTimeout(() => {
                    this.startGameAfterRPS();
                }, 1800);
            }
        }, 800);
    },

    startGameAfterRPS() {
        this.renderStage();
        this.renderControls();

        if (!this.isUserTurn) {
            setTimeout(() => this.aiMove(), 1500);
        }
    },

    renderInstructions() {
        let desc = '';
        if (this.level === 'easy') {
            desc = `
                <p><b>初級挑戰：</b> 桌上有 9 顆石頭。你先開始。</p>
                <p>每回合你可以選擇拿走 <b>1、2 或 3 顆石頭</b>。誰拿到最後一顆石頭就贏了！</p>
                <p>海狸這關比較迷糊，看你能不能擊敗牠！</p>
            `;
        } else if (this.level === 'medium') {
            desc = `
                <p><b>中級挑戰 (Bebras 原題)：</b> 桌上有 15 顆石頭。你先開始。</p>
                <p>海狸已經學會了聰明的決策，會使出必勝策略。你第一步應該拿走幾顆才能確保獲勝？</p>
            `;
        } else {
            desc = `
                <p><b>高級挑戰：</b> 桌上有 21 顆石頭。猜拳贏的人可以決定誰先手！</p>
                <p>如果您搶到先手，可以主動採用必勝策略；如果是後手，請仔細觀察海狸是否會犯錯，並在關鍵時刻搶回主導權！</p>
            `;
        }
        document.getElementById('game-instructions').innerHTML = desc;
    },

    renderStage() {
        const stage = document.getElementById('game-stage');
        stage.innerHTML = `
            <div class="stones-game-container" style="display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%;">
                <!-- Status Display -->
                <div class="turn-status-bar" id="stones-status" style="font-size: 1.2rem; font-weight: 700; background: rgba(255,255,255,0.05); padding: 0.75rem 2rem; border-radius: 30px; border: 1px solid var(--border-color); width: 80%; text-align: center;">
                    ${this.isUserTurn ? '🟢 輪到你了！請選擇要拿取的石頭數量。' : '🤖 輪到海狸了，牠正在思考...'}
                </div>

                <!-- Mascot Emotion -->
                <div class="beaver-reaction-area" style="display: flex; align-items: center; gap: 1rem;">
                    <svg class="beaver-svg-emotion" id="stones-beaver-svg" viewBox="0 0 100 100" width="70" height="70">
                        <ellipse cx="50" cy="55" rx="35" ry="30" fill="#8B5A2B"/>
                        <circle cx="25" cy="30" r="10" fill="#5C3818"/>
                        <circle cx="75" cy="30" r="10" fill="#5C3818"/>
                        <circle cx="25" cy="30" r="6" fill="#E6A15C"/>
                        <circle cx="75" cy="30" r="6" fill="#E6A15C"/>
                        <circle cx="50" cy="40" r="25" fill="#8B5A2B"/>
                        <!-- Normal Eyes -->
                        <g id="eyes-normal">
                            <circle cx="42" cy="35" r="3.5" fill="#000"/>
                            <circle cx="43" cy="34" r="1" fill="#fff"/>
                            <circle cx="58" cy="35" r="3.5" fill="#000"/>
                            <circle cx="59" cy="34" r="1" fill="#fff"/>
                        </g>
                        <!-- Thinking Eyes (Hidden by default) -->
                        <g id="eyes-thinking" style="display:none;">
                            <ellipse cx="42" cy="35" rx="3.5" ry="1.5" fill="#000"/>
                            <ellipse cx="58" cy="35" rx="3.5" ry="1.5" fill="#000"/>
                        </g>
                        <!-- Sad Eyes (Hidden by default) -->
                        <g id="eyes-sad" style="display:none;">
                            <path d="M38 37 Q42 33 46 37" fill="none" stroke="#000" stroke-width="2"/>
                            <path d="M54 37 Q58 33 62 37" fill="none" stroke="#000" stroke-width="2"/>
                        </g>
                        <ellipse cx="50" cy="45" rx="10" ry="7" fill="#E6A15C"/>
                        <ellipse cx="50" cy="42" rx="4" ry="2.5" fill="#000"/>
                        <rect x="47" y="47" width="3" height="5" fill="#fff"/>
                        <rect x="50" y="47" width="3" height="5" fill="#fff"/>
                        <!-- Mouth normal -->
                        <path id="mouth-happy" d="M46 50 Q50 54 54 50" fill="none" stroke="#000" stroke-width="1.5"/>
                    </svg>
                    <span id="beaver-bubble" style="background: rgba(255,255,255,0.05); padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.9rem; border: 1px solid var(--border-color);">
                        ${this.isUserTurn ? '看看你第一步會怎麼走？' : '換我囉，我要使出全力了！'}
                    </span>
                </div>

                <!-- Stones Pile -->
                <div class="stones-pile" id="stones-pile-container" style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; max-width: 480px; gap: 12px; padding: 1.5rem; background: rgba(0,0,0,0.15); border-radius: var(--radius-lg); border: 1px solid var(--border-color); min-height: 180px;">
                    <!-- Stones dynamically loaded -->
                </div>
            </div>
        `;
        this.renderPile();
    },

    setBeaverEmotion(emotion) {
        const eyesNormal = document.getElementById('eyes-normal');
        const eyesThinking = document.getElementById('eyes-thinking');
        const eyesSad = document.getElementById('eyes-sad');
        const bubble = document.getElementById('beaver-bubble');

        eyesNormal.style.display = 'none';
        eyesThinking.style.display = 'none';
        eyesSad.style.display = 'none';

        if (emotion === 'normal') {
            eyesNormal.style.display = 'block';
        } else if (emotion === 'thinking') {
            eyesThinking.style.display = 'block';
            bubble.textContent = '讓我好好思考一下數論... 🤔';
        } else if (emotion === 'happy') {
            eyesNormal.style.display = 'block';
            bubble.textContent = '嘿嘿，這一步我算好了！🌟';
        } else if (emotion === 'sad') {
            eyesSad.style.display = 'block';
            bubble.textContent = '完蛋了，我落入陷阱了嗎？😢';
        }
    },

    renderPile() {
        const container = document.getElementById('stones-pile-container');
        container.innerHTML = '';

        for (let i = 0; i < this.stonesCount; i++) {
            const stone = document.createElement('div');
            stone.className = 'stone-item';
            stone.style.width = '48px';
            stone.style.height = '48px';
            stone.style.borderRadius = '50%';
            stone.style.background = 'radial-gradient(circle at 15px 15px, #888, #333)';
            stone.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)';
            stone.style.transition = 'all 0.3s ease';
            stone.style.display = 'flex';
            stone.style.alignItems = 'center';
            stone.style.justifyContent = 'center';
            stone.style.fontSize = '0.8rem';
            stone.style.fontWeight = 'bold';
            stone.style.color = 'rgba(255,255,255,0.4)';
            stone.textContent = i + 1;
            container.appendChild(stone);
        }
    },

    renderControls() {
        const controls = document.getElementById('game-controls');
        controls.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
                <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                    目前剩餘：<strong style="color: var(--text-main); font-size: 1.2rem;" id="remaining-stones-text">${this.stonesCount}</strong> 顆石頭
                </div>
                <div style="display: flex; gap: 0.5rem; width: 100%;">
                    <button class="modal-btn secondary" id="btn-take-1" style="flex: 1; padding: 1rem 0;" ${!this.isUserTurn ? 'disabled' : ''}>拿 1 顆</button>
                    <button class="modal-btn secondary" id="btn-take-2" style="flex: 1; padding: 1rem 0;" ${!this.isUserTurn || this.stonesCount < 2 ? 'disabled' : ''}>拿 2 顆</button>
                    <button class="modal-btn secondary" id="btn-take-3" style="flex: 1; padding: 1rem 0;" ${!this.isUserTurn || this.stonesCount < 3 ? 'disabled' : ''}>拿 3 顆</button>
                </div>
            </div>
        `;

        // Bind events and hovers
        const btn1 = document.getElementById('btn-take-1');
        const btn2 = document.getElementById('btn-take-2');
        const btn3 = document.getElementById('btn-take-3');

        if (btn1) {
            btn1.onmouseover = () => this.highlightStones(1);
            btn1.onmouseout = () => this.highlightStones(0);
            btn1.onclick = () => this.userMove(1);
        }
        if (btn2) {
            btn2.onmouseover = () => this.highlightStones(2);
            btn2.onmouseout = () => this.highlightStones(0);
            btn2.onclick = () => this.userMove(2);
        }
        if (btn3) {
            btn3.onmouseover = () => this.highlightStones(3);
            btn3.onmouseout = () => this.highlightStones(0);
            btn3.onclick = () => this.userMove(3);
        }
    },

    highlightStones(count) {
        if (!this.isUserTurn) return;
        const stones = document.querySelectorAll('.stone-item');
        stones.forEach((stone, idx) => {
            // Highlight the last 'count' stones
            if (idx >= stones.length - count) {
                stone.style.transform = 'scale(1.15)';
                stone.style.boxShadow = '0 0 15px var(--primary-glow)';
                stone.style.borderColor = 'var(--primary)';
            } else {
                stone.style.transform = 'scale(1)';
                stone.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)';
            }
        });
    },

    userMove(count) {
        if (!this.isUserTurn) return;
        this.takeStones(count, true);
    },

    takeStones(count, isUser) {
        Sound.play('click');
        
        // Remove stones
        this.stonesCount -= count;
        this.renderPile();
        
        // Update texts
        document.getElementById('remaining-stones-text').textContent = this.stonesCount;

        if (this.stonesCount === 0) {
            // Game Over
            if (isUser) {
                App.completeLevel('stones', this.level, this.ctExplanation);
            } else {
                App.failLevel("海狸拿走了最後的石頭，海狸獲勝了！別灰心，思考一下，如何控制剩下的石頭數是 4 的倍數？");
            }
            return;
        }

        // Toggle turn
        this.isUserTurn = !isUser;
        this.renderControls();

        const statusBar = document.getElementById('stones-status');
        if (this.isUserTurn) {
            statusBar.innerHTML = '🟢 輪到你了！請選擇要拿取的石頭數量。';
            // Adjust beaver emotion depending on state
            if (this.level !== 'easy' && this.stonesCount % 4 === 0) {
                this.setBeaverEmotion('happy');
            } else if (this.level !== 'easy' && this.stonesCount % 4 !== 0) {
                this.setBeaverEmotion('sad');
            } else {
                this.setBeaverEmotion('normal');
            }
        } else {
            statusBar.innerHTML = '🤖 輪到海狸了，牠正在思考...';
            this.setBeaverEmotion('thinking');
            setTimeout(() => this.aiMove(), 1500);
        }
    },

    aiMove() {
        // AI Algorithm
        let count = 1;

        if (this.level === 'easy') {
            // Easy AI: randomly pick 1, 2, or 3, but sometimes optimal if it feels like it
            if (Math.random() < 0.4) {
                // Optimal move
                let remainder = this.stonesCount % 4;
                count = remainder === 0 ? Math.floor(Math.random() * 3) + 1 : remainder;
            } else {
                count = Math.floor(Math.random() * Math.min(3, this.stonesCount)) + 1;
            }
        } else {
            // Optimal AI (Medium & Hard): leave a multiple of 4
            let remainder = this.stonesCount % 4;
            if (remainder === 0) {
                // If already multiple of 4, AI is forced to pick suboptimally
                count = 1; // Play safe
            } else {
                count = remainder;
            }
        }

        // Ensure count is valid
        count = Math.max(1, Math.min(count, Math.min(3, this.stonesCount)));

        const bubble = document.getElementById('beaver-bubble');
        bubble.textContent = `哼哼，我決定拿走 ${count} 顆石頭！`;

        // Highlight selected stones before taking
        const stones = document.querySelectorAll('.stone-item');
        stones.forEach((stone, idx) => {
            if (idx >= stones.length - count) {
                stone.style.transform = 'scale(1.15)';
                stone.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.6)';
            }
        });

        setTimeout(() => {
            this.takeStones(count, false);
        }, 1000);
    },

    cleanup() {
        // Nothing special to cleanup
    }
};
