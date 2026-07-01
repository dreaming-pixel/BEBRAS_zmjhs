window.GameChat = {
    level: 'easy',
    friends: [], // Array of friend names e.g. ['小萱', '奇哥', ...]
    rules: [], // Array of rule definitions { text, checkFn(path) }
    selectedPath: [], // Array of names sorted so far
    availableFriends: [], // Friends not yet selected

    ctExplanation: `
        <h3>💡 運算思維：拓撲排序 (Topological Sort)</h3>
        <p>此遊戲是資訊科學中非常關鍵的<b>拓撲排序 (Topological Sort)</b>問題。</p>
        <p><b>概念與應用：</b></p>
        <ul>
            <li>拓撲排序是用於一個<b>有向無環圖 (DAG, Directed Acyclic Graph)</b> 的節點排序演算法。其中，每一條有向邊代表一種先後關係的限制（如：修課擋修限制、套件安裝相依性）。</li>
            <li>在安排聊天順序時，規則給予了相依性：例如「必須先跟小愛聊天，才能跟戴哥聊」，這代表了一條從 <b>小愛 ➔ 戴哥</b> 的有向箭頭。</li>
            <li>解題思維是從<b>入度為 0 (無任何先決條件)</b> 的節點（如：小萱）開始，將其排入順序中，並移除其發出的限制箭頭。接著，尋找新的無限制節點（如：奇哥），重複此過程直到所有節點排定。</li>
            <li>如果存在循環限制（如 A ➔ B ➔ A），則代表有死鎖 (Deadlock)，不可能完成排序！</li>
        </ul>
    `,

    init(level) {
        this.level = level;
        this.selectedPath = [];
        
        if (level === 'easy') {
            this.setupEasy();
        } else if (level === 'medium') {
            this.setupMedium();
        } else {
            this.setupHard();
        }

        this.availableFriends = [...this.friends];

        this.renderInstructions();
        this.renderStage();
        this.renderControls();
    },

    setupEasy() {
        this.friends = ['小美', '小明', '小強', '小華'];
        this.rules = [
            {
                text: '🌸 任何時候都可以跟<b>小美</b>聊天。',
                check: (p) => p.indexOf('小美') !== -1 ? 'passed' : 'pending'
            },
            {
                text: '🎒 必須先與<b>小美</b>聊天後才能與<b>小明</b>聊天。',
                check: (p) => {
                    const idxMei = p.indexOf('小美');
                    const idxMing = p.indexOf('小明');
                    if (idxMing === -1) return 'pending';
                    if (idxMei === -1 || idxMei > idxMing) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '👟 必須先與<b>小明</b>聊天後才能與<b>小強</b>聊天。',
                check: (p) => {
                    const idxMing = p.indexOf('小明');
                    const idxQiang = p.indexOf('小強');
                    if (idxQiang === -1) return 'pending';
                    if (idxMing === -1 || idxMing > idxQiang) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '🎨 必須先與<b>小華</b>聊天後才能與<b>小強</b>聊天。',
                check: (p) => {
                    const idxHua = p.indexOf('小華');
                    const idxQiang = p.indexOf('小強');
                    if (idxQiang === -1) return 'pending';
                    if (idxHua === -1 || idxHua > idxQiang) return 'violated';
                    return 'passed';
                }
            }
        ];
    },

    setupMedium() {
        // Exact 2018/2023 Bebras Task "聊天順序"
        this.friends = ['小愛', '奇哥', '小蘿', '戴哥', '小萱'];
        this.rules = [
            {
                text: '💬 我任何時候都可跟<b>小萱</b>聊天。',
                check: (p) => p.indexOf('小萱') !== -1 ? 'passed' : 'pending'
            },
            {
                text: '❤️ 我必須先與<b>小愛</b>聊天後才能與<b>戴哥</b>聊天。',
                check: (p) => {
                    const idxAi = p.indexOf('小愛');
                    const idxDai = p.indexOf('戴哥');
                    if (idxDai === -1) return 'pending';
                    if (idxAi === -1 || idxAi > idxDai) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '⭐️ 我必須先與<b>小萱</b>聊天後才能與<b>奇哥</b>聊天。',
                check: (p) => {
                    const idxXuan = p.indexOf('小萱');
                    const idxQi = p.indexOf('奇哥');
                    if (idxQi === -1) return 'pending';
                    if (idxXuan === -1 || idxXuan > idxQi) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '🎒 我必須先與<b>戴哥</b>及<b>奇哥</b>聊天後才能與<b>小蘿</b>聊天。',
                check: (p) => {
                    const idxDai = p.indexOf('戴哥');
                    const idxQi = p.indexOf('奇哥');
                    const idxLuo = p.indexOf('小蘿');
                    if (idxLuo === -1) return 'pending';
                    if (idxDai === -1 || idxQi === -1 || idxDai > idxLuo || idxQi > idxLuo) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '🍀 我必須先與<b>奇哥</b>及<b>小萱</b>聊天後才能與<b>小愛</b>聊天。',
                check: (p) => {
                    const idxQi = p.indexOf('奇哥');
                    const idxXuan = p.indexOf('小萱');
                    const idxAi = p.indexOf('小愛');
                    if (idxAi === -1) return 'pending';
                    if (idxQi === -1 || idxXuan === -1 || idxQi > idxAi || idxXuan > idxAi) return 'violated';
                    return 'passed';
                }
            }
        ];
    },

    setupHard() {
        this.friends = ['小萱', '奇哥', '小愛', '戴哥', '小蘿', '婷婷', '阿凱'];
        this.rules = [
            {
                text: '💬 <b>小萱</b>可以隨時聊天。',
                check: (p) => p.indexOf('小萱') !== -1 ? 'passed' : 'pending'
            },
            {
                text: '⚡️ <b>阿凱</b>必須先跟<b>婷婷</b>聊完才能聊。',
                check: (p) => {
                    const idxTing = p.indexOf('婷婷');
                    const idxKai = p.indexOf('阿凱');
                    if (idxKai === -1) return 'pending';
                    if (idxTing === -1 || idxTing > idxKai) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '🎓 <b>婷婷</b>必須先跟<b>小愛</b>及<b>奇哥</b>聊完才能聊。',
                check: (p) => {
                    const idxAi = p.indexOf('小愛');
                    const idxQi = p.indexOf('奇哥');
                    const idxTing = p.indexOf('婷婷');
                    if (idxTing === -1) return 'pending';
                    if (idxAi === -1 || idxQi === -1 || idxAi > idxTing || idxQi > idxTing) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '🍀 <b>小愛</b>必須先跟<b>奇哥</b>及<b>小萱</b>聊完才能聊。',
                check: (p) => {
                    const idxQi = p.indexOf('奇哥');
                    const idxXuan = p.indexOf('小萱');
                    const idxAi = p.indexOf('小愛');
                    if (idxAi === -1) return 'pending';
                    if (idxQi === -1 || idxXuan === -1 || idxQi > idxAi || idxXuan > idxAi) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '⭐️ <b>奇哥</b>必須先跟<b>小萱</b>聊完才能聊。',
                check: (p) => {
                    const idxXuan = p.indexOf('小萱');
                    const idxQi = p.indexOf('奇哥');
                    if (idxQi === -1) return 'pending';
                    if (idxXuan === -1 || idxXuan > idxQi) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '❤️ <b>戴哥</b>必須先跟<b>小愛</b>聊完才能聊。',
                check: (p) => {
                    const idxAi = p.indexOf('小愛');
                    const idxDai = p.indexOf('戴哥');
                    if (idxDai === -1) return 'pending';
                    if (idxAi === -1 || idxAi > idxDai) return 'violated';
                    return 'passed';
                }
            },
            {
                text: '🎒 <b>小蘿</b>必須先跟<b>戴哥</b>及<b>阿凱</b>聊完才能聊。',
                check: (p) => {
                    const idxDai = p.indexOf('戴哥');
                    const idxKai = p.indexOf('阿凱');
                    const idxLuo = p.indexOf('小蘿');
                    if (idxLuo === -1) return 'pending';
                    if (idxDai === -1 || idxKai === -1 || idxDai > idxLuo || idxKai > idxLuo) return 'violated';
                    return 'passed';
                }
            }
        ];
    },

    renderInstructions() {
        let desc = `
            <p><b>聊天順序：</b> 娜娜要安排與好朋友們的聊天時間。</p>
            <p>請點擊下方<b>「候選朋友卡片」</b>依序排列出合適的聊天時程。卡片會被移入上方的排程中。若要取消，可直接點選上方排程中的卡片送回下方。</p>
            <p>右側的<b>控制面板</b>會即時顯示規則是否滿足：🟢 通過、🔴 違背、⚪ 尚未排定。</p>
        `;
        document.getElementById('game-instructions').innerHTML = desc;
    },

    renderStage() {
        const stage = document.getElementById('game-stage');
        
        stage.innerHTML = `
            <div class="chat-game-container" style="display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%;">
                
                <!-- Timeline/Selected path -->
                <div style="width: 90%; display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="font-size: 0.95rem; color: var(--text-muted); font-weight: bold;">💬 已排定的聊天順序 (時間從左至右)：</div>
                    <div id="chat-timeline" style="display: flex; align-items: center; gap: 10px; min-height: 80px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: var(--radius-lg); border: 2px dashed var(--border-color); overflow-x: auto;">
                        <!-- Timeline slots -->
                    </div>
                </div>

                <!-- Available candidates -->
                <div style="width: 90%; display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="font-size: 0.95rem; color: var(--text-muted); font-weight: bold;">👥 候選朋友卡片 (點選加入排程)：</div>
                    <div id="chat-candidates" style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; min-height: 80px;">
                        <!-- Candidate cards -->
                    </div>
                </div>

            </div>
        `;

        this.renderCards();
    },

    renderCards() {
        const timeline = document.getElementById('chat-timeline');
        const candidates = document.getElementById('chat-candidates');

        timeline.innerHTML = '';
        candidates.innerHTML = '';

        // Render selected path in timeline
        if (this.selectedPath.length === 0) {
            timeline.innerHTML = '<span style="color: var(--text-muted); margin: auto; font-size: 0.9rem;">點擊下方卡片以加入時間軸...</span>';
        } else {
            this.selectedPath.forEach((name, index) => {
                const card = this.createCardElement(name, true, index);
                timeline.appendChild(card);

                // Add arrow between cards
                if (index < this.selectedPath.length - 1) {
                    const arrow = document.createElement('span');
                    arrow.textContent = '➔';
                    arrow.style.color = 'var(--primary)';
                    arrow.style.fontSize = '1.2rem';
                    timeline.appendChild(arrow);
                }
            });
        }

        // Render available candidates
        if (this.availableFriends.length === 0) {
            candidates.innerHTML = '<span style="color: var(--success); font-size: 0.95rem; font-weight: bold;">🎉 所有朋友已安排完畢！請點擊右方「驗證並提交」</span>';
        } else {
            this.availableFriends.forEach(name => {
                const card = this.createCardElement(name, false);
                candidates.appendChild(card);
            });
        }
    },

    createCardElement(name, inTimeline, index) {
        const card = document.createElement('div');
        card.className = 'friend-card';
        card.style.background = inTimeline ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)';
        card.style.border = inTimeline ? '2px solid var(--primary)' : '1px solid var(--border-color)';
        card.style.borderRadius = '12px';
        card.style.padding = '0.75rem 1.25rem';
        card.style.cursor = 'pointer';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '8px';
        card.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        card.style.transition = 'all 0.2s ease';

        // Hover scale effect
        card.onmouseover = () => {
            card.style.transform = 'translateY(-3px)';
            if (inTimeline) {
                card.style.background = 'rgba(239, 68, 68, 0.1)';
                card.style.borderColor = 'var(--danger)';
            } else {
                card.style.background = 'rgba(255,255,255,0.05)';
            }
        };
        card.onmouseout = () => {
            card.style.transform = 'translateY(0)';
            card.style.background = inTimeline ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)';
            card.style.border = inTimeline ? '2px solid var(--primary)' : '1px solid var(--border-color)';
        };

        const avatar = document.createElement('span');
        // Give unique avatars based on names
        const avatars = {
            '小美': '🌸', '小明': '🎒', '小強': '👟', '小華': '🎨',
            '小愛': '❤️', '奇哥': '⭐️', '小蘿': '🎒', '戴哥': '🍀', '小萱': '💬',
            '婷婷': '🎓', '阿凱': '⚡️'
        };
        avatar.textContent = avatars[name] || '👤';
        avatar.style.fontSize = '1.2rem';
        card.appendChild(avatar);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.style.fontWeight = 'bold';
        card.appendChild(nameSpan);

        if (inTimeline) {
            const indexIndicator = document.createElement('span');
            indexIndicator.textContent = `${index + 1}`;
            indexIndicator.style.background = 'var(--primary)';
            indexIndicator.style.color = '#fff';
            indexIndicator.style.borderRadius = '50%';
            indexIndicator.style.width = '18px';
            indexIndicator.style.height = '18px';
            indexIndicator.style.fontSize = '0.7rem';
            indexIndicator.style.display = 'flex';
            indexIndicator.style.alignItems = 'center';
            indexIndicator.style.justifyContent = 'center';
            indexIndicator.style.fontWeight = 'bold';
            card.appendChild(indexIndicator);

            card.onclick = () => this.deselectFriend(name);
        } else {
            card.onclick = () => this.selectFriend(name);
        }

        return card;
    },

    selectFriend(name) {
        Sound.play('click');
        this.selectedPath.push(name);
        this.availableFriends = this.availableFriends.filter(f => f !== name);
        this.renderCards();
        this.renderControls();
    },

    deselectFriend(name) {
        Sound.play('click');
        this.selectedPath = this.selectedPath.filter(f => f !== name);
        this.availableFriends.push(name);
        // Maintain original sorted order for available friends list to look neat
        this.availableFriends.sort((a, b) => this.friends.indexOf(a) - this.friends.indexOf(b));
        this.renderCards();
        this.renderControls();
    },

    renderControls() {
        const controls = document.getElementById('game-controls');
        
        // Render rule list with check states
        let rulesHTML = '<div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">';
        
        let allSatisfied = true;
        this.rules.forEach(rule => {
            const state = rule.check(this.selectedPath);
            let icon = '⚪';
            let color = 'var(--text-muted)';
            
            if (state === 'passed') {
                icon = '🟢';
                color = '#34d399'; // bright success green
            } else if (state === 'violated') {
                icon = '🔴';
                color = '#f87171'; // bright error red
                allSatisfied = false;
            } else {
                allSatisfied = false;
            }

            rulesHTML += `
                <div style="display: flex; gap: 8px; font-size: 0.85rem; color: ${color}; line-height: 1.4;">
                    <span>${icon}</span>
                    <span>${rule.text}</span>
                </div>
            `;
        });
        rulesHTML += '</div>';

        const submitReady = this.selectedPath.length === this.friends.length && allSatisfied;

        controls.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                <div style="font-size: 0.95rem; font-weight: bold; margin-bottom: 0.75rem;">📋 規則檢驗清單:</div>
                ${rulesHTML}
                <button class="modal-btn primary" id="btn-chat-submit" ${!submitReady ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>驗證並提交</button>
            </div>
        `;

        if (submitReady) {
            document.getElementById('btn-chat-submit').onclick = () => this.submitOrder();
        }
    },

    submitOrder() {
        Sound.play('success');
        App.completeLevel('chat', this.level, this.ctExplanation);
    },

    cleanup() {
        // Nothing special to cleanup
    }
};
