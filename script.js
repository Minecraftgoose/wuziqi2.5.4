document.addEventListener('DOMContentLoaded', function() {
    const GameMode = {
        PVP: 'pvp'
    };
    
    const gameState = {
        board: [],
        size: 19,
        currentPlayer: 'black',
        gameActive: false,
        moveHistory: [],
        aiLevel: 3,
        aiThinking: false,
        currentBackground: 'traditional',
        customBackground: null,
        gameMode: null,
        deepseekApiKey: null
    };
    
    const mainMenu = document.getElementById('mainMenu');
    const gameContainer = document.getElementById('gameContainer');
    const pvpMode = document.getElementById('pvpMode');
    const backToMenu = document.getElementById('backToMenu');
    const settingsButton = document.getElementById('settingsButton');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const loadingScreen = document.getElementById('loadingScreen');
    const gameNotification = document.getElementById('gameNotification');
    const closeNotification = document.getElementById('closeNotification');
    const goBoard = document.getElementById('goBoard');
    const boardSizeSelect = document.getElementById('boardSize');
    const aiLevelSelect = document.getElementById('aiLevel');
    const gameStatus = document.getElementById('gameStatus');
    const backgroundOptions = document.getElementById('backgroundOptions');
    const customBackgroundUpload = document.getElementById('customBackgroundUpload');
    const backgroundFileInput = document.getElementById('backgroundFileInput');
    const removeCustomBackground = document.getElementById('removeCustomBackground');
    const deepseekApiKeyInput = document.getElementById('deepseekApiKey');
    const donateButton = document.getElementById('donateButton');
    const donateModal = document.getElementById('donateModal');
    const closeDonateModal = document.getElementById('closeDonateModal');
    const qrcodeImage = document.getElementById('qrcodeImage');
    const qrcodePlaceholder = document.getElementById('qrcodePlaceholder');
    
    settingsButton.addEventListener('click', function() {
        settingsDropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', function(event) {
        if (!settingsButton.contains(event.target) && !settingsDropdown.contains(event.target)) {
            settingsDropdown.classList.remove('active');
        }
    });
    
    donateButton.addEventListener('click', showDonateModal);
    
    closeDonateModal.addEventListener('click', hideDonateModal);
    
    donateModal.addEventListener('click', function(event) {
        if (event.target === donateModal) {
            hideDonateModal();
        }
    });
    
    setTimeout(() => {
        if (loadingScreen.style.display !== 'none') {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                gameNotification.style.display = 'flex';
            }, 500);
        }
    }, 2000);
    
    const notificationTabs = document.querySelectorAll('.notification-tab');
    notificationTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            notificationTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.notification-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            document.getElementById(`${tabId}Panel`).classList.add('active');
        });
    });
    
    closeNotification.addEventListener('click', () => {
        gameNotification.style.display = 'none';
        mainMenu.classList.remove('hidden');
    });
    
    pvpMode.addEventListener('click', () => {
        selectGameMode(GameMode.PVP);
    });
    
    backToMenu.addEventListener('click', returnToMainMenu);
    
    gameStatus.addEventListener('click', function() {
        if (gameState.gameMode === GameMode.PVP && !gameState.gameActive) {
            startNewGame();
        }
    });
    
    deepseekApiKeyInput.addEventListener('input', function() {
        gameState.deepseekApiKey = this.value.trim();
        if (gameState.deepseekApiKey) {
            localStorage.setItem('gooseGoDeepseekApiKey', gameState.deepseekApiKey);
        }
    });
    
    function loadApiKey() {
        const savedKey = localStorage.getItem('gooseGoDeepseekApiKey');
        if (savedKey) {
            gameState.deepseekApiKey = savedKey;
            deepseekApiKeyInput.value = savedKey;
        }
    }
    
    function selectGameMode(mode) {
        gameState.gameMode = mode;
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        const size = parseInt(boardSizeSelect.value);
        initializeBoard(size);
        
        gameState.gameActive = false;
        gameStatus.textContent = '开始新游戏';
        backToMenu.style.display = 'flex';
    }
    
    function returnToMainMenu() {
        gameState.gameActive = false;
        gameState.currentPlayer = 'black';
        
        gameContainer.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        backToMenu.style.display = 'none';
        gameStatus.textContent = '选择游戏模式';
        
        goBoard.innerHTML = '';
    }
    
    boardSizeSelect.addEventListener('change', function() {
        const size = parseInt(this.value);
        initializeBoard(size);
        gameState.gameActive = false;
        gameStatus.textContent = '开始新游戏';
    });
    
    aiLevelSelect.addEventListener('change', function() {
        gameState.aiLevel = parseInt(this.value);
        
        if (gameState.gameActive) {
            startNewGame();
        }
    });
    
    const backgroundPresets = [
        { id: 'traditional', name: '传统木质', color: '#e6c88c' },
        { id: 'dark-wood', name: '深色木质', color: '#8b4513' },
        { id: 'bamboo', name: '竹纹', color: '#8fbc8f' },
        { id: 'stone', name: '石纹', color: '#a9a9a9' },
        { id: 'paper', name: '宣纸', color: '#f5f5dc' }
    ];
    
    function initializeBackgroundSelector() {
        backgroundOptions.innerHTML = '';
        
        backgroundPresets.forEach(preset => {
            const option = document.createElement('div');
            option.className = 'background-option';
            option.dataset.id = preset.id;
            option.title = preset.name;
            
            option.innerHTML = `<div class="background-color" style="background-color: ${preset.color};"></div>`;
            
            option.addEventListener('click', () => {
                selectBackground(preset.id);
            });
            
            backgroundOptions.appendChild(option);
        });
        
        selectBackground('traditional');
    }
    
    function selectBackground(backgroundId) {
        gameState.currentBackground = backgroundId;
        
        document.querySelectorAll('.background-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.id === backgroundId) {
                option.classList.add('active');
            }
        });
        
        applyBackground(backgroundId);
        localStorage.setItem('gooseGoBackground', backgroundId);
    }
    
    function applyBackground(backgroundId) {
        const root = document.documentElement;
        
        if (backgroundId === 'custom') {
            if (gameState.customBackground) {
                root.style.setProperty('--board-bg', `url("${gameState.customBackground}")`);
            }
        } else {
            const preset = backgroundPresets.find(p => p.id === backgroundId);
            if (preset) {
                root.style.setProperty('--board-bg', preset.color);
            }
        }
        
        if (backgroundId !== 'custom') {
            removeCustomBackground.style.display = 'none';
        }
    }
    
    customBackgroundUpload.addEventListener('click', () => {
        backgroundFileInput.click();
    });
    
    backgroundFileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                gameState.customBackground = e.target.result;
                
                let customOption = document.querySelector('.background-option[data-id="custom"]');
                if (!customOption) {
                    customOption = document.createElement('div');
                    customOption.className = 'background-option';
                    customOption.dataset.id = 'custom';
                    customOption.title = '自定义背景';
                    customOption.innerHTML = `<div class="background-pattern" style="background-image: url('${gameState.customBackground}');"></div>`;
                    customOption.addEventListener('click', () => {
                        selectBackground('custom');
                    });
                    backgroundOptions.appendChild(customOption);
                } else {
                    customOption.querySelector('.background-pattern').style.backgroundImage = `url('${gameState.customBackground}')`;
                }
                
                selectBackground('custom');
                removeCustomBackground.style.display = 'block';
                localStorage.setItem('gooseGoCustomBackground', gameState.customBackground);
            };
            reader.readAsDataURL(file);
        }
    });
    
    removeCustomBackground.addEventListener('click', () => {
        const customOption = document.querySelector('.background-option[data-id="custom"]');
        if (customOption) {
            customOption.remove();
        }
        
        gameState.customBackground = null;
        removeCustomBackground.style.display = 'none';
        selectBackground('traditional');
        localStorage.removeItem('gooseGoCustomBackground');
    });
    
    function loadBackgroundSettings() {
        const savedBackground = localStorage.getItem('gooseGoBackground');
        const savedCustomBackground = localStorage.getItem('gooseGoCustomBackground');
        
        if (savedCustomBackground) {
            gameState.customBackground = savedCustomBackground;
            
            const customOption = document.createElement('div');
            customOption.className = 'background-option';
            customOption.dataset.id = 'custom';
            customOption.title = '自定义背景';
            customOption.innerHTML = `<div class="background-pattern" style="background-image: url('${savedCustomBackground}');"></div>`;
            customOption.addEventListener('click', () => {
                selectBackground('custom');
            });
            backgroundOptions.appendChild(customOption);
            
            removeCustomBackground.style.display = 'block';
        }
        
        if (savedBackground) {
            selectBackground(savedBackground);
        }
    }
    
    function ensureBoardSquare() {
        const boardContainer = document.querySelector('.board-container');
        if (boardContainer) {
            const containerWidth = boardContainer.clientWidth;
            boardContainer.style.height = `${containerWidth}px`;
        }
    }
    
    window.addEventListener('resize', ensureBoardSquare);
    
    function initializeBoard(size) {
        goBoard.innerHTML = '';
        goBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        goBoard.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        
        gameState.board = Array(size).fill().map(() => Array(size).fill(null));
        gameState.size = size;
        gameState.moveHistory = [];
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const intersection = document.createElement('div'); 
                intersection.className = 'intersection';
                intersection.dataset.row = i;
                intersection.dataset.col = j;
                
                if ((size === 19 && (
                        (i === 3 && j === 3) || (i === 3 && j === 9) || (i === 3 && j === 15) ||
                        (i === 9 && j === 3) || (i === 9 && j === 9) || (i === 9 && j === 15) ||
                        (i === 15 && j === 3) || (i === 15 && j === 9) || (i === 15 && j === 15)
                    )) || 
                    (size === 13 && (
                        (i === 3 && j === 3) || (i === 3 && j === 9) ||
                        (i === 6 && j === 6) ||
                        (i === 9 && j === 3) || (i === 9 && j === 9)
                    )) || 
                    (size === 9 && (
                        (i === 2 && j === 2) || (i === 2 && j === 6) ||
                        (i === 4 && j === 4) ||
                        (i === 6 && j === 2) || (i === 6 && j === 6)
                    ))) {
                    const starPoint = document.createElement('div'); 
                    starPoint.className = 'star-point';
                    intersection.appendChild(starPoint); 
                }
                
                intersection.addEventListener('click', handleMove);
                goBoard.appendChild(intersection); 
            }
        }
        
        setTimeout(ensureBoardSquare, 100);
    }
    
    function getPositionValue(row, col, size) {
        const center = size / 2;
        const rowValue = 1 - Math.abs(row - center) / center;
        const colValue = 1 - Math.abs(col - center) / center;
        return (rowValue + colValue) * 50;
    }
    
    function analyzePattern(row, col, color, dir1, dir2, level) {
        let sequenceLength = 0;
        let openEnds = 0;
        const opponent = color === 'black' ? 'white' : 'black';
        const size = gameState.size;
        
        let blocked = false;
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dir1[0] * i;
            const newCol = col + dir1[1] * i;
            if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
                if (!blocked && i === 1) openEnds++;
                break;
            }
            if (gameState.board[newRow][newCol] === opponent) {
                if (!blocked && i === 1) openEnds++;
                break;
            }
            if (gameState.board[newRow][newCol] === color) {
                sequenceLength++;
            } else {
                if (i === 1) openEnds++;
                break;
            }
        }
        
        blocked = false;
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dir2[0] * i;
            const newCol = col + dir2[1] * i;
            if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
                if (!blocked && i === 1) openEnds++;
                break;
            }
            if (gameState.board[newRow][newCol] === opponent) {
                if (!blocked && i === 1) openEnds++;
                break;
            }
            if (gameState.board[newRow][newCol] === color) {
                sequenceLength++;
            } else {
                if (i === 1) openEnds++;
                break;
            }
        }
        
        sequenceLength += 1;
        
        let score = 0;
        if (sequenceLength >= 5) {
            score = 10000;
        } else if (sequenceLength === 4) {
            if (openEnds >= 2) score = 1000;
            else if (openEnds === 1) score = 500;
        } else if (sequenceLength === 3) {
            if (openEnds >= 2) score = 200;
            else if (openEnds === 1) score = 100;
        } else if (sequenceLength === 2) {
            if (openEnds >= 2) score = 50;
            else if (openEnds === 1) score = 20;
        }
        
        if (level >= 5) {
            score *= 1.2;
        }
        
        return { score, sequenceLength, openEnds };
    }
    
    function evaluatePositionEnhanced(row, col, color, level) {
        let score = 0;
        const opponent = color === 'black' ? 'white' : 'black';
        
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        for (const [dir1, dir2] of directions) {
            const pattern = analyzePattern(row, col, color, dir1, dir2, level);
            score += pattern.score;
            
            if (level >= 4) {
                if (pattern.sequenceLength >= 4 && pattern.openEnds >= 1) {
                    score += 100;
                } else if (pattern.sequenceLength >= 3 && pattern.openEnds >= 2) {
                    score += 50;
                } else if (pattern.sequenceLength >= 2 && pattern.openEnds >= 2) {
                    score += 20;
                }
            }
        }
        
        const center = gameState.size / 2;
        const distanceFromCenter = Math.sqrt(Math.pow(row - center, 2) + Math.pow(col - center, 2));
        score += (gameState.size - distanceFromCenter) * (level * 0.3);
        
        let adjacencyScore = 0;
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < gameState.size && newCol >= 0 && newCol < gameState.size) {
                    if (gameState.board[newRow][newCol] === opponent) {
                        const distance = Math.max(Math.abs(dr), Math.abs(dc));
                        adjacencyScore += (3 - distance) * 30;
                    }
                }
            }
        }
        score += adjacencyScore;
        
        let intrusionScore = 0;
        for (const [dir1, dir2] of directions) {
            const checkDir = (dr, dc) => {
                const r1 = row + dr;
                const c1 = col + dc;
                const r2 = row - dr;
                const c2 = col - dc;
                if (r1 >= 0 && r1 < gameState.size && c1 >= 0 && c1 < gameState.size &&
                    r2 >= 0 && r2 < gameState.size && c2 >= 0 && c2 < gameState.size) {
                    if (gameState.board[r1][c1] === opponent && gameState.board[r2][c2] === opponent) {
                        return 150;
                    }
                    if ((gameState.board[r1][c1] === opponent && gameState.board[r2][c2] === null) ||
                        (gameState.board[r1][c1] === null && gameState.board[r2][c2] === opponent)) {
                        return 80;
                    }
                }
                return 0;
            };
            intrusionScore += checkDir(dir1[0], dir1[1]);
        }
        score += intrusionScore;
        
        let potentialScore = 0;
        gameState.board[row][col] = color;
        for (const [dir1, dir2] of directions) {
            const pattern = analyzePattern(row, col, color, dir1, dir2, level);
            if (pattern.sequenceLength >= 2 && pattern.openEnds >= 1) {
                potentialScore += pattern.sequenceLength * 25;
            }
        }
        gameState.board[row][col] = null;
        score += potentialScore;
        
        return score;
    }
    
    function evaluateDefense(row, col, opponentColor, level) {
        let defenseScore = 0;
        const playerColor = opponentColor === 'black' ? 'white' : 'black';
        
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        gameState.board[row][col] = opponentColor;
        
        for (const [dir1, dir2] of directions) {
            const pattern = analyzePattern(row, col, opponentColor, dir1, dir2, level);
            
            if (pattern.sequenceLength >= 4) {
                defenseScore += 5000;
            } else if (pattern.sequenceLength === 3) {
                if (pattern.openEnds >= 2) {
                    defenseScore += 3000;
                } else if (pattern.openEnds === 1) {
                    defenseScore += 800;
                }
            } else if (pattern.sequenceLength === 2 && pattern.openEnds >= 2) {
                defenseScore += 200;
            }
            
            gameState.board[row][col] = playerColor;
            const myPattern = analyzePattern(row, col, playerColor, dir1, dir2, level);
            gameState.board[row][col] = opponentColor;
            
            if (myPattern.sequenceLength >= 3 && myPattern.openEnds >= 1) {
                defenseScore += 600;
            }
        }
        
        gameState.board[row][col] = null;
        
        const defenseMultiplier = [1.0, 1.1, 1.3, 1.6, 2.0, 2.5][gameState.aiLevel-1] || 1.3;
        return defenseScore * defenseMultiplier;
    }
    
    function boardToText() {
        const size = gameState.size;
        let boardText = `棋盘大小: ${size}x${size}\n`;
        boardText += "当前棋盘状态 (B=黑棋, W=白棋, .=空):\n";
        
        for (let row = 0; row < size; row++) {
            let rowText = "";
            for (let col = 0; col < size; col++) {
                if (gameState.board[row][col] === 'black') {
                    rowText += 'B ';
                } else if (gameState.board[row][col] === 'white') {
                    rowText += 'W ';
                } else {
                    rowText += '. ';
                }
            }
            boardText += `${row.toString().padStart(2, '0')}: ${rowText}\n`;
        }
        
        boardText += "\n列坐标: ";
        for (let col = 0; col < size; col++) {
            boardText += `${col.toString().padStart(2, '0')} `;
        }
        
        return boardText;
    }
    
    async function callDeepSeekAPI(color) {
        if (!gameState.deepseekApiKey) {
            throw new Error("请先输入DeepSeek API密钥");
        }
        
        const size = gameState.size;
        const boardText = boardToText();
        const currentPlayer = color === 'black' ? '黑棋(B)' : '白棋(W)';
        
        const messages = [
            {
                role: "system",
                content: "你是一个五子棋AI专家。请分析当前棋盘状态，并给出最佳落子位置。请直接返回JSON格式：{\"row\": 数字, \"col\": 数字}，不要有其他内容。"
            },
            {
                role: "user",
                content: `五子棋游戏规则：在${size}x${size}的棋盘上，黑棋和白棋轮流落子。先将五个或更多棋子连成一条直线（横、竖、斜）的一方获胜。

${boardText}

当前轮到${currentPlayer}落子。

请直接以JSON格式返回推荐落子位置：{"row": 数字, "col": 数字}
- row和col都是从0开始的整数
- 确保位置是有效的空位
- 坐标范围是 0-${size-1}

只返回JSON，不要有其他内容。`
            }
        ];
        
        try {
            gameStatus.textContent = 'DeepSeek AI正在思考...';
            
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${gameState.deepseekApiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    max_tokens: 100,
                    temperature: 0.1
                })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            const cleanedContent = content.trim();
            let jsonStr = cleanedContent;
            
            if (cleanedContent.includes('```')) {
                const match = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (match) {
                    jsonStr = match[1];
                }
            }
            
            const moveData = JSON.parse(jsonStr);
            
            if (typeof moveData.row !== 'number' || typeof moveData.col !== 'number') {
                throw new Error("返回的JSON格式不正确");
            }
            
            if (moveData.row < 0 || moveData.row >= size || 
                moveData.col < 0 || moveData.col >= size) {
                throw new Error(`落子位置超出棋盘范围: (${moveData.row}, ${moveData.col})`);
            }
            
            if (gameState.board[moveData.row][moveData.col] !== null) {
                throw new Error(`位置已有棋子: (${moveData.row}, ${moveData.col})`);
            }
            
            return { row: moveData.row, col: moveData.col };
            
        } catch (error) {
            console.error('DeepSeek API调用失败:', error);
            throw error;
        }
    }
    
    function handleMove(event) {
        if (!gameState.gameActive || gameState.aiThinking) return;
        
        const row = parseInt(event.currentTarget.dataset.row); 
        const col = parseInt(event.currentTarget.dataset.col); 
        
        if (gameState.board[row][col] !== null) return;
        
        placeStone(row, col, 'black');
        
        if (checkGameEnd(row, col, 'black')) {
            return;
        }
        
        gameState.aiThinking = true;
        gameStatus.textContent = 'AI正在思考...';
        
        setTimeout(async () => {
            try {
                await makeAIMove('white');
            } catch (error) {
                console.error('AI落子失败:', error);
                gameStatus.textContent = 'AI思考失败，使用本地AI...';
                setTimeout(() => {
                    const originalLevel = gameState.aiLevel;
                    gameState.aiLevel = 3;
                    makeLocalAIMove('white');
                    gameState.aiLevel = originalLevel;
                }, 1000);
            } finally {
                gameState.aiThinking = false;
            }
        }, 500);
    }

    function placeStone(row, col, color) {
        gameState.board[row][col] = color;
        gameState.moveHistory.push({row, col, color});
        
        const intersection = document.querySelector(`.intersection[data-row="${row}"][data-col="${col}"]`);
        const stone = document.createElement('div');
        stone.className = `stone ${color}-stone`;
        intersection.appendChild(stone);
        
        gameStatus.textContent = color === 'black' ? '白棋回合' : '黑棋回合';
    }
    
    async function makeAIMove(color = 'white') {
        if (gameState.aiLevel === 7) {
            try {
                const move = await callDeepSeekAPI(color);
                placeStone(move.row, move.col, color);
                
                if (checkGameEnd(move.row, move.col, color)) {
                    return;
                }
            } catch (error) {
                console.error('DeepSeek API失败，使用本地AI:', error);
                gameStatus.textContent = 'DeepSeek API失败，使用本地AI...';
                setTimeout(() => {
                    makeLocalAIMove(color);
                }, 1000);
            }
        } else {
            makeLocalAIMove(color);
        }
    }
    
    function makeLocalAIMove(color = 'white') {
        const size = gameState.size;
        
        if (color === 'black' && gameState.moveHistory.length < 4) {
            const center = Math.floor(size / 2);
            
            if (gameState.moveHistory.length === 0) {
                if (gameState.board[center][center] === null) {
                    placeStone(center, center, color);
                    return;
                }
            }
            
            const openingPattern = [
                [center, center],
                [center+1, center],
                [center-1, center+1]
            ];
            
            let match = true;
            for (let i = 0; i < gameState.moveHistory.length; i++) {
                const histMove = gameState.moveHistory[i];
                const patternMove = openingPattern[i];
                if (Math.abs(histMove.row - patternMove[0]) > 1 || 
                    Math.abs(histMove.col - patternMove[1]) > 1) {
                    match = false;
                    break;
                }
            }
            
            if (match && gameState.moveHistory.length < openingPattern.length) {
                const nextMove = openingPattern[gameState.moveHistory.length];
                if (gameState.board[nextMove[0]] && gameState.board[nextMove[0]][nextMove[1]] === null) {
                    placeStone(nextMove[0], nextMove[1], color);
                    return;
                }
            }
        }
        
        let bestScore = -Infinity;
        let bestMove = null;
        let candidateMoves = [];
        
        const aiLevel = gameState.aiLevel;
        const searchParams = {
            1: { depth: 1, randomFactor: 20, evaluateRange: 1 },
            2: { depth: 1, randomFactor: 15, evaluateRange: 2 },
            3: { depth: 2, randomFactor: 10, evaluateRange: 2 },
            4: { depth: 2, randomFactor: 5, evaluateRange: 3 },
            5: { depth: 3, randomFactor: 3, evaluateRange: 3 },
            6: { depth: 4, randomFactor: 0, evaluateRange: 3 }
        };
        
        const params = searchParams[aiLevel] || searchParams[3];
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (gameState.board[row][col] !== null) {
                    for (let dr = -params.evaluateRange; dr <= params.evaluateRange; dr++) {
                        for (let dc = -params.evaluateRange; dc <= params.evaluateRange; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                                if (gameState.board[newRow][newCol] === null) {
                                    const existing = candidateMoves.find(m => m.row === newRow && m.col === newCol);
                                    if (!existing) {
                                        candidateMoves.push({row: newRow, col: newCol});
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (candidateMoves.length === 0) {
            const center = Math.floor(size / 2);
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    const newRow = center + dr;
                    const newCol = center + dc;
                    if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                        candidateMoves.push({row: newRow, col: newCol});
                    }
                }
            }
        }
        
        for (const move of candidateMoves) {
            const {row, col} = move;
            
            let score = evaluatePositionEnhanced(row, col, color, aiLevel);
            
            const opponentColor = color === 'white' ? 'black' : 'white';
            const defenseScore = evaluateDefense(row, col, opponentColor, aiLevel);
            score += defenseScore * (aiLevel >= 4 ? 1.5 : 1.2);
            
            if (aiLevel >= 3 && params.depth > 1) {
                gameState.board[row][col] = color;
                const futureScore = evaluateFuture(row, col, color, params.depth - 1);
                gameState.board[row][col] = null;
                score += futureScore * 0.3;
            }
            
            score += getPositionValue(row, col, size) * (aiLevel / 2);
            
            const randomness = Math.random() * params.randomFactor;
            score += randomness;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = {row, col};
            }
        }
        
        if (bestMove) {
            const {row, col} = bestMove;
            placeStone(row, col, color);
            
            if (checkGameEnd(row, col, color)) {
                return;
            }
        } else {
            const emptyPositions = [];
            for (let row = 0; row < size; row++) {
                for (let col = 0; col < size; col++) {
                    if (gameState.board[row][col] === null) {
                        emptyPositions.push({row, col});
                    }
                }
            }
            if (emptyPositions.length > 0) {
                const randomMove = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
                placeStone(randomMove.row, randomMove.col, color);
                
                if (checkGameEnd(randomMove.row, randomMove.col, color)) {
                    return;
                }
            }
        }
    }
    
    function evaluateFuture(row, col, color, depth) {
        if (depth <= 0) return 0;
        
        let futureScore = 0;
        const size = gameState.size;
        const opponent = color === 'black' ? 'white' : 'black';
        
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                    if (gameState.board[newRow][newCol] === null) {
                        gameState.board[newRow][newCol] = opponent;
                        const threatScore = evaluatePositionEnhanced(newRow, newCol, opponent, 3);
                        gameState.board[newRow][newCol] = null;
                        futureScore -= threatScore * 0.1;
                    }
                }
            }
        }
        
        return futureScore;
    }
    
    function checkWin(row, col, color) {
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        for (const [dir1, dir2] of directions) {
            let count = 1;
            
            for (let i = 1; i <= 4; i++) {
                const newRow = row + dir1[0] * i;
                const newCol = col + dir1[1] * i;
                if (newRow < 0 || newRow >= gameState.size || newCol < 0 || newCol >= gameState.size) break;
                if (gameState.board[newRow][newCol] !== color) break;
                count++;
            }
            
            for (let i = 1; i <= 4; i++) {
                const newRow = row + dir2[0] * i;
                const newCol = col + dir2[1] * i;
                if (newRow < 0 || newRow >= gameState.size || newCol < 0 || newCol >= gameState.size) break;
                if (gameState.board[newRow][newCol] !== color) break;
                count++;
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }
    
    function isBoardFull() {
        for (let row = 0; row < gameState.size; row++) {
            for (let col = 0; col < gameState.size; col++) {
                if (gameState.board[row][col] === null) {
                    return false;
                }
            }
        }
        return true;
    }
    
    function showVictoryMessage(message) {
        const victoryMsg = document.createElement('div');
        victoryMsg.className = 'victory-message';
        victoryMsg.textContent = message;
        document.body.appendChild(victoryMsg);
        
        setTimeout(() => {
            victoryMsg.remove();
            gameStatus.textContent = '开始新游戏';
            gameState.gameActive = false;
        }, 1500);
    }
    
    function showDrawMessage() {
        const drawMsg = document.createElement('div');
        drawMsg.className = 'draw-message';
        drawMsg.textContent = '平局！';
        document.body.appendChild(drawMsg);
        
        setTimeout(() => {
            drawMsg.remove();
            gameStatus.textContent = '开始新游戏';
            gameState.gameActive = false;
        }, 1500);
    }
    
    function checkGameEnd(row, col, color) {
        if (checkWin(row, col, color)) {
            let message = '';
            message = color === 'black' ? '你赢了！' : (gameState.aiLevel === 7 ? 'DeepSeek AI胜利！' : 'AI胜利！');
            showVictoryMessage(message);
            
            return true;
        }
        
        if (isBoardFull()) {
            showDrawMessage();
            
            return true;
        }
        
        return false;
    }
    
    function startNewGame() {
        const size = parseInt(boardSizeSelect.value);
        initializeBoard(size);
        gameState.gameActive = true;
        gameState.currentPlayer = 'black';
        gameState.aiLevel = parseInt(aiLevelSelect.value);
        
        gameStatus.textContent = '黑棋回合';
    }
    
    function showDonateModal() {
        donateModal.classList.add('active');
        
        const img = new Image();
        img.onload = function() {
            qrcodeImage.src = 'donate.png';
            qrcodeImage.classList.add('loaded');
            qrcodePlaceholder.style.display = 'none';
        };
        img.onerror = function() {
            qrcodeImage.style.display = 'none';
            qrcodePlaceholder.style.display = 'flex';
        };
        img.src = 'donate.png';
    }
    
    function hideDonateModal() {
        donateModal.classList.remove('active');
    }
    
    backToMenu.style.display = 'none';
    initializeBackgroundSelector();
    loadBackgroundSettings();
    loadApiKey();
    
    const preloadDonateImage = new Image();
    preloadDonateImage.src = 'donate.png';
});