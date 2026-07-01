// --- Sound System ---
const Sound = {
    play(id) {
        const audio = document.getElementById(`sound-${id}`);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Sound play error (muted/interaction required):", e));
        }
    }
};

// --- Global App State ---
const App = {
    currentView: 'dashboard',
    currentGame: null,
    currentLevel: null,
    playerName: "",
    playerClass: "",
    allowedStudents: [], // Strict login registration roster
    
    // Default unlocked state (Easy is true, others false)
    progress: {
        stones: { easy: false, medium: false, hard: false },
        shoes: { easy: false, medium: false, hard: false },
        river: { easy: false, medium: false, hard: false },
        chat: { easy: false, medium: false, hard: false },
        taxi: { easy: false, medium: false, hard: false },
        aquaponics: { easy: false, medium: false, hard: false }
    },

    leaderboardClassmates: [
        { name: "陳小明", stars: 16, rank: "傳奇海狸大師 🦫✨" },
        { name: "林美美", stars: 13, rank: "資深工程海狸 ⚙️" },
        { name: "張王強", stars: 11, rank: "資深工程海狸 ⚙️" },
        { name: "王小華", stars: 9, rank: "勇敢探險海狸 🗺️" },
        { name: "黃小瑜", stars: 7, rank: "勇敢探險海狸 🗺️" },
        { name: "劉阿吉", stars: 5, rank: "見習小海狸 🪵" },
        { name: "李佳佳", stars: 3, rank: "見習小海狸 🪵" },
        { name: "吳大同", stars: 1, rank: "初級小海狸 🌱" }
    ],

    init() {
        this.loadProgress();
        this.bindEvents();
        this.renderDashboard();
    },

    getAllStudents() {
        const saved = localStorage.getItem('bebras_portal_students');
        if (saved) {
            try {
                return JSON.parse(saved) || {};
            } catch (e) {
                console.error("Error parsing students database:", e);
                return {};
            }
        }
        return {};
    },

    saveAllStudents(students) {
        localStorage.setItem('bebras_portal_students', JSON.stringify(students));
    },

    loadProgress() {
        // Load allowed students roster
        const savedAllowed = localStorage.getItem('bebras_portal_allowed_students');
        if (savedAllowed) {
            try {
                this.allowedStudents = JSON.parse(savedAllowed) || [];
            } catch (e) {
                console.error("Error loading allowed students:", e);
                this.allowedStudents = [];
            }
        } else {
            this.allowedStudents = [];
        }

        const currentStudentKey = localStorage.getItem('bebras_portal_current_student');
        if (currentStudentKey) {
            const students = this.getAllStudents();
            if (students[currentStudentKey]) {
                this.playerClass = students[currentStudentKey].class;
                this.playerName = students[currentStudentKey].name;
                this.progress = students[currentStudentKey].progress;
                
                // Hide login overlay
                const overlay = document.getElementById('login-overlay');
                if (overlay) overlay.classList.add('hidden');
            } else {
                localStorage.removeItem('bebras_portal_current_student');
                this.showLoginOverlay();
            }
        } else {
            this.showLoginOverlay();
        }

        const nameInput = document.getElementById('leaderboard-name-input');
        if (nameInput) nameInput.value = this.playerName;

        this.updateProgressUI();
    },

    showLoginOverlay() {
        const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.classList.remove('hidden');
        
        // Reset input fields
        const classInput = document.getElementById('login-class');
        const nameInput = document.getElementById('login-name');
        if (classInput) classInput.value = '';
        if (nameInput) nameInput.value = '';

        // Reset sidebar values
        const sidebarClass = document.getElementById('sidebar-class');
        const sidebarName = document.getElementById('sidebar-name');
        const sidebarRank = document.getElementById('sidebar-rank');
        if (sidebarClass) sidebarClass.textContent = '-';
        if (sidebarName) sidebarName.textContent = '-';
        if (sidebarRank) sidebarRank.textContent = '-';
    },

    saveProgress() {
        const currentStudentKey = localStorage.getItem('bebras_portal_current_student');
        if (currentStudentKey) {
            const students = this.getAllStudents();
            if (students[currentStudentKey]) {
                students[currentStudentKey].progress = this.progress;
                this.saveAllStudents(students);
            }
        }
        localStorage.setItem('bebras_portal_progress', JSON.stringify(this.progress));
        this.updateProgressUI();
    },

    resetProgress() {
        if (confirm("確定要重置目前登入帳號的挑戰進度嗎？這將會清除您所有的星等與解鎖關卡！")) {
            this.progress = {
                stones: { easy: false, medium: false, hard: false },
                shoes: { easy: false, medium: false, hard: false },
                river: { easy: false, medium: false, hard: false },
                chat: { easy: false, medium: false, hard: false },
                taxi: { easy: false, medium: false, hard: false },
                aquaponics: { easy: false, medium: false, hard: false }
            };
            this.saveProgress();
            this.renderDashboard();
            Sound.play('click');
        }
    },

    // Ranks based on total levels cleared
    getRank(clearedCount) {
        if (clearedCount >= 18) return "運算思維大師 👑";
        if (clearedCount >= 14) return "傳奇海狸大師 🦫✨";
        if (clearedCount >= 10) return "資深工程海狸 ⚙️";
        if (clearedCount >= 6)  return "勇敢探險海狸 🗺️";
        if (clearedCount >= 2)  return "見習小海狸 🪵";
        return "初級小海狸 🌱";
    },

    getRankingList() {
        let clearedCount = 0;
        for (const game in this.progress) {
            for (const lvl in this.progress[game]) {
                if (this.progress[game][lvl] === true) clearedCount++;
            }
        }

        const students = this.getAllStudents();
        const rankingList = [];

        // Add self
        rankingList.push({
            name: `${this.playerName} (您)`,
            class: this.playerClass,
            stars: clearedCount,
            rankTitle: this.getRank(clearedCount),
            isSelf: true
        });

        // Add other students
        for (const key in students) {
            const s = students[key];
            if (s.name === this.playerName && s.class === this.playerClass) {
                continue; // Skip self since already added
            }
            let sCleared = 0;
            for (const g in s.progress) {
                for (const l in s.progress[g]) {
                    if (s.progress[g][l] === true) sCleared++;
                }
            }
            rankingList.push({
                name: s.name,
                class: s.class,
                stars: sCleared,
                rankTitle: this.getRank(sCleared),
                isSelf: false
            });
        }

        // Add mock classmates
        this.leaderboardClassmates.forEach(c => {
            rankingList.push({
                name: c.name,
                class: "三年甲班",
                stars: c.stars,
                rankTitle: c.rank,
                isSelf: false
            });
        });

        // Sort descending by stars
        rankingList.sort((a, b) => b.stars - a.stars);
        return rankingList;
    },

    updateProgressUI() {
        let clearedCount = 0;
        for (const game in this.progress) {
            for (const lvl in this.progress[game]) {
                if (this.progress[game][lvl] === true) clearedCount++;
            }
        }

        // Calculate rank in ranking pool
        const rankingList = this.getRankingList();
        let myRankNum = 1;
        const myItem = rankingList.find(item => item.isSelf);
        if (myItem) {
            myRankNum = rankingList.indexOf(myItem) + 1;
        }

        // Update sidebar fields
        const sidebarClass = document.getElementById('sidebar-class');
        const sidebarName = document.getElementById('sidebar-name');
        const sidebarRank = document.getElementById('sidebar-rank');

        if (sidebarClass) sidebarClass.textContent = this.playerClass || '-';
        if (sidebarName) sidebarName.textContent = this.playerName || '-';
        if (sidebarRank) sidebarRank.textContent = myRankNum;

        // Update rank and stats in header
        document.getElementById('user-rank').textContent = this.getRank(clearedCount);
        document.getElementById('completed-count').textContent = `${clearedCount} / 18 已完成`;
        
        // Progress bar percentage
        const pct = (clearedCount / 18) * 100;
        document.getElementById('global-progress-bar').style.width = `${pct}%`;
    },

    loginStudent(studentClass, studentName) {
        if (!studentClass || !studentName) {
            alert("請輸入班級與姓名！");
            return;
        }

        const loginErrorMsg = document.getElementById('login-error-msg');
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';

        // Check against allowed roster if populated
        if (this.allowedStudents && this.allowedStudents.length > 0) {
            const isAllowed = this.allowedStudents.some(s => {
                return String(s.class).trim() === String(studentClass).trim() && 
                       String(s.name).trim() === String(studentName).trim();
            });

            if (!isAllowed) {
                if (loginErrorMsg) loginErrorMsg.style.display = 'block';
                Sound.play('fail');
                return;
            }
        }

        this.playerClass = studentClass;
        this.playerName = studentName;
        
        const students = this.getAllStudents();
        const key = `${studentClass}_${studentName}`;

        if (students[key]) {
            this.progress = students[key].progress;
        } else {
            this.progress = {
                stones: { easy: false, medium: false, hard: false },
                shoes: { easy: false, medium: false, hard: false },
                river: { easy: false, medium: false, hard: false },
                chat: { easy: false, medium: false, hard: false },
                taxi: { easy: false, medium: false, hard: false },
                aquaponics: { easy: false, medium: false, hard: false }
            };
            students[key] = {
                class: studentClass,
                name: studentName,
                progress: this.progress
            };
            this.saveAllStudents(students);
        }

        localStorage.setItem('bebras_portal_current_student', key);
        
        // Hide login overlay
        const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.classList.add('hidden');

        this.switchView('dashboard');
        this.updateProgressUI();
    },

    logout() {
        localStorage.removeItem('bebras_portal_current_student');
        this.playerName = "";
        this.playerClass = "";
        this.showLoginOverlay();
        this.switchView('dashboard');
    },

    deleteStudent(key) {
        if (confirm(`確定要刪除該學生的所有挑戰紀錄嗎？此動作不可復原。`)) {
            const students = this.getAllStudents();
            delete students[key];
            this.saveAllStudents(students);
            
            const currentKey = localStorage.getItem('bebras_portal_current_student');
            if (currentKey === key) {
                this.logout();
            } else {
                this.renderAdminPanel();
            }
        }
    },

    clearAllStudents() {
        if (confirm("🚨 警告：確定要清空全班所有的學生資料嗎？所有人的挑戰進度都將永久遺失！")) {
            localStorage.removeItem('bebras_portal_students');
            localStorage.removeItem('bebras_portal_current_student');
            this.logout();
        }
    },

    bindEvents() {
        // Login button
        document.getElementById('btn-login').addEventListener('click', () => {
            const cls = document.getElementById('login-class').value.trim();
            const name = document.getElementById('login-name').value.trim();
            this.loginStudent(cls, name);
        });

        // Admin trigger
        document.getElementById('btn-admin-trigger').addEventListener('click', () => {
            const pwd = prompt("請輸入管理員密碼：");
            if (pwd === "admin123") {
                const overlay = document.getElementById('login-overlay');
                if (overlay) overlay.classList.add('hidden');
                this.switchView('admin');
            } else if (pwd !== null) {
                alert("密碼錯誤！");
            }
        });

        // Admin logout
        document.getElementById('btn-admin-logout').addEventListener('click', () => {
            this.showLoginOverlay();
            this.switchView('dashboard');
        });

        // Clear all students
        document.getElementById('btn-clear-all-students').addEventListener('click', () => {
            this.clearAllStudents();
        });

        // Logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            if (confirm("確定要登出並切換帳號嗎？您的進度已儲存。")) {
                this.logout();
            }
        });

        // Trigger file input
        document.getElementById('btn-trigger-upload').addEventListener('click', () => {
            document.getElementById('admin-upload-image').click();
        });

        // Image upload change (OCR)
        document.getElementById('admin-upload-image').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.importImageOCR(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });

        // Import manual text list
        document.getElementById('btn-import-text-submit').addEventListener('click', () => {
            const text = document.getElementById('admin-import-text').value.trim();
            this.importTextList(text);
        });

        // Clear registered students list
        document.getElementById('btn-clear-registered-list').addEventListener('click', () => {
            if (confirm("確定要清空已註冊的學生名單嗎？這將使登入介面回到開放註冊模式。")) {
                this.allowedStudents = [];
                localStorage.removeItem('bebras_portal_allowed_students');
                alert("註冊名單已清空！");
                this.renderRegisteredPreview();
            }
        });

        // Dashboard Nav
        document.getElementById('nav-dashboard').addEventListener('click', () => {
            this.switchView('dashboard');
            Sound.play('click');
        });

        // Leaderboard Nav
        document.getElementById('nav-leaderboard').addEventListener('click', () => {
            this.switchView('leaderboard');
            Sound.play('click');
        });

        // Save nickname
        document.getElementById('btn-save-name').addEventListener('click', () => {
            const input = document.getElementById('leaderboard-name-input');
            const newName = input.value.trim();
            if (newName) {
                const currentStudentKey = localStorage.getItem('bebras_portal_current_student');
                if (currentStudentKey) {
                    const students = this.getAllStudents();
                    if (students[currentStudentKey]) {
                        // Rename student in the database
                        const oldClass = students[currentStudentKey].class;
                        const newKey = `${oldClass}_${newName}`;
                        
                        // Keep database integrity
                        students[newKey] = {
                            class: oldClass,
                            name: newName,
                            progress: students[currentStudentKey].progress
                        };
                        
                        if (currentStudentKey !== newKey) {
                            delete students[currentStudentKey];
                        }
                        
                        this.saveAllStudents(students);
                        localStorage.setItem('bebras_portal_current_student', newKey);
                        this.playerName = newName;
                    }
                } else {
                    this.playerName = newName;
                }
                localStorage.setItem('bebras_portal_player_name', this.playerName);
                Sound.play('click');
                alert("暱稱儲存成功！");
                this.renderLeaderboard();
            } else {
                alert("請輸入有效的暱稱！");
            }
        });

        // Reset Nav
        document.getElementById('btn-reset-progress').addEventListener('click', () => {
            this.resetProgress();
        });

        // Exit Game
        document.getElementById('btn-exit-game').addEventListener('click', () => {
            this.switchView('dashboard');
            Sound.play('click');
        });

        // Modal Action Buttons
        document.getElementById('modal-btn-next').addEventListener('click', () => {
            this.closeModal();
            this.loadNextLevel();
        });

        document.getElementById('modal-btn-retry').addEventListener('click', () => {
            this.closeModal();
            this.retryLevel();
        });

        document.getElementById('modal-btn-close').addEventListener('click', () => {
            this.closeModal();
            this.switchView('dashboard');
        });
    },

    switchView(viewName) {
        this.currentView = viewName;
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`view-${viewName}`).classList.add('active');

        // Update nav buttons active states
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (viewName === 'dashboard') {
            document.getElementById('nav-dashboard').classList.add('active');
            this.currentGame = null;
            this.currentLevel = null;
            this.renderDashboard();
        } else if (viewName === 'leaderboard') {
            document.getElementById('nav-leaderboard').classList.add('active');
            this.renderLeaderboard();
        } else if (viewName === 'admin') {
            this.renderAdminPanel();
        }
    },

    renderLeaderboard() {
        const nameInput = document.getElementById('leaderboard-name-input');
        if (nameInput) nameInput.value = this.playerName;

        const rankingList = this.getRankingList();

        // Render rows
        const tbody = document.getElementById('leaderboard-list');
        if (tbody) {
            tbody.innerHTML = '';
            rankingList.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.className = `leaderboard-row ${item.isSelf ? 'self' : ''}`;
                
                const rankNum = index + 1;
                let rankBadgeHtml = '';
                if (rankNum === 1) {
                    rankBadgeHtml = `<span class="rank-badge rank-1">1</span>`;
                } else if (rankNum === 2) {
                    rankBadgeHtml = `<span class="rank-badge rank-2">2</span>`;
                } else if (rankNum === 3) {
                    rankBadgeHtml = `<span class="rank-badge rank-3">3</span>`;
                } else {
                    rankBadgeHtml = `<span class="rank-badge rank-other">${rankNum}</span>`;
                }

                // Append class prefix to other students' names if present
                const displayName = item.class ? `[${item.class}] ${item.name}` : item.name;

                tr.innerHTML = `
                    <td style="padding: 14px 12px; text-align: center;">${rankBadgeHtml}</td>
                    <td style="padding: 14px 12px;">${displayName}</td>
                    <td style="padding: 14px 12px; text-align: center; color: var(--warning); font-weight: bold; font-size: 1.1rem;">⭐ ${item.stars}</td>
                    <td style="padding: 14px 12px; color: ${item.isSelf ? 'var(--primary-light)' : 'var(--text-main)'};">${item.rankTitle}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    },

    renderAdminPanel() {
        this.renderRegisteredPreview();
        const students = this.getAllStudents();
        const tbody = document.getElementById('admin-student-list');
        if (!tbody) return;
        tbody.innerHTML = '';

        const list = [];
        for (const key in students) {
            const s = students[key];
            let stars = 0;
            for (const g in s.progress) {
                for (const l in s.progress[g]) {
                    if (s.progress[g][l] === true) stars++;
                }
            }
            list.push({
                key: key,
                class: s.class,
                name: s.name,
                stars: stars,
                progress: s.progress
            });
        }

        // Sort by stars descending
        list.sort((a, b) => b.stars - a.stars);

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.95rem;">目前無任何學生登入紀錄。</td></tr>`;
            return;
        }

        list.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.className = 'leaderboard-row';
            
            const rankNum = index + 1;
            let rankBadgeHtml = '';
            if (rankNum === 1) {
                rankBadgeHtml = `<span class="rank-badge rank-1">1</span>`;
            } else if (rankNum === 2) {
                rankBadgeHtml = `<span class="rank-badge rank-2">2</span>`;
            } else if (rankNum === 3) {
                rankBadgeHtml = `<span class="rank-badge rank-3">3</span>`;
            } else {
                rankBadgeHtml = `<span class="rank-badge rank-other">${rankNum}</span>`;
            }

            const pct = Math.round((item.stars / 18) * 100);

            tr.innerHTML = `
                <td style="padding: 14px 12px; text-align: center;">${rankBadgeHtml}</td>
                <td style="padding: 14px 12px; font-weight: bold;">${item.class}</td>
                <td style="padding: 14px 12px; font-weight: bold;">${item.name}</td>
                <td style="padding: 14px 12px; text-align: center; color: var(--warning); font-weight: bold; font-size: 1.1rem;">⭐ ${item.stars}</td>
                <td style="padding: 14px 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="progress-bar-outer" style="flex: 1; height: 8px;">
                            <div class="progress-bar-inner" style="width: ${pct}%; background: var(--success);"></div>
                        </div>
                        <span style="font-size: 0.8rem; min-width: 35px; text-align: right;">${pct}%</span>
                    </div>
                </td>
                <td style="padding: 14px 12px; text-align: center;">
                    <button class="modal-btn secondary" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: #ff8b8b; padding: 4px 10px; font-size: 0.8rem;" onclick="App.deleteStudent('${item.key}')">刪除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    parseOCRText(text) {
        const parsed = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            // Clean separator chars commonly returned by tables (like | ｜ : -)
            const cleanedLine = line.replace(/[|｜:：\-_]/g, ' ');
            const tokens = cleanedLine.split(/\s+/).map(t => t.trim()).filter(t => t.length > 0);
            
            if (tokens.length >= 2) {
                const first = tokens[0];
                const second = tokens[1];
                // Class can be digits (like 701) or contain '班'
                const isClass = /^\d+$/.test(first) || first.includes('班');
                // Name should contain Chinese characters or English letters, and not equal headers
                const isName = /^[\u4e00-\u9fa5a-zA-Z]+$/.test(second) && second !== "姓名" && second !== "Name" && second !== "班級" && second !== "Class";
                
                if (isClass && isName) {
                    parsed.push({ class: first, name: second });
                }
            } else if (tokens.length === 1) {
                // Handle cases where spacing is missed, e.g. "701謝志偉"
                const match = tokens[0].match(/^(\d+)([\u4e00-\u9fa5]{2,5})$/);
                if (match) {
                    parsed.push({ class: match[1], name: match[2] });
                }
            }
        });
        return parsed;
    },

    saveAllowedStudents(list) {
        this.allowedStudents = list;
        localStorage.setItem('bebras_portal_allowed_students', JSON.stringify(list));
        this.renderRegisteredPreview();
    },

    importTextList(text) {
        if (!text) {
            alert("請先貼上文字名單！");
            return;
        }

        const parsed = this.parseOCRText(text);
        if (parsed.length > 0) {
            this.saveAllowedStudents(parsed);
            alert(`手動匯入成功！已註冊 ${parsed.length} 位學生。`);
            document.getElementById('admin-import-text').value = '';
        } else {
            alert("無法解析輸入文字，請確保每一行都包含「班級」與「姓名」，並以空格隔開。");
        }
    },

    importImageOCR(imageSrc) {
        const statusDiv = document.getElementById('ocr-loading-status');
        const uploadBtn = document.getElementById('btn-trigger-upload');
        
        if (statusDiv) statusDiv.style.display = 'inline-flex';
        if (uploadBtn) uploadBtn.disabled = true;

        Tesseract.recognize(
            imageSrc,
            'chi_tra+eng', // Traditional Chinese + English
            { 
                logger: m => {
                    console.log("OCR progress:", m);
                } 
            }
        ).then(({ data: { text } }) => {
            if (statusDiv) statusDiv.style.display = 'none';
            if (uploadBtn) uploadBtn.disabled = false;
            
            console.log("Extracted OCR Text:", text);
            const parsed = this.parseOCRText(text);
            
            if (parsed.length > 0) {
                this.saveAllowedStudents(parsed);
                alert(`圖檔辨識匯入成功！已自動註冊 ${parsed.length} 位學生名單！`);
            } else {
                alert("辨識結果中找不到清晰的「班級」與「姓名」欄位！請確認圖片品質，或改用手動貼上文字名單。");
            }
        }).catch(err => {
            if (statusDiv) statusDiv.style.display = 'none';
            if (uploadBtn) uploadBtn.disabled = false;
            console.error("OCR Error:", err);
            alert("辨識失敗！請檢查是否正確連接網路，或手動貼上名單。");
        });
    },

    renderRegisteredPreview() {
        const previewArea = document.getElementById('registered-preview-area');
        const countText = document.getElementById('registered-count-text');
        const listDiv = document.getElementById('registered-names-list');
        
        if (!previewArea || !countText || !listDiv) return;

        if (this.allowedStudents && this.allowedStudents.length > 0) {
            previewArea.style.display = 'block';
            countText.textContent = this.allowedStudents.length;
            
            listDiv.innerHTML = this.allowedStudents.map(s => {
                return `<span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08); white-space: nowrap;">[${s.class}] ${s.name}</span>`;
            }).join(' ');
        } else {
            previewArea.style.display = 'none';
        }
    },

    renderDashboard() {
        // Setup unlock states for selectors
        document.querySelectorAll('.diff-btn').forEach(btn => {
            const game = btn.dataset.game;
            const level = btn.dataset.level;
            
            // Check if this level is passed
            const isPassed = this.progress[game][level];
            
            // Easy is always unlocked. Others are unlocked if the previous level is passed.
            let isLocked = false;
            if (level === 'medium') {
                isLocked = !this.progress[game]['easy'];
            } else if (level === 'hard') {
                isLocked = !this.progress[game]['medium'];
            }

            btn.className = 'diff-btn'; // Reset classes
            if (isPassed) {
                btn.classList.add('passed');
            }
            if (isLocked) {
                btn.classList.add('locked');
                btn.textContent = level === 'medium' ? '中級 (鎖定) 🔒' : '高級 (鎖定) 🔒';
                btn.disabled = true;
            } else {
                btn.disabled = false;
                // Restore label
                if (game === 'stones') {
                    btn.innerHTML = level === 'easy' ? '初級 (9顆)' : level === 'medium' ? '中級 (15顆)' : '高級 (21顆)';
                } else if (game === 'shoes') {
                    btn.innerHTML = level === 'easy' ? '初級 (3x3)' : level === 'medium' ? '中級 (5x5)' : '高級 (7x7)';
                } else if (game === 'river') {
                    btn.innerHTML = level === 'easy' ? '初級' : level === 'medium' ? '中級 (2024題)' : '高級';
                } else if (game === 'chat') {
                    btn.innerHTML = level === 'easy' ? '初級 (4人)' : level === 'medium' ? '中級 (5人題)' : '高級 (7人)';
                } else if (game === 'taxi') {
                    btn.innerHTML = level === 'easy' ? '初級 (1岔路)' : level === 'medium' ? '中級 (Bebras題)' : '高級 (複雜迷宮)';
                } else if (game === 'aquaponics') {
                    btn.innerHTML = level === 'easy' ? '初級 (鋪管線)' : level === 'medium' ? '中級 (動力分流)' : '高級 (生態平衡)';
                }
                
                if (isPassed) btn.classList.add('passed');
            }

            // Click listener
            btn.onclick = () => {
                if (isLocked) return;
                this.startGame(game, level);
            };
        });
    },

    startGame(gameName, level) {
        Sound.play('click');
        this.currentGame = gameName;
        this.currentLevel = level;

        // Switch to game view
        this.switchView('game');

        // Update headers
        const gameTitles = {
            stones: '撿石頭',
            shoes: '買鞋子',
            river: '河道運輸',
            chat: '聊天順序',
            taxi: '自動駕駛的計程車',
            aquaponics: '魚菜共生生態圈'
        };
        const levelLabels = {
            easy: '初級',
            medium: '中級',
            hard: '高級'
        };

        document.getElementById('current-game-title').textContent = gameTitles[gameName];
        document.getElementById('current-game-level').textContent = levelLabels[level];
        document.getElementById('current-game-level').className = `badge ${level}`;

        // Reset explanation panel
        document.getElementById('ct-explanation-container').classList.add('hidden');

        // Load specific game logic
        const gameObj = this.getGameInstance(gameName);
        if (gameObj && typeof gameObj.init === 'function') {
            gameObj.init(level);
        }
    },

    getGameInstance(gameName) {
        switch (gameName) {
            case 'stones': return window.GameStones;
            case 'shoes': return window.GameShoes;
            case 'river': return window.GameRiver;
            case 'chat': return window.GameChat;
            case 'taxi': return window.GameTaxi;
            case 'aquaponics': return window.GameAquaponics;
        }
        return null;
    },

    completeLevel(gameName, level, ctExplanationHTML) {
        // Save state
        const wasPassed = this.progress[gameName][level];
        this.progress[gameName][level] = true;
        this.saveProgress();

        Sound.play('success');

        // Show explanation
        const explContainer = document.getElementById('ct-explanation-container');
        if (ctExplanationHTML) {
            document.getElementById('ct-explanation').innerHTML = ctExplanationHTML;
            explContainer.classList.remove('hidden');
        }

        // Show Modal
        const nextUnlocked = (level === 'easy' && !wasPassed) || (level === 'medium' && !wasPassed);
        const modalBtnNext = document.getElementById('modal-btn-next');
        
        if (level === 'hard') {
            modalBtnNext.style.display = 'none';
        } else {
            modalBtnNext.style.display = 'block';
            modalBtnNext.textContent = nextUnlocked ? "解鎖並挑戰下一關 🔓" : "進入下一關 ➡️";
        }

        this.showModal('🎉', "恭喜通關！", `你成功完成了《${document.getElementById('current-game-title').textContent}》${level === 'easy' ? '初級' : level === 'medium' ? '中級' : '高級'}挑戰。`);
    },

    failLevel(message) {
        Sound.play('fail');
        
        // Hide next button, only allow retry
        document.getElementById('modal-btn-next').style.display = 'none';
        
        this.showModal('❌', "挑戰失敗", message || "別氣餒！多想一下，你一定可以做到的。");
    },

    showModal(icon, title, desc) {
        document.getElementById('modal-icon').textContent = icon;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-desc').innerHTML = desc;
        document.getElementById('game-modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('game-modal').classList.remove('active');
    },

    loadNextLevel() {
        if (this.currentLevel === 'easy') {
            this.startGame(this.currentGame, 'medium');
        } else if (this.currentLevel === 'medium') {
            this.startGame(this.currentGame, 'hard');
        }
    },

    retryLevel() {
        const gameObj = this.getGameInstance(this.currentGame);
        if (gameObj && typeof gameObj.init === 'function') {
            gameObj.init(this.currentLevel);
        }
    }
};

// Initial start on DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
