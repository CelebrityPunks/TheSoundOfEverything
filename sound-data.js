// sound-data.js
// Defines the available sound items for the application.
// Each item should have an 'id', 'icon' (filename in /icons), 'sound' (filename in /sounds), and 'description'.

const soundItems = [
    {
        id: 'mic', // Using filename without extension as ID
        icon: 'mic.png',
        sound: 'mic.mp3',
        description: 'Microphone',
        hint: 'Microphone',
        category: 'Misc'
    },
    {
        id: 'drumbase',
        icon: 'drumbase.png',
        sound: 'drumbase.mp3',
        description: 'Drum Base',
        hint: 'Drum Base',
        category: 'Instruments'
    },
    {
        id: 'acoustic',
        icon: 'acoustic.png',
        sound: 'acoustic.mp3',
        description: 'Acoustic Guitar',
        hint: 'Acoustic Guitar',
        category: 'Instruments'
    },
    {
        id: 'electricguitar',
        icon: 'electricguitar.png',
        sound: 'electricguitar.mp3',
        description: 'Electric Guitar',
        hint: 'Electric Guitar',
        category: 'Instruments'
    },
    {
        id: 'snare',
        icon: 'snare.png',
        sound: 'snare.mp3',
        description: 'Snare Drum',
        hint: 'Snare Drum',
        category: 'Instruments'
    },
    {
        id: 'cymbal',
        icon: 'cymbal.png',
        sound: 'cymbal.mp3',
        description: 'Cymbal',
        hint: 'Cymbal',
        category: 'Instruments'
    },
    {
        id: 'triangle',
        icon: 'triangle.png',
        sound: 'triangle.mp3',
        description: 'Triangle',
        hint: 'Triangle',
        category: 'Instruments'
    },
    {
        id: 'tambourine',
        icon: 'tambourine.png',
        sound: 'tambourine.mp3',
        description: 'Tambourine',
        hint: 'Tambourine',
        category: 'Instruments'
    },
    {
        id: 'harp',
        icon: 'harp.png',
        sound: 'harp.mp3',
        description: 'Harp',
        hint: 'Harp',
        category: 'Instruments'
    },
    {
        id: 'cello',
        icon: 'cello.png',
        sound: 'cello.mp3',
        description: 'Cello',
        hint: 'Cello',
        category: 'Instruments'
    },
    {
        id: 'flute',
        icon: 'flute.png',
        sound: 'flute.mp3',
        description: 'Flute',
        hint: 'Flute',
        category: 'Instruments'
    },
    {
        id: 'trumpet',
        icon: 'trumpet.png',
        sound: 'trumpet.mp3',
        description: 'Trumpet',
        hint: 'Trumpet',
        category: 'Instruments'
    },
    {
        id: 'violin',
        icon: 'violin.png',
        sound: 'violin.mp3',
        description: 'Violin',
        hint: 'Violin',
        category: 'Instruments'
    },
    {
        id: 'piano',
        icon: 'piano.png',
        sound: 'piano.mp3',
        description: 'Piano',
        hint: 'Piano',
        category: 'Instruments'
    },
    {
        id: 'synth',
        icon: 'synth.png',
        sound: 'synth.mp3',
        description: 'Synthesizer',
        hint: 'Synthesizer',
        category: 'Instruments'
    },
    {
        id: 'sax',
        icon: 'sax.png',
        sound: 'sax.mp3',
        description: 'Saxophone',
        hint: 'Saxophone',
        category: 'Instruments'
    },
    {
        id: 'bagpipes',
        icon: 'bagpipes.png',
        sound: 'bagpipes.mp3',
        description: 'Bagpipes',
        hint: 'Bagpipes',
        category: 'Instruments'
    },
    {
        id: 'kalimba',
        icon: 'kalimba.png',
        sound: 'kalimba.mp3',
        description: 'Kalimba',
        hint: 'Kalimba',
        category: 'Instruments'
    },
    {
        id: 'didgeridoo',
        icon: 'didgeridoo.png',
        sound: 'didgeridoo.mp3',
        description: 'Didgeridoo',
        hint: 'Didgeridoo',
        category: 'Instruments'
    },
    {
        id: 'accordion',
        icon: 'accordion.png',
        sound: 'accordion.mp3',
        description: 'Accordion',
        hint: 'Accordion',
        category: 'Instruments'
    },
    {
        id: 'bongodrums',
        icon: 'bongodrums.png',
        sound: 'bongodrums.mp3',
        description: 'Bongodrums',
        hint: 'Bongodrums',
        category: 'Instruments'
    },
    {
        id: 'xylophone',
        icon: 'xylophone.png',
        sound: 'xylophone.mp3',
        description: 'Xylophone',
        hint: 'Xylophone',
        category: 'Instruments'
    },
    {
        id: 'maracas',
        icon: 'maracas.png',
        sound: 'maracas.mp3',
        description: 'Maracas',
        hint: 'Maracas',
        category: 'Instruments'
    },
    {
        id: 'wolf',
        icon: 'wolf.png',
        sound: 'wolf.mp3',
        description: 'Wolf',
        hint: 'Wolf',
        category: 'Animals'
    },
    {
        id: 'turkey',
        icon: 'turkey.png',
        sound: 'turkey.mp3',
        description: 'Turkey',
        hint: 'Turkey',
        category: 'Animals'
    },
    {
        id: 'bee',
        icon: 'bee.png',
        sound: 'bee.mp3',
        description: 'Bee',
        hint: 'Bee',
        category: 'Animals'
    },
    {
        id: 'snake',
        icon: 'snake.png',
        sound: 'snake.mp3',
        description: 'Snake',
        hint: 'Snake',
        category: 'Animals'
    },
    {
        id: 'monkey',
        icon: 'monkey.png',
        sound: 'monkey.mp3',
        description: 'Monkey',
        hint: 'Monkey',
        category: 'Animals'
    },
    {
        id: 'lawnmower',
        icon: 'lawnmower.png',
        sound: 'lawnmower.mp3',
        description: 'Lawnmower',
        hint: 'Lawnmower',
        category: 'Misc'
    },
    {
        id: 'rotatingbezel',
        icon: 'rotatingbezel.png',
        sound: 'rotatingbezel.mp3',
        description: 'Rotating Bezel',
        hint: 'Rotating Bezel',
        category: 'Misc'
    },
    {
        id: 'eattingchips',
        icon: 'Eatting Chips.png',
        sound: 'Eatting Chips.mp3',
        description: 'Eating Chips',
        hint: 'Eating Chips',
        category: 'Misc'
    },
    {
        id: 'parrot',
        icon: 'parrot.png',
        sound: 'parrot.mp3',
        description: 'Parrot',
        hint: 'Parrot',
        category: 'Animals'
    },
    {
        id: 'fart',
        icon: 'fart.png',
        sound: 'fart.mp3',
        description: 'Fart',
        hint: 'Fart',
        category: 'Misc'
    },
    {
        id: 'swish',
        icon: 'swish.png',
        sound: 'swish.mp3',
        description: 'Swish',
        hint: 'Swish',
        category: 'Misc'
    },
    {
        id: 'bball',
        icon: 'bball.png',
        sound: 'bball.mp3',
        description: 'Basketball',
        hint: 'Basketball',
        category: 'Misc'
    },
    {
        id: 'boilingwater',
        icon: 'boiling water.png',
        sound: 'boiling water.mp3',
        description: 'Boiling Water',
        hint: 'Boiling Water',
        category: 'Nature & Ambient'
    },
    {
        id: 'kickcan',
        icon: 'kickcan.png',
        sound: 'kickcan.mp3',
        description: 'Kick Can',
        hint: 'Kick Can',
        category: 'Misc'
    },
    {
        id: 'crinkle',
        icon: 'Crinkle.png',
        sound: 'Crinkle.mp3',
        description: 'Crinkle',
        hint: 'Crinkle',
        category: 'Misc'
    },
    {
        id: 'crumple',
        icon: 'Crumple.png',
        sound: 'Crumple.mp3',
        description: 'Crumple',
        hint: 'Crumple',
        category: 'Misc'
    },
    {
        id: 'soda',
        icon: 'soda.png',
        sound: 'soda.mp3',
        description: 'Soda Can',
        hint: 'Soda Can',
        category: 'Misc'
    },
    {
        id: 'dolphin',
        icon: 'dolphin.png',
        sound: 'dolphin.mp3',
        description: 'Dolphin',
        hint: 'Dolphin',
        category: 'Animals'
    },
    {
        id: 'champagne',
        icon: 'champagne.png',
        sound: 'champagne.mp3',
        description: 'Champagne Pop',
        hint: 'Champagne Pop',
        category: 'Misc'
    },
    {
        id: 'zipper',
        icon: 'zipper.png',
        sound: 'zipper.mp3',
        description: 'Zipper',
        hint: 'Zipper',
        category: 'Misc'
    },
    {
        id: 'campfire',
        icon: 'campfire.png',
        sound: 'campfire.mp3',
        description: 'Campfire',
        hint: 'Campfire',
        category: 'Nature & Ambient'
    },
    {
        id: 'ocean',
        icon: 'ocean.png',
        sound: 'ocean.mp3',
        description: 'Ocean Waves',
        hint: 'Ocean Waves',
        category: 'Nature & Ambient'
    },
    {
        id: 'wind',
        icon: 'wind.png',
        sound: 'wind.mp3',
        description: 'Wind',
        hint: 'Wind',
        category: 'Nature & Ambient'
    },
    {
        id: 'thunder',
        icon: 'thunder.png',
        sound: 'thunder.mp3',
        description: 'Thunder',
        hint: 'Thunder',
        category: 'Nature & Ambient'
    },
    {
        id: 'rain',
        icon: 'rain.png',
        sound: 'rain.mp3',
        description: 'Rain',
        hint: 'Rain',
        category: 'Nature & Ambient'
    },
    {
        id: 'train',
        icon: 'train.png',
        sound: 'train.mp3',
        description: 'Train',
        hint: 'Train',
        category: 'Misc'
    },
    {
        id: 'foodprocessor',
        icon: 'foodprocessor.png',
        sound: 'foodprocessor.mp3',
        description: 'Food Processor',
        hint: 'Food Processor',
        category: 'Misc'
    },
    {
        id: 'seagull',
        icon: 'seagull.png',
        sound: 'seagull.mp3',
        description: 'Seagull',
        hint: 'Seagull',
        category: 'Animals'
    },
    {
        id: 'bird',
        icon: 'bird.png',
        sound: 'bird.mp3',
        description: 'Bird Chirp',
        hint: 'Bird Chirp',
        category: 'Animals'
    },
    {
        id: 'lighter',
        icon: 'lighter.png',
        sound: 'lighter.mp3',
        description: 'Lighter Flick',
        hint: 'Lighter Flick',
        category: 'Misc'
    },
    {
        id: 'cricket',
        icon: 'cricket.png',
        sound: 'cricket.mp3',
        description: 'Cricket',
        hint: 'Cricket',
        category: 'Animals'
    },
    {
        id: 'servicebell',
        icon: 'servicebell.png',
        sound: 'servicebell.mp3',
        description: 'Service Bell',
        hint: 'Service Bell',
        category: 'Misc'
    },
    {
        id: 'curtain',
        icon: 'curtain.png',
        sound: 'curtain.mp3',
        description: 'Curtain Sliding',
        hint: 'Curtain Sliding',
        category: 'Misc'
    },
    {
        id: 'toaster',
        icon: 'toaster.png',
        sound: 'toaster.mp3',
        description: 'Toaster',
        hint: 'Toaster',
        category: 'Misc'
    },
    {
        id: 'knifechop',
        icon: 'knifechop.png',
        sound: 'knifechop.mp3',
        description: 'Knife Chop',
        hint: 'Knife Chop',
        category: 'Misc'
    },
    {
        id: 'mouseclick',
        icon: 'mouseclick.png',
        sound: 'mouseclick.mp3',
        description: 'Mouse Click',
        hint: 'Mouse Click',
        category: 'Misc'
    },
    {
        id: 'keyboard',
        icon: 'keyboard.png',
        sound: 'keyboard.mp3',
        description: 'Keyboard Typing',
        hint: 'Keyboard Typing',
        category: 'Misc'
    },
    {
        id: 'cashregister',
        icon: 'cashregister.png',
        sound: 'cashregister.mp3',
        description: 'Cash Register',
        hint: 'Cash Register',
        category: 'Misc'
    },
    {
        id: 'lion',
        icon: 'lion.png',
        sound: 'lion.mp3',
        description: 'Lion',
        hint: 'Lion',
        category: 'Animals'
    },
    {
        id: 'frog',
        icon: 'frog.png',
        sound: 'frog.mp3',
        description: 'Frog',
        hint: 'Frog',
        category: 'Animals'
    },
    {
        id: 'elephant',
        icon: 'elephant.png',
        sound: 'elephant.mp3',
        description: 'Elephant',
        hint: 'Elephant',
        category: 'Animals'
    },
    {
        id: 'owl',
        icon: 'owl.png',
        sound: 'owl.mp3',
        description: 'Owl',
        hint: 'Owl',
        category: 'Animals'
    },
    {
        id: 'goat',
        icon: 'goat.png',
        sound: 'goat.mp3',
        description: 'Goat',
        hint: 'Goat',
        category: 'Animals'
    },
    {
        id: 'duck',
        icon: 'duck.png',
        sound: 'duck.mp3',
        description: 'Duck',
        hint: 'Duck',
        category: 'Animals'
    },
    {
        id: 'sheep',
        icon: 'sheep.png',
        sound: 'sheep.mp3',
        description: 'Sheep',
        hint: 'Sheep',
        category: 'Animals'
    },
    {
        id: 'horse',
        icon: 'horse.png',
        sound: 'horse.mp3',
        description: 'Horse',
        hint: 'Horse',
        category: 'Animals'
    },
    {
        id: 'pig',
        icon: 'pig.png',
        sound: 'pig.mp3',
        description: 'Pig',
        hint: 'Pig',
        category: 'Animals'
    },
    {
        id: 'dog',
        icon: 'dog.png',
        sound: 'dog.mp3',
        description: 'Dog',
        hint: 'Dog',
        category: 'Animals'
    },
    {
        id: 'cat',
        icon: 'cat.png',
        sound: 'cat.mp3',
        description: 'Cat',
        hint: 'Cat',
        category: 'Animals'
    },
    {
        id: 'cow',
        icon: 'cow.png',
        sound: 'cow.mp3',
        description: 'Cow',
        hint: 'Cow',
        category: 'Animals'
    },
    {
        id: 'chicken',
        icon: 'chicken.png',
        sound: 'chicken.mp3',
        description: 'Chicken',
        hint: 'Chicken',
        category: 'Animals'
    },
    {
        id: 'fireworks',
        icon: 'fireworks.png',
        sound: 'fireworks.mp3',
        description: 'Fireworks',
        hint: 'Fireworks',
        category: 'Misc'
    },
    {
        id: 'swallow',
        icon: 'swallow.png',
        sound: 'swallow.mp3',
        description: 'Swallow',
        hint: 'Swallow',
        category: 'Misc'
    }
    // Add more sound items here as you create them
    // Example: { id: 'newSound', icon: 'newSound.png', sound: 'newSound.mp3', description: 'New Awesome Sound', category: 'SomeCategory' },
];

// Make it available if using modules or for clarity in global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = soundItems; // For Node.js/CommonJS environments (e.g., testing)
} 