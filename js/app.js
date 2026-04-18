// Main App Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    UIManager.init();
    SoundManager.init();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('Service Worker registered successfully');
        }).catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    }

    // Prevent accidental back navigation during game
    window.addEventListener('beforeunload', (e) => {
        if (GameLogic.state.matchStarted) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});