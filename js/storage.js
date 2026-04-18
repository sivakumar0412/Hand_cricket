// Storage Management Module
const StorageManager = {
    prefix: 'handcricket_',

    saveMatchResult(result) {
        let matches = JSON.parse(localStorage.getItem(this.prefix + 'matches')) || [];
        matches.push({
            ...result,
            timestamp: Date.now(),
        });
        localStorage.setItem(this.prefix + 'matches', JSON.stringify(matches));
        this.updateLeaderboard(result);
    },

    updateLeaderboard(result) {
        let leaderboard = JSON.parse(localStorage.getItem(this.prefix + 'leaderboard')) || [];

        result.winners.forEach(winner => {
            let entry = leaderboard.find(e => e.name === winner);
            if (entry) {
                entry.wins = (entry.wins || 0) + 1;
                entry.lastMatch = new Date().toLocaleDateString();
            } else {
                leaderboard.push({
                    name: winner,
                    wins: 1,
                    lastMatch: new Date().toLocaleDateString(),
                    highestScore: parseInt(result.scores.split(' - ')[0]),
                });
            }
        });

        leaderboard.sort((a, b) => (b.wins || 0) - (a.wins || 0));
        localStorage.setItem(this.prefix + 'leaderboard', JSON.stringify(leaderboard));
    },

    getLeaderboard(filter = 'wins') {
        const leaderboard = JSON.parse(localStorage.getItem(this.prefix + 'leaderboard')) || [];

        if (filter === 'wins') {
            return leaderboard.sort((a, b) => (b.wins || 0) - (a.wins || 0)).slice(0, 10);
        } else if (filter === 'score') {
            return leaderboard.sort((a, b) => (b.highestScore || 0) - (a.highestScore || 0)).slice(0, 10);
        } else if (filter === 'recent') {
            return leaderboard.slice(0, 10);
        }

        return leaderboard;
    },

    saveMultiplayerGame(gameCode, data) {
        localStorage.setItem(this.prefix + 'game_' + gameCode, JSON.stringify(data));
    },

    getMultiplayerGame(gameCode) {
        return JSON.parse(localStorage.getItem(this.prefix + 'game_' + gameCode));
    },

    deleteMultiplayerGame(gameCode) {
        localStorage.removeItem(this.prefix + 'game_' + gameCode);
    },

    savePlayerName(name) {
        localStorage.setItem(this.prefix + 'playerName', name);
    },

    getPlayerName() {
        return localStorage.getItem(this.prefix + 'playerName') || 'Player';
    },

    clearAll() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    },
};