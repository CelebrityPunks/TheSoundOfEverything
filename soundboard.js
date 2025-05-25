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
            // Note: If audioContext is successfully created, the global listeners 
            // for click/touchend on the document are no longer strictly necessary 
            // for *this specific purpose* of unlocking audio. However, removing them
            // here (if they were not {once: true}) would require more complex state
            // management if other parts of the app relied on them.
            // For now, simply ensuring they are not removed *by this function*
            // and are not {once:true} globally is the goal.
        }
    }
    // MODIFICATION: { once: true } will be removed by a subsequent step in this subtask
    document.addEventListener('click', unlockAudioPolicy);
    document.addEventListener('touchend', unlockAudioPolicy);

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
            savedCategories = ['Animals']; // Default selection
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

        const soundPath = `sounds/${soundItem.sound}`; 
        if (audioBuffers[soundItem.id]) {
            return audioBuffers[soundItem.id];
        }

        try {
            const response = await fetch(soundPath); 
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

    soundItems.forEach(item => {
        // Optional: Preload all sounds. 
    });

    function displaySounds() {
        if (!soundboardGrid) {
            console.error('Soundboard grid not found!');
            return;
        }
        soundboardGrid.innerHTML = ''; 

        const itemsToDisplay = getFilteredSoundItems();
        itemsToDisplay.forEach(item => {
            const img = document.createElement('img');
            img.src = `icons/${item.icon}`; 
            img.alt = item.description;
            img.title = item.description; 
            img.classList.add('sound-icon');
            img.dataset.soundId = item.id;

            const handleInteraction = async () => {
                if (!audioContext) {
                    unlockAudioPolicy(); 
                    if (!audioContext) {
                        console.warn('AudioContext still not initialized. Please tap the page once to enable audio.');
                        return; 
                    }
                }
                const audioBuffer = await loadSound(item); 
                if (audioBuffer) {
                    playSound(audioBuffer);
                }
            };

            img.addEventListener('click', handleInteraction);
            img.addEventListener('touchend', handleInteraction);
            // MODIFICATION: A 'touchend' event listener will be added here by a subsequent step

            soundboardGrid.appendChild(img);
        });
    }

    initializeCategoryFilters();
    displaySounds(); 

    window.addEventListener('storage', (event) => {
        if (event.key === LOCAL_STORAGE_CATEGORIES_KEY) {
            console.log('Storage changed for categories, redrawing soundboard.');
            displaySounds(); 
        }
    });
});
