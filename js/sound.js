// Sound Management Module
const SoundManager = {
    enabled: localStorage.getItem('soundEnabled') !== 'false',

    init() {
        this.updateSoundToggle();
    },

    playOut() {
        if (this.enabled) {
            this.playTone(800, 0.2);
        }
    },

    playRun() {
        if (this.enabled) {
            this.playTone(600, 0.15);
        }
    },

    playWicket() {
        if (this.enabled) {
            this.playTone(1200, 0.25);
        }
    },

    playTone(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio context not supported');
        }
    },

    toggleSound() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        this.updateSoundToggle();
    },

    updateSoundToggle() {
        const btn = document.getElementById('soundToggle');
        if (this.enabled) {
            btn.classList.remove('muted');
            btn.innerHTML = '<span class="sound-icon">🔊</span>';
        } else {
            btn.classList.add('muted');
            btn.innerHTML = '<span class="sound-icon">🔇</span>';
        }
    },
};