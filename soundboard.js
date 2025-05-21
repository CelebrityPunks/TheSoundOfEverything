document.addEventListener('DOMContentLoaded', () => {
    const soundboardGrid = document.getElementById('isometric-soundboard-grid');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const LOCAL_STORAGE_CATEGORIES_KEY = 'selectedSoundCategories_soundboard';
    let audioContext;
    const audioBuffers = {}; // Cache for decoded audio data

    // Function to initialize AudioContext on first user interaction
    function unlockAudioPolicy() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Remove the event listener once the context is unlocked
        document.removeEventListener('click', unlockAudioPolicy);
        document.removeEventListener('touchend', unlockAudioPolicy);
    }
    document.addEventListener('click', unlockAudioPolicy, { once: true });
    document.addEventListener('touchend', unlockAudioPolicy, { once: true });

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
        displaySounds();
    }

    async function loadSound(soundItem) {
        if (!audioContext) {
            console.warn('AudioContext not initialized yet. User interaction needed.');
            unlockAudioPolicy();
            if (!audioContext) return null;
        }
        
        const soundPath = `sounds/${soundItem.sound}`; // Corrected path
        if (audioBuffers[soundItem.id]) {
            return audioBuffers[soundItem.id];
        }

        try {
            const response = await fetch(soundPath); // Use corrected path
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${soundPath}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffers[soundItem.id] = audioBuffer;
            return audioBuffer;
        } catch (error) {
            console.error(`Error loading sound ${soundItem.id} from ${soundPath}:`, error);
            return null;
        }
    }

    function playSound(audioBuffer) {
        if (!audioContext || !audioBuffer) {
            console.warn('Cannot play sound, AudioContext or buffer missing.');
            if(!audioContext) unlockAudioPolicy();
            return;
        }
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }

    // Preload sounds for better responsiveness, or load on demand
    soundItems.forEach(item => {
        // Optional: Preload all sounds. Can also be done on first click for faster page load.
        // For now, let's load them on demand when an icon is clicked to ensure audioContext is ready.
    });

    function displaySounds() {
        if (!soundboardGrid) {
            console.error('Soundboard grid not found!');
            return;
        }
        soundboardGrid.innerHTML = ''; // Clear existing icons if any

        const itemsToDisplay = getFilteredSoundItems();
        itemsToDisplay.forEach(item => {
            const img = document.createElement('img');
            img.src = `icons/${item.icon}`; // Corrected path
            img.alt = item.description;
            img.title = item.description; // Tooltip
            img.classList.add('sound-icon');
            img.dataset.soundId = item.id;

            img.addEventListener('click', async () => {
                if (!audioContext) {
                    // Attempt to unlock audio policy if not already done.
                    // The document-level listeners should ideally handle this on the very first tap.
                    unlockAudioPolicy(); 
                    if (!audioContext) {
                        console.warn('AudioContext still not initialized. Please tap the page once to enable audio.');
                        return; // Exit if audio context is still not available
                    }
                }
                const audioBuffer = await loadSound(item); // Load on demand
                if (audioBuffer) {
                    playSound(audioBuffer);
                }
            });
            
            soundboardGrid.appendChild(img);
        });
    }

    initializeCategoryFilters();
    displaySounds(); // Initial display

    // Listen for changes in localStorage from other tabs/windows (e.g., index.html)
    window.addEventListener('storage', (event) => {
        if (event.key === LOCAL_STORAGE_CATEGORIES_KEY) {
            console.log('Storage changed for categories, redrawing soundboard.');
            displaySounds(); // Re-filter and re-display sounds
        }
    });
}); 