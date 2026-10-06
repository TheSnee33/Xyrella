# 🏜️ Desperado's Gold: The Legend of Dead Man's Creek

An action-packed 2D Wild West adventure game built with HTML5 Canvas, Web Audio API, and pure vanilla JavaScript. 

Take on the role of **Colt "Quickdraw" Cassidy** as you navigate treacherous desert canyons, ghost towns overrun by outlaws, and subterranean cavern labyrinths in search of the legendary **Spanish Treasure Chest**.

![Wild West Theme](https://img.shields.io/badge/Wild%20West-Adventure-d4af37?style=for-the-badge)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%202D-e44d26?style=for-the-badge)
![Web Audio API](https://img.shields.io/badge/Web%20Audio-Procedural%20SFX-blueviolet?style=for-the-badge)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success?style=for-the-badge)

---

## 📖 The Story

The year is 1881 in the scorching Arizona Badlands. Whispers echo through every saloon of the **Lost Spanish Treasure Chest**—a relics vault packed to the brim with royal gold doubloons, silver ingots, and Aztec rubies.

The notorious bandit warlord **Black Jack Bart** plundered the chest and buried it deep within Dead Man's Creek, locking the canyon gates and scattering the map fragments across the ghost town of Tombstone Flats. 

Armed only with your trusty six-shooter revolver and a handful of cartridges, you must follow the trail, rescue Old Pete's secrets, take down Black Jack's gang, and crack open the legendary chest!

---

## 🎮 Controls

| Action | Key / Input | Description |
| :--- | :--- | :--- |
| **Move Cassidy** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>Arrow Keys</kbd> | 8-directional smooth movement with walking animation and dust particles |
| **Shoot Revolver** | <kbd>SPACE BAR</kbd> | Fires a high-velocity revolver shot in the facing direction |
| **Quick Reload** | <kbd>R</kbd> | Refills the 6-chamber cylinder (or auto-reloads when clicking on empty) |
| **Interact / Talk** | <kbd>E</kbd> | Converse with Old Pete, read clues, open gates, and unlock chests |
| **Dead-Eye Focus** | <kbd>F</kbd> | Slows down time by 65% when Grit gauge is filled, enabling rapid precision shots |
| **Toggle Sound** | <kbd>M</kbd> | Mutes or unmutes sound effects and ambient western music |

---

## 🌟 Key Features

### 1. Authentic Western Gunslinging Mechanics
- **Six-Shooter Cylinder HUD**: Real-time rotating 6-chamber cylinder display showing live ammo status and reload cycles.
- **Dead-Eye Grit System**: Landing hits on outlaws fills your Grit meter. Trigger Dead-Eye mode (`F`) to enter bullet-time slow-motion!
- **Dynamic Ballistics & Ricochets**: Bullets spark off solid rock walls, splinter wooden barrels, and make ricochet pings.

### 2. Multi-Zone Adventure Progression
- **Zone 1: Rattlesnake Gulch**: The desert frontier. Consult with Old Pete the prospector, battle stinging desert scorpions and rattlesnakes, and locate the Brass Gate Key to pass the canyon choke point.
- **Zone 2: Tombstone Flats (Ghost Town)**: Navigate dusty town streets lined with The Dusty Horseshoe Saloon, Frontier Bank, and Sheriff's Jail. Evade outlaw sharpshooters and TNT-lobbing Dynamite Chuckers to piece together 3 Torn Map Fragments!
- **Zone 3: El Dorado's Cavern & Showdown**: Subterranean gold mine lit by torchlight. Duel **Black Jack Bart** in an epic boss fight, conquer his outlaw guards, and unlock the **Spanish Treasure Chest**!

### 3. Pure Procedural Web Audio Engine (`js/audio.js`)
- **Zero external audio file dependencies**—runs instantly with zero latency and 100% offline reliability.
- Dynamically synthesized:
  - Punchy revolver gunshots with gunpowder blast and metallic ring
  - High-pitch bullet ricochet pings
  - Rotating cylinder clicks and hammer strikes
  - Rattlesnake warning rattles and scorpion scurries
  - Dynamite sizzle and booming explosions
  - Wood splintering crashes for destructible barrels
  - Ennio Morricone-inspired ambient western soundtrack featuring plucked nylon strings and whistled melodies!

### 4. Custom Canvas 2D Vector Sprites (`js/sprites.js`)
- Handcrafted procedural art for Colt Cassidy, bandits, TNT throwers, boss Black Jack Bart, Old Pete, tumbleweeds rolling with the wind, cacti, saloons, and the shimmering gold Spanish chest.

---

## 🚀 How to Play

### Option 1: Double-Click Local Play
Simply open [`index.html`](index.html) in any modern web browser (Chrome, Edge, Firefox, Safari). No installation or build steps required!

### Option 2: Run with a Local Web Server
If you prefer running via a local server:

**Using Python:**
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

**Using Node / npx:**
```bash
npx serve .
```

### Option 3: GitHub Pages
Enable GitHub Pages in this repository settings (`Settings -> Pages -> Deploy from Branch 'main' / root`) to play anywhere online!

---

## 📁 Repository Structure

```
wild-west-treasure-quest/
├── index.html        # Main HTML5 game interface, Western HUD & modals
├── styles.css        # Vintage parchment styling, wood borders & animations
├── README.md         # Documentation & guide
└── js/
    ├── audio.js      # Procedural Web Audio synthesizer (SFX & music)
    ├── sprites.js    # Canvas 2D vector rendering for all characters & items
    ├── world.js      # Level layouts, obstacle maps, and quest objectives
    └── game.js       # Game loop, input handling, combat physics, & AI
```

---

## 🏆 Scoring & Gunslinger Ranks

At the end of your adventure, your run is evaluated based on:
- **Total Gold Stashed**
- **Outlaws & Desert Beasts Cleared**
- **Shooting Accuracy %**
- **Clear Time**

Can you achieve the rank of **Legendary Western Sheriff ⭐️**?

---

*Created for https://github.com/TheSnee33*
