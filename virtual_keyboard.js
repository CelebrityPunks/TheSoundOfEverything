document.addEventListener('DOMContentLoaded', () => {
    const soundSelectionArea = document.getElementById('sound-selection-area');
    const virtualKeyboardGrid = document.getElementById('virtual-keyboard-grid');
    const metronomeStatusDisplay = document.getElementById('metronome-status');
    const toggleMetronomeButton = document.getElementById('toggle-metronome-button');
    const visualLoopTimerText = document.getElementById('visual-loop-timer-text');
    const playbackStatusDisplay = document.getElementById('playback-status');
    const recordedLoopsList = document.getElementById('recorded-loops-list');
    
    const PRE_ROLL_TICKS = 4;

    let audioContext;
    const audioBuffers = {}; // Cache for decoded audio data
    let selectedSoundForAssignment = null; // Stores the soundItem object
    const padAssignments = new Array(9).fill(null); // To store soundItem assigned to each pad

    // Recording & Metronome State
    let isRecording = false;
    let globalMetronomeEnabled = false;
    let globalMetronomeIntervalId = null;
    let currentMetronomeTickIntervalMs = 500; // Default to 120 BPM (500ms)
    let currentRecordingEvents = []; // Renamed from recordedEvents
    let storedLoops = []; // To store multiple loops: { events: [], duration: X, name: "Loop Y" }
    let currentlyPlayingStoredLoopIndex = -1; // Index of the loop in storedLoops that is playing, or -1
    let loopStartTime = 0; // audioContext.currentTime when the current loop iteration started
    let recordingStartTimeAbsolute = 0; // audioContext.currentTime when the overall recording began
    let currentLoopTimeoutId = null; // To manage the end of a loop iteration
    let visualTimerRAFId = null;
    let playbackSources = []; // To keep track of currently playing loop sounds

    let selectedLoopDuration = 4;
    let selectedBpm = 120;

    // Keyboard mapping (top-left to bottom-right on a 3x3 grid)
    // Numpad: 7 8 9 / 4 5 6 / 1 2 3
    // Letters: E R T / D F G / C V B
    const keyMap = {
        'Numpad7': 0, 'KeyE': 0,
        'Numpad8': 1, 'KeyR': 1,
        'Numpad9': 2, 'KeyT': 2,
        'Numpad4': 3, 'KeyD': 3,
        'Numpad5': 4, 'KeyF': 4,
        'Numpad6': 5, 'KeyG': 5,
        'Numpad1': 6, 'KeyC': 6,
        'Numpad2': 7, 'KeyV': 7,
        'Numpad3': 8, 'KeyB': 8,
    };

    const keyHints = [ // For display on pads
        'E / N7', 'R / N8', 'T / N9',
        'D / N4', 'F / N5', 'G / N6',
        'C / N1', 'V / N2', 'B / N3'
    ];

    // Add category filter logic (copied and adapted from script.js)
    const categoryFiltersContainer = document.getElementById('category-filters');
    const LOCAL_STORAGE_CATEGORIES_KEY = 'selectedSoundCategories_virtualKeyboard';

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
        displaySoundsForSelection();
    }

    function initializeAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
    }
    // Try to initialize early, but user interaction might be needed later
    document.addEventListener('click', initializeAudioContext, { once: true });
    document.addEventListener('keydown', initializeAudioContext, { once: true });

    async function loadSound(soundItem) {
        if (!audioContext) {
            console.warn('AudioContext not initialized. Click/type to enable.');
            initializeAudioContext(); // Attempt again
            if(!audioContext) return null;
        }
        if (audioBuffers[soundItem.id]) {
            return audioBuffers[soundItem.id];
        }
        try {
            const response = await fetch(`sounds/${soundItem.sound}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${soundItem.sound}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffers[soundItem.id] = audioBuffer;
            return audioBuffer;
        } catch (error) {
            console.error(`Error loading sound ${soundItem.id}:`, error);
            return null;
        }
    }

    function playSound(soundId) {
        if (!audioContext || !audioBuffers[soundId]) {
            console.warn('Cannot play sound, AudioContext or buffer missing for ' + soundId);
            // Try to load if not already loaded (e.g. if preloading was skipped)
            const soundItem = soundItems.find(item => item.id === soundId);
            if (soundItem && !audioBuffers[soundId]) {
                loadSound(soundItem).then(buffer => {
                    if (buffer) playSoundInternal(buffer);
                });
            } else if (!audioContext) {
                 initializeAudioContext();
            }
            return;
        }
        playSoundInternal(audioBuffers[soundId]);
    }
    
    function playSoundInternal(audioBuffer) {
        if (!audioContext || !audioBuffer) return;
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }

    function displaySoundsForSelection() {
        const area = document.getElementById('sound-selection-area');
        if (!area || typeof soundItems === 'undefined') return;
        area.innerHTML = '';
        const filteredItems = getFilteredSoundItems();
        filteredItems.forEach(item => {
            const iconDiv = document.createElement('div');
            iconDiv.className = 'sound-selectable-icon' + (selectedSoundForAssignment && selectedSoundForAssignment.id === item.id ? ' selected' : '');
            const img = document.createElement('img');
            img.src = `icons/${item.icon}`;
            img.alt = item.description;
            img.style.width = '48px';
            img.style.height = '48px';
            iconDiv.appendChild(img);
            iconDiv.onclick = () => {
                if (selectedSoundForAssignment && selectedSoundForAssignment.id === item.id) {
                    selectedSoundForAssignment = null;
                } else {
                    selectedSoundForAssignment = item;
                }
                displaySoundsForSelection();
            };
            area.appendChild(iconDiv);
            loadSound(item);
        });
    }

    function createKeyboardPads() {
        if (!virtualKeyboardGrid) return;
        virtualKeyboardGrid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const pad = document.createElement('div');
            pad.classList.add('keyboard-pad');
            pad.dataset.padIndex = i;
            const keyHintSpan = document.createElement('span');
            keyHintSpan.classList.add('key-hint');
            keyHintSpan.textContent = keyHints[i];
            pad.appendChild(keyHintSpan);
            const iconContainer = document.createElement('div');
            iconContainer.classList.add('pad-icon-container');
            pad.appendChild(iconContainer);
            if (padAssignments[i]) {
                const img = document.createElement('img');
                img.src = `icons/${padAssignments[i].icon}`;
                img.alt = padAssignments[i].description;
                img.className = 'pad-icon-img';
                iconContainer.appendChild(img);
                // Remove (x) button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'pad-remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.title = 'Remove sound';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    padAssignments[i] = null;
                    createKeyboardPads();
                };
                pad.appendChild(removeBtn);
            } else {
                pad.onclick = () => {
                    if (selectedSoundForAssignment) {
                        padAssignments[i] = selectedSoundForAssignment;
                        selectedSoundForAssignment = null;
                        createKeyboardPads();
                        displaySoundsForSelection();
                    }
                };
            }
            virtualKeyboardGrid.appendChild(pad);
        }
    }

    function showSoundSelectorPopup(padIndex, padElement) {
        // Remove any existing popup
        document.querySelectorAll('.sound-selector-popup').forEach(p => p.remove());
        const popup = document.createElement('div');
        popup.className = 'sound-selector-popup';
        soundItems.forEach(item => {
            const option = document.createElement('div');
            option.className = 'sound-option';
            option.textContent = item.description;
            option.onclick = () => {
                padAssignments[padIndex] = item;
                createKeyboardPads();
            };
            popup.appendChild(option);
        });
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-popup-btn';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => popup.remove();
        popup.appendChild(closeBtn);
        padElement.appendChild(popup);
    }

    function updatePadDisplay(padIndex) {
        const padElement = virtualKeyboardGrid.children[padIndex];
        if (padElement) {
            const soundNameSpan = padElement.querySelector('.pad-sound-name');
            const iconContainer = padElement.querySelector('.pad-icon-container');
            iconContainer.innerHTML = '';
            soundNameSpan.textContent = '';
            // Remove any popups
            padElement.querySelectorAll('.sound-selector-popup').forEach(p => p.remove());
            // Remove +/x buttons (will be re-added by createKeyboardPads)
            padElement.querySelectorAll('.pad-add-btn, .pad-remove-btn').forEach(b => b.remove());
            if (padAssignments[padIndex]) {
                soundNameSpan.textContent = padAssignments[padIndex].description;
                const img = document.createElement('img');
                img.src = `icons/${padAssignments[padIndex].icon}`;
                img.alt = padAssignments[padIndex].description;
                img.classList.add('pad-icon-img');
                iconContainer.appendChild(img);
                // Add remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'pad-remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.title = 'Remove sound';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    padAssignments[padIndex] = null;
                    updatePadDisplay(padIndex);
                };
                padElement.appendChild(removeBtn);
            } else {
                // Add + button
                const addBtn = document.createElement('button');
                addBtn.className = 'pad-add-btn';
                addBtn.innerHTML = '+';
                addBtn.title = 'Assign sound';
                addBtn.onclick = (e) => {
                    e.stopPropagation();
                    showSoundSelectorPopup(padIndex, padElement);
                };
                padElement.appendChild(addBtn);
            }
        }
    }

    function updatePadDisplays() {
        for (let i = 0; i < 9; i++) {
            updatePadDisplay(i);
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
            return; // Don't interfere with text input fields
        }
        const padIndex = keyMap[event.code];
        if (padIndex !== undefined && padAssignments[padIndex]) {
            event.preventDefault(); // Prevent default browser action for these keys if any
            handlePadInteraction(padIndex); 
        }
    });

    // --- Metronome Logic ---
    function playMetronomeTick() {
        if (!audioContext) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine'; // A simple click sound
        osc.frequency.setValueAtTime(880, audioContext.currentTime); // A4 pitch
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.05);
    }

    function toggleGlobalMetronome() {
        initializeAudioContext();
        globalMetronomeEnabled = !globalMetronomeEnabled;
        currentMetronomeTickIntervalMs = selectedBpm === 60 ? 1000 : 500;

        if (globalMetronomeIntervalId) clearInterval(globalMetronomeIntervalId);
        globalMetronomeIntervalId = null;

        if (globalMetronomeEnabled) {
            playMetronomeTick(); 
            globalMetronomeIntervalId = setInterval(playMetronomeTick, currentMetronomeTickIntervalMs);
        }
    }

    function handleBpmChange() {
        currentMetronomeTickIntervalMs = selectedBpm === 60 ? 1000 : 500;
        if (globalMetronomeEnabled) {
            if (globalMetronomeIntervalId) clearInterval(globalMetronomeIntervalId);
            playMetronomeTick(); 
            globalMetronomeIntervalId = setInterval(playMetronomeTick, currentMetronomeTickIntervalMs);
        }
    }

    // --- Visual Loop Timer Functions ---
    function updateVisualTimerDisplay() {
        if (!audioContext || visualTimerRAFId === null) return; // Stop if not supposed to be running
        let relevantStartTime = 0;
        let relevantDuration = 0;
        let isPlaying = false;
        if (isRecording) {
            relevantStartTime = loopStartTime;
            relevantDuration = selectedLoopDuration;
            isPlaying = true;
        } else if (currentlyPlayingStoredLoopIndex !== -1 && storedLoops[currentlyPlayingStoredLoopIndex]) {
            relevantStartTime = loopStartTime;
            relevantDuration = storedLoops[currentlyPlayingStoredLoopIndex].duration;
            isPlaying = true;
        }
        if (isPlaying) {
            const elapsedTimeInLoop = audioContext.currentTime - relevantStartTime;
            let remainingTime = relevantDuration - (elapsedTimeInLoop % relevantDuration);
            if (remainingTime < 0.05) remainingTime = 0; // Clamp near zero
            if (typeof visualLoopTimerText !== 'undefined' && visualLoopTimerText) {
            visualLoopTimerText.textContent = `${remainingTime.toFixed(1)}s / ${relevantDuration}s`;
            }
        } else {
            if (typeof visualLoopTimerText !== 'undefined' && visualLoopTimerText) {
                visualLoopTimerText.textContent = "--";
            }
            stopVisualLoopTimer(); // Ensure it stops if state is inconsistent
            return;
        }
        visualTimerRAFId = requestAnimationFrame(updateVisualTimerDisplay);
    }

    function startVisualLoopTimer(duration, audioCtxStartTime) {
        if (visualTimerRAFId) cancelAnimationFrame(visualTimerRAFId);
        loopStartTime = audioCtxStartTime; // Critical: update loopStartTime for visual timer
        visualTimerRAFId = requestAnimationFrame(updateVisualTimerDisplay);
    }

    function stopVisualLoopTimer() {
        if (visualTimerRAFId) {
            cancelAnimationFrame(visualTimerRAFId);
            visualTimerRAFId = null;
        }
        if (typeof visualLoopTimerText !== 'undefined' && visualLoopTimerText) {
        visualLoopTimerText.textContent = "--";
        }
    }

    // --- Recording Logic ---
    function startPreRollThenRecord() {
        if (isRecording || currentlyPlayingStoredLoopIndex !== -1) return;
        initializeAudioContext();
        if (!audioContext) {
            alert("Audio not ready. Please click on the page or a pad first.");
            return;
        }
        
        currentMetronomeTickIntervalMs = selectedBpm === 60 ? 1000 : 500; 
        
        const wasGlobalMetronomeOn = globalMetronomeEnabled; // Check state before pre-roll display changes it
        
        currentRecordingEvents = []; 
        playbackSources.forEach(source => { try { source.stop(); } catch(e){} });
        playbackSources = [];
        
        // const initialPlaybackStatus = playbackStatusDisplay.textContent; // Not strictly needed if we always set to Get Ready
        playbackStatusDisplay.textContent = "Get Ready...";
        let preRollCount = 0;

        function playNextPreRollTick() {
            if (preRollCount < PRE_ROLL_TICKS) {
                if (!wasGlobalMetronomeOn) { // Only play pre-roll tick sound if global metronome was initially OFF
                    playMetronomeTick(); 
                }
                preRollCount++;
                playbackStatusDisplay.textContent = `Get Ready... ${PRE_ROLL_TICKS - preRollCount + 1}`;
                setTimeout(playNextPreRollTick, currentMetronomeTickIntervalMs); 
            } else {
                // playbackStatusDisplay.textContent = initialPlaybackStatus; // Not needed
                beginLoopRecordingCycle();
            }
        }
        playNextPreRollTick();
        updateOverallControlsState();
    }

    function beginLoopRecordingCycle() {
        isRecording = true;
        recordingStartTimeAbsolute = audioContext.currentTime;
        playbackStatusDisplay.textContent = "Recording... (Loop 1)";
        startVisualLoopTimer(selectedLoopDuration, recordingStartTimeAbsolute); 
        scheduleNextLoopIteration(1);
        updateOverallControlsState();
    }

    function startRecordingLoop() {
        startPreRollThenRecord();
    }

    function scheduleNextLoopIteration(loopNumber) {
        const loopDuration = selectedLoopDuration;
        const delayUntilNextLoopStart = loopDuration * 1000; 
        if (currentLoopTimeoutId) clearTimeout(currentLoopTimeoutId);
        currentLoopTimeoutId = setTimeout(() => {
            if (!isRecording) return; 
            playbackStatusDisplay.textContent = `Looping... (Playing loop ${loopNumber}, Recording loop ${loopNumber + 1})`;
            playRecordedLoop();
            recordingStartTimeAbsolute = audioContext.currentTime;
            startVisualLoopTimer(loopDuration, recordingStartTimeAbsolute);
            scheduleNextLoopIteration(loopNumber + 1);
        }, delayUntilNextLoopStart);
    }

    function playRecordedLoop() {
        if (!audioContext) return;
        playbackSources.forEach(source => { try { source.stop(); } catch(e){} });
        playbackSources = [];
        const now = audioContext.currentTime;
        currentRecordingEvents.forEach(event => {
            if (audioBuffers[event.soundId]) {
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffers[event.soundId];
                source.connect(audioContext.destination);
                source.start(now + event.time);
                playbackSources.push(source);
            }
        });
    }

    function stopRecordingLoop() {
        if (!isRecording) return;
        isRecording = false;
        if (currentLoopTimeoutId) clearTimeout(currentLoopTimeoutId);
        currentLoopTimeoutId = null;
        stopVisualLoopTimer(); 
        playbackSources.forEach(source => { try { source.stop(); } catch(e){} });
        playbackSources = [];
            const newLoop = {
                events: [...currentRecordingEvents], 
            duration: selectedLoopDuration,
                name: `Loop ${storedLoops.length + 1}`
            };
            storedLoops.push(newLoop);
            playbackStatusDisplay.textContent = `Loop recording stopped. "${newLoop.name}" (${currentRecordingEvents.length} events) stored.`;
        currentRecordingEvents = [];
        displayStoredLoops();
    }

    function displayStoredLoops() {
        if (!recordedLoopsList) return;
        recordedLoopsList.innerHTML = ''; 
        storedLoops.forEach((loop, index) => {
            const listItem = document.createElement('li');
            // Updated styles for simple list items
            listItem.style.marginBottom = '8px'; 
            listItem.style.padding = '10px 12px';
            listItem.style.border = '1px solid #ddd';
            listItem.style.borderRadius = '8px'; 
            listItem.style.display = 'flex';
            listItem.style.justifyContent = 'space-between';
            listItem.style.alignItems = 'center';
            listItem.style.backgroundColor = '#f9f9f9';
            listItem.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

            const loopNameSpan = document.createElement('span');
            loopNameSpan.textContent = `${loop.name} (${loop.duration}s)`;
            loopNameSpan.style.fontWeight = '500'; // Make text a bit bolder

            listItem.appendChild(loopNameSpan);
            const buttonsDiv = document.createElement('div');
            buttonsDiv.style.display = 'flex'; // Ensure buttons in the div are also flexed
            buttonsDiv.style.gap = '0.5rem'; // Add gap between buttons

            // Play
            const playBtn = document.createElement('button');
            playBtn.className = 'stored-loop-btn';
            playBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="7,4 21,12 7,20"/></svg>';
            playBtn.onclick = (e) => { e.stopPropagation(); playSpecificStoredLoop(index); };
            buttonsDiv.appendChild(playBtn);
            // Pause
            const pauseBtn = document.createElement('button');
            pauseBtn.className = 'stored-loop-btn';
            pauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            pauseBtn.onclick = (e) => { e.stopPropagation(); stopCurrentStoredLoopPlayback(); };
            buttonsDiv.appendChild(pauseBtn);
            // Download as WAV
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'stored-loop-btn';
            downloadBtn.title = 'Download WAV';
            downloadBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            downloadBtn.onclick = async (e) => {
                e.stopPropagation();
                try {
                    const wavBlob = await renderLoopToWav(loop);
                    if (wavBlob) {
                        const url = URL.createObjectURL(wavBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${loop.name.replace(/\s+/g, '_').toLowerCase()}.wav`;
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
                        return;
                    }
                } catch (err) { /* fallback below */ }
                // fallback: download JSON
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(loop, null, 2));
                const a = document.createElement('a');
                a.setAttribute('href', dataStr);
                a.setAttribute('download', `${loop.name.replace(/\s+/g, '_').toLowerCase()}.json`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            buttonsDiv.appendChild(downloadBtn);
            listItem.appendChild(buttonsDiv);
            recordedLoopsList.appendChild(listItem);
        });
        updateOverallControlsState();
    }
    
    function updateOverallControlsState() {
        // Instead of enabling/disabling buttons directly, just re-render the controls
        renderRecordingControls();
        renderMetronomeControls();
        // If you want to update other UI, do it here
    }

    function playSpecificStoredLoop(loopIndex) {
        if (isRecording || currentlyPlayingStoredLoopIndex !== -1) return;
        initializeAudioContext();
        if (!audioContext) {
            alert("Audio not ready. Please click on the page or a pad first.");
            return;
        }
        
        // Metronome sound continues if globalMetronomeEnabled is true.

        currentlyPlayingStoredLoopIndex = loopIndex;
        const loopToPlay = storedLoops[loopIndex];
        if (!loopToPlay) {
            currentlyPlayingStoredLoopIndex = -1;
            updateOverallControlsState();
            return;
        }
        playbackStatusDisplay.textContent = `Playing ${loopToPlay.name}...`;
        playbackSources.forEach(source => { try { source.stop(); } catch(e){} });
        playbackSources = [];
        const playbackStartTime = audioContext.currentTime;
        startVisualLoopTimer(loopToPlay.duration, playbackStartTime); 

        loopToPlay.events.forEach(event => {
            if (audioBuffers[event.soundId]) {
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffers[event.soundId];
                source.connect(audioContext.destination);
                source.start(playbackStartTime + event.time);
                playbackSources.push(source);
            }
        });
        updateOverallControlsState(); 
        
        if (currentLoopTimeoutId) clearTimeout(currentLoopTimeoutId); 
        currentLoopTimeoutId = setTimeout(() => {
            if (currentlyPlayingStoredLoopIndex === loopIndex) { 
                 finishSpecificStoredLoopPlayback(loopIndex);
            }
        }, loopToPlay.duration * 1000 + 100); 
    }

    function finishSpecificStoredLoopPlayback(loopIndex) {
        if (currentlyPlayingStoredLoopIndex === loopIndex) {
            playbackStatusDisplay.textContent = `"${storedLoops[loopIndex].name}" finished.`;
            stopVisualLoopTimer(); 
            currentlyPlayingStoredLoopIndex = -1;
            playbackSources = [];
            if (currentLoopTimeoutId) clearTimeout(currentLoopTimeoutId);
            currentLoopTimeoutId = null;
            updateOverallControlsState();
        }
    }

    function stopCurrentStoredLoopPlayback() {
        if (currentlyPlayingStoredLoopIndex === -1) return;
        stopVisualLoopTimer(); 
        const loopName = storedLoops[currentlyPlayingStoredLoopIndex].name;
        playbackSources.forEach(source => { try { source.stop(); } catch(e){} });
        if (currentLoopTimeoutId) clearTimeout(currentLoopTimeoutId);
        currentLoopTimeoutId = null;
        currentlyPlayingStoredLoopIndex = -1;
        playbackStatusDisplay.textContent = `Playback of "${loopName}" stopped.`;
        updateOverallControlsState();
    }

    // --- Event Listeners for Controls ---
    // recordLoopButton.addEventListener('click', startRecordingLoop);
    // stopLoopButton.addEventListener('click', stopRecordingLoop);
    // toggleMetronomeButton.addEventListener('click', toggleGlobalMetronome);
    // metronomeBpmSelect.addEventListener('change', handleBpmChange);

    // Initialize metronome state from default HTML values
    currentMetronomeTickIntervalMs = selectedBpm === 60 ? 1000 : 500;

    // On DOMContentLoaded, initialize filters and show filtered icons
    initializeCategoryFilters();
        displaySoundsForSelection();
        createKeyboardPads();
        displayStoredLoops();

    // --- Recording Controls ---
    function renderRecordingControls() {
        const recDiv = document.getElementById('recording-controls');
        if (!recDiv) return;
        recDiv.innerHTML = '';
        // Pills for loop duration
        const durations = [4, 8];
        durations.forEach(val => {
            const pill = document.createElement('button');
            pill.className = 'pill-btn' + (selectedLoopDuration === val ? ' selected' : '');
            pill.textContent = val + ' sec';
            pill.onclick = () => {
                selectedLoopDuration = val;
                renderRecordingControls();
            };
            recDiv.appendChild(pill);
        });
        // Record button (red circle)
        const recBtn = document.createElement('button');
        recBtn.id = 'record-loop-button';
        recBtn.className = 'pill-btn';
        recBtn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#ef4444"/></svg>';
        recBtn.onclick = () => startRecordingLoop();
        recDiv.appendChild(recBtn);
        // Stop button (black square)
        const stopBtn = document.createElement('button');
        stopBtn.id = 'stop-loop-button';
        stopBtn.className = 'pill-btn';
        stopBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" fill="#111"/></svg>';
        stopBtn.onclick = () => stopRecordingLoop();
        recDiv.appendChild(stopBtn);
    }

    // --- Metronome Controls ---
    function renderMetronomeControls() {
        const metDiv = document.getElementById('metronome-controls');
        if (!metDiv) return;
        metDiv.innerHTML = '';
        const bpms = [60, 120];
        bpms.forEach(val => {
            const isSelected = selectedBpm === val && globalMetronomeEnabled;
            const pill = document.createElement('button');
            pill.className = 'pill-btn' + (isSelected ? ' selected' : '');
            pill.textContent = val + ' BPM';
            pill.onclick = () => {
                if (isSelected) {
                    globalMetronomeEnabled = false;
                    if (globalMetronomeIntervalId) clearInterval(globalMetronomeIntervalId);
                    globalMetronomeIntervalId = null;
                    renderMetronomeControls();
    } else {
                    selectedBpm = val;
                    if (!globalMetronomeEnabled) globalMetronomeEnabled = true;
                    handleBpmChange();
                    renderMetronomeControls();
                }
            };
            metDiv.appendChild(pill);
        });
        // Off state
        if (!globalMetronomeEnabled) {
            const offPill = document.createElement('span');
            offPill.className = 'pill-btn';
            offPill.textContent = 'Metronome Off';
            metDiv.appendChild(offPill);
        }
    }

    // --- Render controls on load and on relevant changes ---
    renderRecordingControls();
    renderMetronomeControls();

    function handlePadInteraction(padIndex) {
        if (padAssignments[padIndex]) {
            playSound(padAssignments[padIndex].id);
            if (isRecording) {
                currentRecordingEvents.push({
                    soundId: padAssignments[padIndex].id,
                    time: audioContext.currentTime - recordingStartTimeAbsolute
                });
            }
        }
    }

    // WAV export utility
    function encodeWAV(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length * numChannels * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        let offset = 0;
        function writeString(s) { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); }
        function writeUint32(v) { view.setUint32(offset, v, true); offset += 4; }
        function writeUint16(v) { view.setUint16(offset, v, true); offset += 2; }
        writeString('RIFF');
        writeUint32(length - 8);
        writeString('WAVE');
        writeString('fmt ');
        writeUint32(16);
        writeUint16(1);
        writeUint16(numChannels);
        writeUint32(sampleRate);
        writeUint32(sampleRate * numChannels * 2);
        writeUint16(numChannels * 2);
        writeUint16(16);
        writeString('data');
        writeUint32(audioBuffer.length * numChannels * 2);
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                let sample = audioBuffer.getChannelData(ch)[i];
                sample = Math.max(-1, Math.min(1, sample));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        return new Blob([buffer], { type: 'audio/wav' });
    }
    async function renderLoopToWav(loop) {
        if (!window.OfflineAudioContext) return null;
        const duration = loop.duration;
        const sampleRate = 44100;
        const ctx = new OfflineAudioContext(1, Math.ceil(sampleRate * duration), sampleRate);
        // Preload all needed buffers
        const bufferMap = {};
        for (const event of loop.events) {
            if (!bufferMap[event.soundId]) {
                const item = soundItems.find(s => s.id === event.soundId);
                if (!item) continue;
                const resp = await fetch(`sounds/${item.sound}`);
                const arr = await resp.arrayBuffer();
                bufferMap[event.soundId] = await ctx.decodeAudioData(arr);
            }
        }
        for (const event of loop.events) {
            const buf = bufferMap[event.soundId];
            if (!buf) continue;
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start(event.time);
        }
        const rendered = await ctx.startRendering();
        return encodeWAV(rendered);
    }
}); 