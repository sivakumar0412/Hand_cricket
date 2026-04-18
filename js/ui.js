// UI Management Module
const UIManager = {
    currentScreen: 'menuScreen',

    init() {
        this.setupEventListeners();
        this.applyTheme();
    },

    setupEventListeners() {
        // Menu Screen
        document.getElementById('singlePlayerBtn').addEventListener('click', () => this.showScreen('setupScreen'));
        document.getElementById('multiplayerBtn').addEventListener('click', () => this.showScreen('multiplayerSetupScreen'));
        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            this.showScreen('leaderboardScreen');
            this.displayLeaderboard();
        });

        // Setup Screen
        document.getElementById('startSingleBtn').addEventListener('click', () => this.startSinglePlayerGame());
        document.getElementById('backFromSetupBtn').addEventListener('click', () => this.showScreen('menuScreen'));

        // Multiplayer Setup
        document.getElementById('createGameBtn').addEventListener('click', () => this.createMultiplayerGame());
        document.getElementById('joinGameBtn').addEventListener('click', () => this.joinMultiplayerGame());
        document.getElementById('backFromMultiplayerBtn').addEventListener('click', () => this.showScreen('menuScreen'));

        // Toss Screen
        document.getElementById('oddBtn').addEventListener('click', () => this.handleToss('odd'));
        document.getElementById('evenBtn').addEventListener('click', () => this.handleToss('even'));

        // Game Screen
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNumberClick(e.target.dataset.number));
        });

        document.getElementById('soundToggle').addEventListener('click', () => SoundManager.toggleSound());

        // Result Screen
        document.getElementById('playAgainBtn').addEventListener('click', () => this.showScreen('menuScreen'));
        document.getElementById('homeBtn').addEventListener('click', () => this.showScreen('menuScreen'));

        // Leaderboard
        document.getElementById('backFromLeaderboardBtn').addEventListener('click', () => this.showScreen('menuScreen'));
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterLeaderboard(e.target.dataset.filter));
        });

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Waiting Screen
        document.getElementById('copyCodeBtn').addEventListener('click', () => this.copyGameCode());
        document.getElementById('cancelWaitBtn').addEventListener('click', () => this.showScreen('menuScreen'));
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    },

    startSinglePlayerGame() {
        const playerName = document.getElementById('playerName').value || 'Player';
        const difficulty = document.getElementById('difficulty').value;

        GameLogic.init('single', [
            { name: playerName, type: 'human' },
            { name: 'Computer', type: 'ai' }
        ], difficulty);

        this.showScreen('tossScreen');
    },

    createMultiplayerGame() {
        const hostName = document.getElementById('hostName').value || 'Host';
        const gameCode = this.generateGameCode();

        // Store game in localStorage
        const gameData = {
            gameCode,
            host: hostName,
            hostReady: false,
            guest: null,
            guestReady: false,
            createdAt: Date.now(),
        };

        StorageManager.saveMultiplayerGame(gameCode, gameData);
        
        document.getElementById('displayGameCode').textContent = gameCode;
        this.showScreen('waitingScreen');

        // Poll for opponent
        this.pollForOpponent(gameCode);
    },

    joinMultiplayerGame() {
        const guestName = document.getElementById('guestName').value || 'Guest';
        const gameCode = document.getElementById('gameCode').value;

        if (!gameCode || gameCode.length !== 4) {
            alert('Please enter a valid 4-digit game code');
            return;
        }

        const gameData = StorageManager.getMultiplayerGame(gameCode);
        if (!gameData) {
            alert('Game code not found. Please check and try again.');
            return;
        }

        gameData.guest = guestName;
        gameData.guestReady = true;
        StorageManager.saveMultiplayerGame(gameCode, gameData);

        GameLogic.init('multiplayer', [
            { name: gameData.host, type: 'human' },
            { name: guestName, type: 'human' }
        ]);

        this.showScreen('tossScreen');
    },

    pollForOpponent(gameCode) {
        const pollInterval = setInterval(() => {
            const gameData = StorageManager.getMultiplayerGame(gameCode);
            
            if (gameData && gameData.guest) {
                clearInterval(pollInterval);
                
                GameLogic.init('multiplayer', [
                    { name: gameData.host, type: 'human' },
                    { name: gameData.guest, type: 'human' }
                ]);

                this.showScreen('tossScreen');
            }
        }, 1000);

        // Timeout after 2 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            alert('Game creation timeout. Returning to menu.');
            this.showScreen('menuScreen');
        }, 120000);
    },

    generateGameCode() {
        return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    },

    handleToss(choice) {
        const result = TossLogic.performToss(choice);
        const resultDiv = document.getElementById('tossResult');
        
        const tossIcon = result.coinFlip === 'odd' ? '🎲' : '💰';
        const resultText = result.playerWins ? '✅ You Won the Toss!' : '❌ You Lost the Toss!';
        const sideText = `You chose to ${result.chosenSide.toUpperCase()}`;

        resultDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">${tossIcon}</div>
            <div style="font-size: 24px; font-weight: bold; color: ${result.playerWins ? '#2e7d32' : '#c62828'};">
                ${resultText}
            </div>
            <div style="margin-top: 15px;">${sideText}</div>
        `;

        setTimeout(() => {
            this.showScreen('gameScreen');
            this.startGame();
        }, 2000);
    },

    startGame() {
        this.updateScoreboard();
        this.updateGameStatus();
    },

    handleNumberClick(number) {
        number = parseInt(number);
        const result = GameLogic.playBall(number);

        if (result) {
            this.updateGameUI(result);

            if (result.inningsEnded) {
                setTimeout(() => {
                    if (GameLogic.state.currentInning === 1) {
                        GameLogic.switchInnings();
                        this.updateScoreboard();
                        this.updateGameStatus();
                    } else {
                        this.endGame();
                    }
                }, 1000);
            }
        }
    },

    updateGameUI(ballResult) {
        this.addToPlaysList(ballResult);
        this.updateScoreboard();
        this.updateGameStatus(ballResult);
    },

    addToPlaysList(ballResult) {
        const playsList = document.getElementById('playsList');
        const playItem = document.createElement('div');
        playItem.className = `play-item ${ballResult.isOut ? 'out' : 'run'}`;
        playItem.textContent = ballResult.isOut ? 'OUT' : ballResult.playerChoice;
        playsList.insertBefore(playItem, playsList.firstChild);

        // Keep only last 12 plays visible
        while (playsList.children.length > 12) {
            playsList.removeChild(playsList.lastChild);
        }
    },

    updateScoreboard() {
        const state = GameLogic.state;
        
        document.getElementById('player1Name').textContent = state.players[0].name;
        document.getElementById('player1Score').textContent = state.scores[0];
        document.getElementById('player1Wickets').textContent = `${state.wickets[0]} / ${state.maxWickets}`;

        document.getElementById('player2Name').textContent = state.players[1].name;
        document.getElementById('player2Score').textContent = state.scores[1];
        document.getElementById('player2Wickets').textContent = `${state.wickets[1]} / ${state.maxWickets}`;

        document.getElementById('inningInfo').textContent = `Inning ${state.currentInning}`;
        document.getElementById('oversInfo').textContent = `${state.overs[state.currentBatter]} / 6`;
    },

    updateGameStatus(ballResult = null) {
        const statusDiv = document.getElementById('gameStatus');
        const state = GameLogic.state;
        const batter = state.players[state.currentBatter].name;
        const bowler = state.players[state.currentBowler].name;

        if (ballResult) {
            if (ballResult.isOut) {
                statusDiv.textContent = `OUT! ${batter} is out. ${bowler} got a wicket!`;
            } else {
                statusDiv.textContent = `${ballResult.playerChoice} runs! ${batter} continues batting.`;
            }
        } else {
            statusDiv.textContent = `${batter} is batting. ${bowler} is bowling. Choose a number!`;
        }
    },

    endGame() {
        GameLogic.state.matchStarted = false;
        const result = GameLogic.getResult();
        const stats = GameLogic.getGameStats();

        // Save to leaderboard
        StorageManager.saveMatchResult({
            winners: [result.winner],
            scores: stats.player1.score + ' - ' + stats.player2.score,
            date: new Date().toLocaleDateString(),
            duration: stats.duration,
        });

        this.displayResult(result, stats);
        this.showScreen('resultScreen');
    },

    displayResult(result, stats) {
        const statusDiv = document.getElementById('resultStatus');
        const winnerDiv = document.getElementById('winnerName');
        const scoreDiv = document.getElementById('finalScore');
        const durationDiv = document.getElementById('matchDuration');
        const statsDiv = document.getElementById('matchStats');

        if (result.isDraw) {
            statusDiv.textContent = '🤝 MATCH DRAW';
            statusDiv.className = 'result-status draw';
            winnerDiv.textContent = 'Draw';
        } else if (result.winner === GameLogic.state.players[0].name) {
            statusDiv.textContent = '🎉 YOU WIN!';
            statusDiv.className = 'result-status win';
            winnerDiv.textContent = result.winner;
        } else {
            statusDiv.textContent = '😢 YOU LOSE!';
            statusDiv.className = 'result-status loss';
            winnerDiv.textContent = result.winner;
        }

        scoreDiv.textContent = `${stats.player1.score} - ${stats.player2.score}`;
        durationDiv.textContent = stats.duration;

        statsDiv.innerHTML = `
            <div class="stat-row">
                <span>${stats.player1.name} - Score:</span>
                <strong>${stats.player1.score}</strong>
            </div>
            <div class="stat-row">
                <span>${stats.player1.name} - Wickets:</span>
                <strong>${stats.player1.wickets}</strong>
            </div>
            <div class="stat-row">
                <span>${stats.player2.name} - Score:</span>
                <strong>${stats.player2.score}</strong>
            </div>
            <div class="stat-row">
                <span>${stats.player2.name} - Wickets:</span>
                <strong>${stats.player2.wickets}</strong>
            </div>
            <div class="stat-row">
                <span>Match Duration:</span>
                <strong>${stats.duration}</strong>
            </div>
        `;
    },

    displayLeaderboard(filter = 'wins') {
        const leaderboard = StorageManager.getLeaderboard(filter);
        const listDiv = document.getElementById('leaderboardList');

        if (leaderboard.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 0;">No matches played yet. Play a game to appear on the leaderboard!</p>';
            return;
        }

        listDiv.innerHTML = leaderboard.map((entry, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = index < 3 ? medals[index] : `${index + 1}.`;
            
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';

            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">${medal}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${entry.name}</div>
                        <div class="leaderboard-stats">${entry.date || 'Recently'}</div>
                    </div>
                    <div class="leaderboard-value">${entry.value}</div>
                </div>
            `;
        }).join('');
    },

    filterLeaderboard(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.displayLeaderboard(filter);
    },

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        
        const icon = document.querySelector('.theme-icon');
        icon.textContent = isDarkMode ? '☀️' : '🌙';
    },

    applyTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            document.querySelector('.theme-icon').textContent = '☀️';
        }
    },

    copyGameCode() {
        const code = document.getElementById('displayGameCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Game code copied to clipboard!');
        });
    },
};