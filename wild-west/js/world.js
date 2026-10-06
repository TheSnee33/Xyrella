/**
 * World & Level System for "Desperado's Gold"
 * Defines 5 progressive Western levels:
 * 1. Rattlesnake Gulch (Easy & relaxed intro, Gunsmith + Blacksmith Armory, Canyon Brass Key)
 * 2. Coyote Ridge & Outlaw Camp (Switchback canyons, Silver Outlaw Key)
 * 3. Tombstone Flats Ghost Town (Saloon, bank, gunfights, Gold Skeleton Key)
 * 4. Smuggler's Canyon & Rail Depot (High-speed train depot, heavy bandits, Cavern Vault Key)
 * 5. El Dorado Cavern (Subterranean mine & final showdown with Black Jack Bart)
 */

class World {
  constructor() {
    this.currentZoneIndex = 0;
    this.zones = [
      this.createZone1(),
      this.createZone2(),
      this.createZone3(),
      this.createZone4(),
      this.createZone5()
    ];
  }

  getCurrentZone() {
    return this.zones[this.currentZoneIndex];
  }

  // --- ZONE 1: RATTLESNAKE GULCH ---
  createZone1() {
    return {
      id: 1,
      name: 'Zone 1: Rattlesnake Gulch',
      width: 1900,
      height: 1200,
      backgroundColor: '#d8b168',
      groundDetails: this.generateGroundDetails(1900, 1200, '#c79c53', 180),
      playerStart: { x: 120, y: 600 },
      exitGate: { x: 1820, y: 550, width: 40, height: 100, locked: true, requiredItem: 'canyon_key' },
      objectiveText: 'Find Canyon Key to Unlock Level 2',

      npc: {
        x: 240,
        y: 620,
        name: 'Old Pete',
        portrait: '🤠',
        dialogue: [
          "Howdy, partner! You're looking for Black Jack Bart's stolen Spanish Chest, ain't ya?",
          "The outlaws fled through the eastern canyon gate and locked it tight behind 'em!",
          "Scorpions and desert snakes swarmed their old camp to the east. The Brass Key is lost out there. Find that key and unlock the canyon gate to advance!",
          "Aim sharp: Press [W][A][S][D] to move, [L] or [SPACE] (or Click) to shoot, and [K] to reload your cylinder!",
          "Visit Dusty Dan's Gunsmith to the northeast and Iron Jack's Blacksmith Armory just north of here to buy armor, vests, boots, and rifles!"
        ]
      },

      shopkeepers: [
        {
          x: 375,
          y: 290,
          name: 'Iron Jack (Blacksmith)',
          shopTab: 'armor'
        },
        {
          x: 1315,
          y: 290,
          name: 'Dusty Dan (Gunsmith)',
          shopTab: 'weapons'
        }
      ],

      buildings: [
        { x: 280, y: 150, width: 190, height: 130, type: 'armory' },
        { x: 1220, y: 150, width: 190, height: 130, type: 'shop' }
      ],

      obstacles: [
        // Northern canyon wall
        { x: 0, y: 0, width: 1900, height: 140, type: 'rock' },
        // Southern canyon wall
        { x: 0, y: 1060, width: 1900, height: 140, type: 'rock' },
        // Middle canyon ridges creating adventure corridors
        { x: 500, y: 140, width: 110, height: 350, type: 'rock' },
        { x: 500, y: 700, width: 110, height: 360, type: 'rock' },
        { x: 950, y: 380, width: 150, height: 440, type: 'rock' },
        { x: 1440, y: 140, width: 110, height: 400, type: 'rock' },
        { x: 1440, y: 720, width: 110, height: 340, type: 'rock' },

        // Cacti
        { x: 280, y: 420, width: 24, height: 24, type: 'cactus' },
        { x: 340, y: 880, width: 24, height: 24, type: 'cactus' },
        { x: 720, y: 260, width: 24, height: 24, type: 'cactus' },
        { x: 740, y: 920, width: 24, height: 24, type: 'cactus' },
        { x: 1180, y: 420, width: 24, height: 24, type: 'cactus' },
        { x: 1240, y: 840, width: 24, height: 24, type: 'cactus' },
        { x: 1650, y: 400, width: 24, height: 24, type: 'cactus' },
        { x: 1680, y: 780, width: 24, height: 24, type: 'cactus' }
      ],

      barrels: [
        { x: 220, y: 520, loot: 'coin' },
        { x: 250, y: 550, loot: 'ammo' },
        { x: 300, y: 640, loot: 'health' },
        { x: 720, y: 550, loot: 'health' },
        { x: 750, y: 580, loot: 'coin' },
        { x: 1260, y: 520, loot: 'coin' },
        { x: 1290, y: 560, loot: 'ammo' },
        { x: 1550, y: 300, loot: 'coin' }
      ],

      pickups: [
        { x: 1680, y: 240, type: 'key', id: 'canyon_key', name: 'Canyon Brass Key' },
        { x: 360, y: 580, type: 'coin', val: 50 },
        { x: 620, y: 200, type: 'coin', val: 50 },
        { x: 800, y: 980, type: 'coin', val: 50 },
        { x: 1300, y: 200, type: 'health' }
      ],

      enemies: [
        // Easy, gentle slow Scorpions
        { x: 820, y: 340, type: 'scorpion', hp: 20, speed: 0.45 },
        { x: 920, y: 860, type: 'scorpion', hp: 20, speed: 0.45 },
        { x: 1340, y: 680, type: 'scorpion', hp: 20, speed: 0.45 },
        // Rattlesnakes - slow speed
        { x: 1080, y: 280, type: 'snake', hp: 25, speed: 0.5 },
        { x: 1320, y: 860, type: 'snake', hp: 25, speed: 0.5 },
        // Outlaw Scouts - gentle aim
        { x: 1580, y: 580, type: 'bandit', hp: 40, speed: 0.55, shootCooldown: 320 },
        { x: 1680, y: 320, type: 'bandit', hp: 40, speed: 0.55, shootCooldown: 320 }
      ],

      treasureChest: null
    };
  }

  // --- ZONE 2: COYOTE RIDGE & OUTLAW CAMP ---
  createZone2() {
    return {
      id: 2,
      name: 'Zone 2: Coyote Ridge & Outlaw Camp',
      width: 2000,
      height: 1200,
      backgroundColor: '#cf9d56',
      groundDetails: this.generateGroundDetails(2000, 1200, '#be8a44', 200),
      playerStart: { x: 120, y: 600 },
      exitGate: { x: 1920, y: 560, width: 40, height: 100, locked: true, requiredItem: 'silver_key' },
      objectiveText: 'Find Silver Outlaw Key to Unlock Level 3',

      npc: null,

      shopkeepers: [
        {
          x: 445,
          y: 290,
          name: 'Bronc (Armorer)',
          shopTab: 'armor'
        },
        {
          x: 1145,
          y: 290,
          name: 'Trader Dan',
          shopTab: 'weapons'
        }
      ],

      buildings: [
        { x: 350, y: 150, width: 190, height: 130, type: 'armory' },
        { x: 1050, y: 150, width: 190, height: 130, type: 'shop' }
      ],

      obstacles: [
        // Canyon walls
        { x: 0, y: 0, width: 2000, height: 130, type: 'rock' },
        { x: 0, y: 1070, width: 2000, height: 130, type: 'rock' },
        // Rock ridges
        { x: 600, y: 380, width: 120, height: 420, type: 'rock' },
        { x: 1350, y: 130, width: 120, height: 380, type: 'rock' },
        { x: 1350, y: 700, width: 120, height: 370, type: 'rock' },

        // Cacti & Crates
        { x: 260, y: 440, width: 24, height: 24, type: 'cactus' },
        { x: 800, y: 260, width: 30, height: 30, type: 'crate' },
        { x: 800, y: 300, width: 30, height: 30, type: 'crate' },
        { x: 1600, y: 440, width: 24, height: 24, type: 'cactus' },
        { x: 1650, y: 800, width: 24, height: 24, type: 'cactus' }
      ],

      barrels: [
        { x: 280, y: 540, loot: 'ammo' },
        { x: 320, y: 580, loot: 'coin' },
        { x: 780, y: 520, loot: 'health' },
        { x: 820, y: 560, loot: 'coin' },
        { x: 1200, y: 700, loot: 'ammo' },
        { x: 1550, y: 380, loot: 'coin' },
        { x: 1600, y: 420, loot: 'health' }
      ],

      pickups: [
        { x: 1750, y: 840, type: 'key', id: 'silver_key', name: 'Silver Outlaw Key' },
        { x: 500, y: 750, type: 'coin', val: 75 },
        { x: 920, y: 240, type: 'coin', val: 75 },
        { x: 1450, y: 920, type: 'coin', val: 75 },
        { x: 1750, y: 240, type: 'health' }
      ],

      enemies: [
        // Moderate speeds as player gets better weapons
        { x: 750, y: 720, type: 'scorpion', hp: 30, speed: 0.65 },
        { x: 950, y: 500, type: 'snake', hp: 35, speed: 0.7 },
        { x: 1150, y: 750, type: 'bandit', hp: 55, speed: 0.75, shootCooldown: 240 },
        { x: 1520, y: 350, type: 'bandit', hp: 60, speed: 0.75, shootCooldown: 220 },
        { x: 1720, y: 780, type: 'dynamite', hp: 50, speed: 0.8, throwCooldown: 240 },
        { x: 1800, y: 450, type: 'bandit', hp: 65, speed: 0.8, shootCooldown: 200 }
      ],

      treasureChest: null
    };
  }

  // --- ZONE 3: GHOST TOWN OF TOMBSTONE FLATS ---
  createZone3() {
    return {
      id: 3,
      name: 'Zone 3: Tombstone Flats (Ghost Town)',
      width: 2200,
      height: 1300,
      backgroundColor: '#c49a5b',
      groundDetails: this.generateGroundDetails(2200, 1300, '#b08447', 220),
      playerStart: { x: 120, y: 650 },
      exitGate: { x: 2120, y: 620, width: 45, height: 110, locked: true, requiredItem: 'gold_key' },
      objectiveText: 'Find Gold Skeleton Key to Unlock Level 4',

      npc: null,

      shopkeepers: [
        {
          x: 580,
          y: 1040,
          name: 'Forge Master Vance',
          shopTab: 'armor'
        },
        {
          x: 1150,
          y: 1040,
          name: 'Miss Clara',
          shopTab: 'weapons'
        }
      ],

      buildings: [
        // North side buildings
        { x: 420, y: 220, width: 220, height: 160, type: 'saloon' },
        { x: 920, y: 220, width: 200, height: 160, type: 'bank' },
        { x: 1480, y: 220, width: 210, height: 160, type: 'sheriff' },

        // South side buildings
        { x: 480, y: 880, width: 200, height: 150, type: 'armory' },
        { x: 1040, y: 880, width: 220, height: 150, type: 'shop' }
      ],

      obstacles: [
        // Town borders
        { x: 0, y: 0, width: 2200, height: 120, type: 'rock' },
        { x: 0, y: 1180, width: 2200, height: 120, type: 'rock' },

        // Crates & Cacti in alleys
        { x: 700, y: 320, width: 40, height: 40, type: 'crate' },
        { x: 700, y: 370, width: 40, height: 40, type: 'crate' },
        { x: 1240, y: 300, width: 40, height: 40, type: 'crate' },
        { x: 800, y: 920, width: 40, height: 40, type: 'crate' },
        { x: 1380, y: 920, width: 40, height: 40, type: 'crate' },

        { x: 280, y: 400, width: 24, height: 24, type: 'cactus' },
        { x: 1850, y: 440, width: 24, height: 24, type: 'cactus' },
        { x: 1880, y: 860, width: 24, height: 24, type: 'cactus' }
      ],

      barrels: [
        { x: 400, y: 390, loot: 'ammo' },
        { x: 660, y: 390, loot: 'coin' },
        { x: 900, y: 390, loot: 'health' },
        { x: 1140, y: 390, loot: 'coin' },
        { x: 1460, y: 390, loot: 'ammo' },
        { x: 460, y: 860, loot: 'coin' },
        { x: 1020, y: 860, loot: 'ammo' },
        { x: 1560, y: 860, loot: 'health' }
      ],

      pickups: [
        { x: 1650, y: 390, type: 'key', id: 'gold_key', name: 'Gold Skeleton Key' },
        { x: 780, y: 640, type: 'coin', val: 100 },
        { x: 1340, y: 640, type: 'coin', val: 100 },
        { x: 1900, y: 640, type: 'ammo' },
        { x: 980, y: 390, type: 'coin', val: 150 }
      ],

      enemies: [
        // Faster gunfights across Main Street
        { x: 600, y: 550, type: 'bandit', hp: 70, speed: 1.0, shootCooldown: 180 },
        { x: 750, y: 720, type: 'bandit', hp: 70, speed: 1.0, shootCooldown: 170 },
        { x: 950, y: 520, type: 'dynamite', hp: 60, speed: 1.1, throwCooldown: 220 },
        { x: 1180, y: 750, type: 'bandit', hp: 75, speed: 1.0, shootCooldown: 160 },
        { x: 1350, y: 520, type: 'dynamite', hp: 60, speed: 1.1, throwCooldown: 200 },
        { x: 1550, y: 720, type: 'bandit', hp: 80, speed: 1.1, shootCooldown: 150 },
        { x: 1750, y: 580, type: 'bandit', hp: 80, speed: 1.1, shootCooldown: 140 },
        { x: 1950, y: 640, type: 'bandit', hp: 85, speed: 1.1, shootCooldown: 130 }
      ],

      treasureChest: null
    };
  }

  // --- ZONE 4: SMUGGLER'S CANYON & RAIL DEPOT ---
  createZone4() {
    return {
      id: 4,
      name: "Zone 4: Smuggler's Canyon & Rail Depot",
      width: 2200,
      height: 1200,
      backgroundColor: '#a1887f',
      groundDetails: this.generateGroundDetails(2200, 1200, '#8d6e63', 220),
      playerStart: { x: 120, y: 600 },
      exitGate: { x: 2120, y: 560, width: 45, height: 110, locked: true, requiredItem: 'mine_key' },
      objectiveText: 'Recover Cavern Vault Key to Unlock Level 5',

      npc: null,

      shopkeepers: [
        {
          x: 445,
          y: 290,
          name: 'Hank (Iron Works)',
          shopTab: 'armor'
        },
        {
          x: 1245,
          y: 290,
          name: 'Silas (Rail Armory)',
          shopTab: 'weapons'
        }
      ],

      buildings: [
        { x: 350, y: 150, width: 210, height: 130, type: 'armory' },
        { x: 1150, y: 150, width: 210, height: 130, type: 'shop' }
      ],

      obstacles: [
        // Canyon walls
        { x: 0, y: 0, width: 2200, height: 130, type: 'rock' },
        { x: 0, y: 1070, width: 2200, height: 130, type: 'rock' },

        // Heavy freight crates and train depot structures
        { x: 650, y: 400, width: 140, height: 350, type: 'rock' },
        { x: 1450, y: 130, width: 130, height: 420, type: 'rock' },
        { x: 1450, y: 720, width: 130, height: 350, type: 'rock' },

        { x: 850, y: 260, width: 50, height: 50, type: 'crate' },
        { x: 850, y: 320, width: 50, height: 50, type: 'crate' },
        { x: 1050, y: 750, width: 50, height: 50, type: 'crate' },
        { x: 1050, y: 810, width: 50, height: 50, type: 'crate' }
      ],

      barrels: [
        { x: 300, y: 520, loot: 'ammo' },
        { x: 500, y: 780, loot: 'coin' },
        { x: 920, y: 520, loot: 'health' },
        { x: 1100, y: 600, loot: 'coin' },
        { x: 1650, y: 450, loot: 'ammo' },
        { x: 1700, y: 800, loot: 'coin' }
      ],

      pickups: [
        { x: 1850, y: 880, type: 'key', id: 'mine_key', name: 'Cavern Vault Key' },
        { x: 600, y: 250, type: 'coin', val: 150 },
        { x: 1300, y: 850, type: 'coin', val: 150 },
        { x: 1950, y: 300, type: 'health' }
      ],

      enemies: [
        // Fast, high-stakes outlaws
        { x: 750, y: 800, type: 'bandit', hp: 85, speed: 1.3, shootCooldown: 140 },
        { x: 950, y: 450, type: 'dynamite', hp: 75, speed: 1.4, throwCooldown: 190 },
        { x: 1250, y: 750, type: 'bandit', hp: 90, speed: 1.3, shootCooldown: 130 },
        { x: 1400, y: 500, type: 'dynamite', hp: 75, speed: 1.4, throwCooldown: 180 },
        { x: 1650, y: 650, type: 'bandit', hp: 95, speed: 1.35, shootCooldown: 120 },
        { x: 1800, y: 800, type: 'bandit', hp: 95, speed: 1.35, shootCooldown: 110 }
      ],

      treasureChest: null
    };
  }

  // --- ZONE 5: EL DORADO'S CAVERN & THE FINAL SHOWDOWN ---
  createZone5() {
    return {
      id: 5,
      name: "Zone 5: El Dorado's Cavern",
      width: 2000,
      height: 1200,
      backgroundColor: '#2e1c14', // subterranean dark rock
      groundDetails: this.generateGroundDetails(2000, 1200, '#422a1f', 240, true),
      playerStart: { x: 140, y: 600 },
      exitGate: null, // End of the adventure! Open chest to win!
      objectiveText: 'Defeat Black Jack Bart & Claim the Spanish Treasure!',

      npc: null,
      shopkeepers: [],
      buildings: [],

      obstacles: [
        // Cavern walls
        { x: 0, y: 0, width: 2000, height: 160, type: 'cave_rock' },
        { x: 0, y: 1040, width: 2000, height: 160, type: 'cave_rock' },

        // Pillars of the underground chamber
        { x: 500, y: 320, width: 80, height: 140, type: 'cave_rock' },
        { x: 500, y: 740, width: 80, height: 140, type: 'cave_rock' },
        { x: 950, y: 260, width: 100, height: 180, type: 'cave_rock' },
        { x: 950, y: 760, width: 100, height: 180, type: 'cave_rock' },
        { x: 1400, y: 320, width: 80, height: 140, type: 'cave_rock' },
        { x: 1400, y: 740, width: 80, height: 140, type: 'cave_rock' }
      ],

      barrels: [
        { x: 380, y: 480, loot: 'ammo' },
        { x: 380, y: 720, loot: 'health' },
        { x: 800, y: 500, loot: 'ammo' },
        { x: 800, y: 700, loot: 'health' },
        { x: 1300, y: 450, loot: 'ammo' },
        { x: 1300, y: 750, loot: 'health' }
      ],

      pickups: [
        { x: 600, y: 600, type: 'coin', val: 200 },
        { x: 1100, y: 600, type: 'coin', val: 200 }
      ],

      enemies: [
        // Henchmen elite guards
        { x: 650, y: 420, type: 'bandit', hp: 90, speed: 1.4, shootCooldown: 130 },
        { x: 650, y: 780, type: 'bandit', hp: 90, speed: 1.4, shootCooldown: 130 },
        { x: 1150, y: 400, type: 'dynamite', hp: 80, speed: 1.5, throwCooldown: 170 },
        { x: 1150, y: 800, type: 'bandit', hp: 95, speed: 1.4, shootCooldown: 120 },

        // BOSS: BLACK JACK BART
        {
          x: 1600,
          y: 600,
          type: 'boss',
          name: 'Black Jack Bart',
          hp: 500,
          maxHp: 500,
          speed: 1.6,
          shootCooldown: 80,
          isBoss: true
        }
      ],

      // THE SPANISH TREASURE CHEST!
      treasureChest: {
        x: 1820,
        y: 600,
        isOpen: false,
        radius: 35
      }
    };
  }

  generateGroundDetails(w, h, color, count, isCave = false) {
    const details = [];
    for (let i = 0; i < count; i++) {
      details.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 2 + Math.random() * 5,
        color: isCave && Math.random() < 0.25 ? '#ffd700' : color,
        isSparkle: isCave && Math.random() < 0.25
      });
    }
    return details;
  }
}

window.World = World;
