// JavaScript for the Soundboard Game (index.html)

document.addEventListener('DOMContentLoaded', () => {
    const soundboardGrid = document.getElementById('soundboard-grid');
    const startGameButton = document.getElementById('start-game-button');
    const replaySoundButton = document.getElementById('replay-sound-button');
    const scoreDisplay = document.getElementById('score-display');
    const timerDisplay = document.getElementById('timer-display');
    const gameMessage = document.getElementById('game-message');
    const freePlayCheckbox = document.getElementById('free-play-checkbox');
    const categoryFiltersContainer = document.getElementById('category-filters');

    const INITIAL_LIVES = 3;
    const LOCAL_STORAGE_CATEGORIES_KEY = 'selectedSoundCategories';

    let gameActive = false;
    let soundsToGuess = [];
    let currentMysterySound = null;
    let correctlyGuessedCount = 0;
    let totalSoundsInGame = 0;
    let gameTimerInterval = null;
    let gameStartTime = 0;

    let userHasInteracted = false;
    let audioContextForUnlock;

    if (typeof soundItems === 'undefined' || !Array.isArray(soundItems)) {
        console.error("soundItems array not found. Make sure sound-data.js is loaded.");
        if (gameMessage) gameMessage.textContent = "Error: Sound data not loaded.";
        if (startGameButton) startGameButton.disabled = true;
        return;
    }

    function initializeIcons(itemsToDisplay) {
        soundboardGrid.innerHTML = '';
        itemsToDisplay.forEach(item => {
            const iconElement = document.createElement('img');
            iconElement.src = `icons/${item.icon}`;
            iconElement.alt = item.description || item.id;
            iconElement.classList.add('sound-icon');
            iconElement.dataset.soundId = item.id;

            iconElement.addEventListener('click', () => {
                if (!userHasInteracted) {
                    unlockAudioPolicy();
                }
                if (gameActive && currentMysterySound) {
                    handleGuess(item.id, iconElement);
                }
            });
            soundboardGrid.appendChild(iconElement);
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function initializeCategoryFilters() {
        if (!categoryFiltersContainer) return;
        const categories = [...new Set(soundItems.map(item => item.category))].sort();
        
        let savedCategories = null;
        try {
            const savedCategoriesJson = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
            if (savedCategoriesJson) {
                savedCategories = JSON.parse(savedCategoriesJson);
            }
        } catch (e) {
            console.error("Error reading categories from localStorage:", e);
        }

        // Default: only Animals selected if no saved categories
        if (!savedCategories) {
            savedCategories = ['Animals'];
        }

        categoryFiltersContainer.innerHTML = '';

        categories.forEach(category => {
            if (!category) return;

            const checkboxContainer = document.createElement('div');
            checkboxContainer.classList.add('category-filter-item');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
            checkbox.name = 'soundCategory';
            checkbox.value = category;
            checkbox.checked = savedCategories ? savedCategories.includes(category) : category === 'Animals';
            
            checkbox.addEventListener('change', updateAndStoreCategorySelections);

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = category;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            categoryFiltersContainer.appendChild(checkboxContainer);
        });
    }

    function getFilteredSoundItems() {
        const selectedCategories = [];
        const categoryCheckboxes = document.querySelectorAll('#category-filters input[name="soundCategory"]:checked');
        categoryCheckboxes.forEach(checkbox => selectedCategories.push(checkbox.value));

        if (selectedCategories.length === 0) {
            return [];
        }
        if (typeof soundItems !== 'undefined' && Array.isArray(soundItems)) {
            return soundItems.filter(item => item.category && selectedCategories.includes(item.category));
        }
        return [];
    }

    function updateAndStoreCategorySelections() {
        const selectedCategories = [];
        const categoryCheckboxes = document.querySelectorAll('#category-filters input[name="soundCategory"]:checked');
        categoryCheckboxes.forEach(checkbox => selectedCategories.push(checkbox.value));

        try {
            localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(selectedCategories));
        } catch (e) {
            console.error("Error saving categories to localStorage:", e);
        }

        if (!gameActive) {
            initializeIcons(getFilteredSoundItems());
        }
    }

    function startGame() {
        unlockAudioPolicy();
        const currentRoundSounds = getFilteredSoundItems();
        if (currentRoundSounds.length === 0) {
            gameMessage.textContent = "Please select at least one sound category to start the game.";
            startGameButton.disabled = false;
            startGameButton.textContent = "Start Game";
            return;
        }
        gameActive = true;
        correctlyGuessedCount = 0;
        soundsToGuess = shuffleArray([...currentRoundSounds]);
        totalSoundsInGame = soundsToGuess.length;
        startGameButton.disabled = true;
        startGameButton.textContent = "Game in Progress...";
        replaySoundButton.disabled = false;
        gameMessage.textContent = "Listen carefully!";
        if (gameTimerInterval) clearInterval(gameTimerInterval);
        gameStartTime = Date.now();
        updateTimerDisplay();
        gameTimerInterval = setInterval(updateTimerDisplay, 1000);
        initializeIcons(currentRoundSounds);
        nextSoundChallenge();
        // Play the first sound immediately
        setTimeout(() => { playCurrentMysterySound && playCurrentMysterySound(); }, 100);
    }

    function nextSoundChallenge() {
        updateScoreDisplay();
        if (soundsToGuess.length === 0 && correctlyGuessedCount < totalSoundsInGame) {
            gameMessage.textContent = "No more sounds in this round, but not all guessed.";
            endGame(); return;
        }
        if (soundsToGuess.length === 0 && correctlyGuessedCount === totalSoundsInGame) {
            gameMessage.textContent = "Congratulations! You got them all!";
            endGame(); return;
        }

        currentMysterySound = soundsToGuess.pop();
        if (!currentMysterySound) {
            endGame(); return;
        }
        playCurrentMysterySound();
    }

    function playCurrentMysterySound() {
        if (currentMysterySound && gameActive) {
            const mysteryAudio = new Audio(`sounds/${currentMysterySound.sound}`);
            mysteryAudio.play().catch(e => {
                console.error(`Error playing mystery sound ${currentMysterySound.id}:`, e);
                gameMessage.textContent = `Error playing sound. Try 'Hear Sound Again'.`;
            });
        }
    }
    
    function handleGuess(guessedSoundId, clickedIconElement) {
        if (!currentMysterySound || !gameActive) return;
        document.querySelectorAll('.sound-icon.incorrect-guess, .sound-icon.correct-guess').forEach(icon => {
            icon.classList.remove('incorrect-guess', 'correct-guess');
        });
        if (guessedSoundId === currentMysterySound.id) {
            correctlyGuessedCount++;
            gameMessage.textContent = `Correct! It was: ${currentMysterySound.description}`;
            clickedIconElement.classList.add('correct-guess');
            updateScoreDisplay();
            setTimeout(() => {
                if (clickedIconElement && clickedIconElement.parentNode) {
                    clickedIconElement.parentNode.removeChild(clickedIconElement);
                }
            }, 350);
            if (correctlyGuessedCount === totalSoundsInGame) {
                setTimeout(() => { endGame(); }, 1000);
            } else {
                setTimeout(() => {
                    nextSoundChallenge();
                }, 1000);
            }
        } else {
            // Get the clicked icon's name/description
            let clickedName = clickedIconElement.alt || clickedIconElement.dataset.soundId || 'that';
            gameMessage.textContent = `No, that was not a ${clickedName}`;
            clickedIconElement.classList.remove('incorrect-guess');
            void clickedIconElement.offsetWidth;
            clickedIconElement.classList.add('incorrect-guess');
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(200);
            }
            setTimeout(() => { clickedIconElement.classList.remove('incorrect-guess'); }, 1000);
        }
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${correctlyGuessedCount} / ${totalSoundsInGame}`;
    }

    function updateTimerDisplay() {
        if (!gameActive && gameStartTime === 0) {
            timerDisplay.textContent = "Time: 00:00";
            return;
        }
        const now = Date.now();
        const elapsed = Math.floor((now - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerDisplay.textContent = `Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function endGame(allGuessed = true) {
        gameActive = false;
        replaySoundButton.disabled = true;
        if (gameTimerInterval) clearInterval(gameTimerInterval);
        const elapsedTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        
        if (allGuessed && correctlyGuessedCount === totalSoundsInGame && totalSoundsInGame > 0) {
            if (gameMessage.textContent.includes("Congratulations")) {
                // Keep existing congrats message
            } else if (totalSoundsInGame > 0) {
                gameMessage.textContent = `Congratulations! You guessed all ${totalSoundsInGame} sounds in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}!`;
            }
        } else if (!gameMessage.textContent.includes("Game Over!")) {
            if (totalSoundsInGame > 0) {
                gameMessage.textContent = `Game Over! You guessed ${correctlyGuessedCount} out of ${totalSoundsInGame}. Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}!`;
            } else if (!gameMessage.textContent.includes("Please select")) {
                 gameMessage.textContent = "Game ended. No sounds were selected for this round.";
            }
        }
        
        startGameButton.disabled = false;
        startGameButton.textContent = "Play Again?";
        currentMysterySound = null; 
        initializeIcons(getFilteredSoundItems());
    }

    function unlockAudioPolicy() {
        if (!userHasInteracted) {
            userHasInteracted = true;
            if (!audioContextForUnlock) {
                try {
                    audioContextForUnlock = new (window.AudioContext || window.webkitAudioContext)();
                    if (audioContextForUnlock.state === 'suspended') {
                        audioContextForUnlock.resume().then(() => console.log("AudioContext resumed for unlock."));
                    }
                    const buffer = audioContextForUnlock.createBuffer(1, 1, 22050);
                    const source = audioContextForUnlock.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContextForUnlock.destination);
                    source.start(0);
                    console.log("Audio policy unlocked via AudioContext.");
                } catch (e) {
                    console.warn("Could not unlock audio via AudioContext:", e);
                    const dummyAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
                    dummyAudio.play().then(() => console.log("Audio policy unlocked via dummy Audio element."))
                                   .catch(err => console.warn("Dummy Audio play failed for unlock:", err));
                }
            }
        }
    }

    if (replaySoundButton) {
        replaySoundButton.addEventListener('click', () => {
            if (gameActive && currentMysterySound) {
                unlockAudioPolicy();
                playCurrentMysterySound();
            }
        });
    }

    initializeCategoryFilters();
    initializeIcons(getFilteredSoundItems());
    updateScoreDisplay();
    updateTimerDisplay();
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
    }

    console.log("Soundboard Game script loaded. Lives & Replay logic added. Hover sounds removed.");
}); 