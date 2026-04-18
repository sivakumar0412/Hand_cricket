// Game Logic Module
const GameLogic = {
    state: {
        gameMode: null, // 'single' or 'multiplayer'
        players: [],
        currentInning: 1,
        currentBatter: 0,
        currentBowler: 1,
        scores: [0, 0],
        wickets: [0, 0],
        overs: [0, 0],
        ballsPerOver: 6,
        maxWickets: 10,
        gameHistory: [],
        difficulty: 'medium',
        startTime: null,
        matchStarted: false,
        targetScore: 0,
    },

    init(gameMode, players, difficulty = 'medium') {
        this.state.gameMode = gameMode;
        this.state.players = players;
        this.state.difficulty = difficulty;
        this.state.startTime = Date.now();
        this.state.matchStarted = true;
        this.state.scores = [0, 0];
        this.state.wickets = [0, 0];
        this.state.overs = [0, 0];
        this.state.gameHistory = [];
        this.state.currentInning = 1;
    },

    playBall(playerChoice) {
        if (!this.state.matchStarted) return null;

        // Get computer choice or opponent choice
        const computerChoice = this.getComputerChoice();
        
        // Determine result
        const isOut = playerChoice === computerChoice;
        
        // Update game history
        const ballResult = {
            playerChoice,
            computerChoice,
            isOut,
            inning: this.state.currentInning,
            overs: this.state.overs[this.state.currentBatter],
        };
        
        this.state.gameHistory.push(ballResult);

        if (isOut) {
            this.state.wickets[this.state.currentBatter]++;
            SoundManager.playOut();
        } else {
            this.state.scores[this.state.currentBatter] += playerChoice;
            SoundManager.playRun();
        }

        // Update overs
        this.state.overs[this.state.currentBatter]++;
        
        // Check if innings should end
        if (this.shouldEndInnings()) {
            return { ...ballResult, inningsEnded: true };
        }

        return ballResult;
    },

    getComputerChoice() {
        const difficulty = this.state.difficulty;

        if (difficulty === 'easy') {
            return Math.floor(Math.random() * 6) + 1;
        } else if (difficulty === 'medium') {
            // Smart AI - tries to predict player's pattern
            if (this.state.gameHistory.length > 0) {
                const lastChoices = this.state.gameHistory.slice(-3).map(b => b.playerChoice);
                if (lastChoices.every(c => c === lastChoices[0])) {
                    // Player is repeating, 50% chance to match
                    return Math.random() > 0.5 ? lastChoices[0] : Math.floor(Math.random() * 6) + 1;
                }
            }
            return Math.floor(Math.random() * 6) + 1;
        } else if (difficulty === 'hard') {
            // Advanced AI - aggressive strategy
            if (this.state.gameHistory.length > 3) {
                const lastFive = this.state.gameHistory.slice(-5).map(b => b.playerChoice);
                const mostCommon = this.getMostCommonChoice(lastFive);
                return Math.random() > 0.4 ? mostCommon : Math.floor(Math.random() * 6) + 1;
            }
            return Math.floor(Math.random() * 6) + 1;
        }
    },

    getMostCommonChoice(choices) {
        const frequency = {};
        choices.forEach(choice => {
            frequency[choice] = (frequency[choice] || 0) + 1;
        });
        return parseInt(Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        ));
    },

    shouldEndInnings() {
        const batter = this.state.currentBatter;
        const bowler = this.state.currentBowler;
        
        // Innings ends if all wickets lost
        if (this.state.wickets[batter] >= this.state.maxWickets) {
            return true;
        }
        
        // Innings ends if 6 overs completed (36 balls)
        if (this.state.overs[batter] >= 6) {
            return true;
        }

        return false;
    },

    switchInnings() {
        if (this.state.currentInning === 1) {
            // Set target for second inning
            this.state.targetScore = this.state.scores[0] + 1;
            
            // Switch batting order
            this.state.currentBatter = 1;
            this.state.currentBowler = 0;
            this.state.currentInning = 2;
        }
    },

    getResult() {
        const score1 = this.state.scores[0];
        const score2 = this.state.scores[1];
        
        let result = {
            winner: null,
            margin: 0,
            isDraw: false,
        };

        if (score1 > score2) {
            result.winner = this.state.players[0].name;
            result.margin = score1 - score2;
        } else if (score2 > score1) {
            result.winner = this.state.players[1].name;
            result.margin = score2 - score1;
        } else {
            result.isDraw = true;
        }

        return result;
    },

    getGameDuration() {
        const duration = Math.floor((Date.now() - this.state.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}m ${seconds}s`;
    },

    getGameStats() {
        return {
            player1: {
                name: this.state.players[0].name,
                score: this.state.scores[0],
                wickets: this.state.wickets[0],
                overs: this.state.overs[0],
            },
            player2: {
                name: this.state.players[1].name,
                score: this.state.scores[1],
                wickets: this.state.wickets[1],
                overs: this.state.overs[1],
            },
            gameHistory: this.state.gameHistory,
            duration: this.getGameDuration(),
        };
    },

    reset() {
        this.state = {
            gameMode: null,
            players: [],
            currentInning: 1,
            currentBatter: 0,
            currentBowler: 1,
            scores: [0, 0],
            wickets: [0, 0],
            overs: [0, 0],
            ballsPerOver: 6,
            maxWickets: 10,
            gameHistory: [],
            difficulty: 'medium',
            startTime: null,
            matchStarted: false,
            targetScore: 0,
        };
    },
};

// Toss Logic
const TossLogic = {
    tossResult: null,

    performToss(playerChoice) {
        const coinFlip = Math.random() < 0.5 ? 'odd' : 'even';
        const playerCallParity = playerChoice === 'odd' ? 'odd' : 'even';
        
        this.tossResult = {
            coinFlip: coinFlip,
            playerChoice: playerCallParity,
            playerWins: coinFlip === playerCallParity,
            chosenSide: Math.random() < 0.5 ? 'bat' : 'bowl',
        };

        return this.tossResult;
    },

    getWinner() {
        return this.tossResult.playerWins;
    },

    getChosenSide() {
        return this.tossResult.chosenSide;
    },
};