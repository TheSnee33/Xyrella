/**
 * World & Level System for "Desperado's Gold"
 * Defines the 3 interconnected Western zones:
 * 1. Rattlesnake Gulch (Desert canyons & Old Pete's camp)
 * 2. Tombstone Flats (Ghost town with saloons, banks, and TNT chuckers)
 * 3. El Dorado Cavern (Subterranean mine & showdown with Black Jack Bart)
 */

class World {
  constructor() {
    this.currentZoneIndex = 0;
    this.zones = [
      this.createZone1(),
      this.createZone2(),
      this.createZone3()
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
      objectiveText: 'Find Old Pete & recover the Canyon Key',

      npc: {
        x: 240,
        y: 620,
        name: 'Old Pete',
        portrait: '🤠',
        dialogue: [
          "Howdy, partner! You're looking for Black Jack Bart's stolen Spanish Chest, ain't ya?",
          "The outlaws fled through the eastern canyon gate and locked it tight behind 'em!",
          "Scorpions and desert snakes swarmed their old camp to the east. The Brass Key is lost out there. Find that key and unlock the canyon gate!",
          "Aim sharp: Press [L] or [SPACE] (or Click) to shoot, and [A] to reload your cylinder!",
          "If you need more lead, tonic, or heavy rifles, Dusty Dan runs a Gunsmith Outpost far across the canyon to the northeast! Bring him the gold you find!"
        ]
      },

      shopkeeper: {
        x: 1275,
        y: 290,
        name: 'Dusty Dan'
      },

      buildings: [
        { x: 1180, y: 150, width: 190, height: 130, type: 'shop' }
      ],

      obstacles: [
        // Northern canyon wall
        { x: 0, y: 0, width: 1900, height: 140, type: 'rock' },
        // Southern canyon wall
        { x: 0, y: 1060, width: 1900, height: 140, type: 'rock' },
        // Middle canyon ridges creating fun adventure corridors
        { x: 450, y: 140, width: 120, height: 350, type: 'rock' },
        { x: 450, y: 700, width: 120, height: 360, type: 'rock' },
        { x: 950, y: 380, width: 160, height: 440, type: 'rock' },
        { x: 1400, y: 140, width: 120, height: 400, type: 'rock' },
        { x: 1400, y: 720, width: 120, height: 340, type: 'rock' },

        // Cacti
        { x: 280, y: 320, width: 24, height: 24, type: 'cactus' },
        { x: 340, y: 880, width: 24, height: 24, type: 'cactus' },
        { x: 700, y: 260, width: 24, height: 24, type: 'cactus' },
        { x: 740, y: 920, width: 24, height: 24, type: 'cactus' },
        { x: 1200, y: 320, width: 24, height: 24, type: 'cactus' },
        { x: 1240, y: 840, width: 24, height: 24, type: 'cactus' },
        { x: 1650, y: 400, width: 24, height: 24, type: 'cactus' },
        { x: 1680, y: 780, width: 24, height: 24, type: 'cactus' }
      ],

      barrels: [
        { x: 220, y: 520, loot: 'coin' }, // Target practice near start!
        { x: 250, y: 550, loot: 'ammo' }, // Extra ammo right at start!
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
        // Easy, gentle slow Scorpions placed comfortably far away
        { x: 820, y: 340, type: 'scorpion', hp: 20, speed: 0.45 },
        { x: 920, y: 860, type: 'scorpion', hp: 20, speed: 0.45 },
        { x: 1340, y: 680, type: 'scorpion', hp: 20, speed: 0.45 },
        // Rattlesnakes - slow speed, safely positioned outside rock ridges
        { x: 1080, y: 280, type: 'snake', hp: 25, speed: 0.5 },
        { x: 1320, y: 860, type: 'snake', hp: 25, speed: 0.5 },
        // Outlaw Scouts - slower movement and relaxed fire rate
        { x: 1560, y: 580, type: 'bandit', hp: 40, speed: 0.55, shootCooldown: 320 },
        { x: 1680, y: 280, type: 'bandit', hp: 40, speed: 0.55, shootCooldown: 320 }
      ],

      treasureChest: null // Found in Zone 3!
    };
  }

  // --- ZONE 2: GHOST TOWN OF TOMBSTONE FLATS ---
  createZone2() {
    return {
      id: 2,
      name: 'Zone 2: Tombstone Flats',
      width: 2200,
      height: 1300,
      backgroundColor: '#c49a5b',
      groundDetails: this.generateGroundDetails(2200, 1300, '#b08447', 220),
      playerStart: { x: 120, y: 650 },
      exitGate: { x: 2120, y: 620, width: 45, height: 110, locked: true, requiredItem: 'map_complete' },
      objectiveText: 'Assemble 3 Lost Map Fragments (0/3)',

      npc: null,
      shopkeeper: {
        x: 1150,
        y: 840,
        name: 'Miss Clara'
      },

      buildings: [
        // Main Street Saloon
        { x: 420, y: 220, width: 220, height: 160, type: 'saloon' },
        // Frontier Bank
        { x: 920, y: 220, width: 200, height: 160, type: 'bank' },
        // Sheriff's Office & Jail
        { x: 1480, y: 220, width: 210, height: 160, type: 'sheriff' },

        // South side buildings
        { x: 480, y: 880, width: 200, height: 150, type: 'saloon' },
        { x: 1040, y: 880, width: 220, height: 150, type: 'shop' },
        { x: 1580, y: 880, width: 200, height: 150, type: 'mine' }
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
        { x: 320, y: 900, width: 24, height: 24, type: 'cactus' },
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
        // 3 Map Fragments
        { x: 530, y: 440, type: 'map', id: 'map_1', name: 'Map Fragment I (Saloon Secret)' },
        { x: 1020, y: 440, type: 'map', id: 'map_2', name: 'Map Fragment II (Bank Vault Code)' },
        { x: 1580, y: 440, type: 'map', id: 'map_3', name: 'Map Fragment III (Sheriff Desk)' },

        { x: 780, y: 640, type: 'coin', val: 100 },
        { x: 1340, y: 640, type: 'coin', val: 100 },
        { x: 1900, y: 640, type: 'ammo' }
      ],

      enemies: [
        // Outlaws & Dynamite Throwers guarding the Ghost Town
        { x: 600, y: 550, type: 'bandit', hp: 70, speed: 1.5, shootCooldown: 150 },
        { x: 750, y: 720, type: 'bandit', hp: 70, speed: 1.5, shootCooldown: 140 },
        { x: 950, y: 520, type: 'dynamite', hp: 60, speed: 1.7, throwCooldown: 220 },
        { x: 1180, y: 750, type: 'bandit', hp: 80, speed: 1.5, shootCooldown: 130 },
        { x: 1350, y: 520, type: 'dynamite', hp: 60, speed: 1.7, throwCooldown: 200 },
        { x: 1550, y: 720, type: 'bandit', hp: 80, speed: 1.5, shootCooldown: 120 },
        { x: 1750, y: 580, type: 'bandit', hp: 85, speed: 1.6, shootCooldown: 110 },
        { x: 1800, y: 700, type: 'dynamite', hp: 65, speed: 1.7, throwCooldown: 190 },
        { x: 1950, y: 640, type: 'bandit', hp: 90, speed: 1.6, shootCooldown: 100 }
      ],

      treasureChest: null
    };
  }

  // --- ZONE 3: EL DORADO'S CAVERN & THE FINAL SHOWDOWN ---
  createZone3() {
    return {
      id: 3,
      name: "Zone 3: El Dorado's Cavern",
      width: 2000,
      height: 1200,
      backgroundColor: '#2e1c14', // subterranean dark rock
      groundDetails: this.generateGroundDetails(2000, 1200, '#422a1f', 240, true),
      playerStart: { x: 140, y: 600 },
      exitGate: null, // End of the adventure! Open chest to win!
      objectiveText: 'Defeat Black Jack Bart & Claim the Treasure!',

      npc: null,
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
        { x: 650, y: 420, type: 'bandit', hp: 90, speed: 1.6, shootCooldown: 120 },
        { x: 650, y: 780, type: 'bandit', hp: 90, speed: 1.6, shootCooldown: 120 },
        { x: 1150, y: 400, type: 'dynamite', hp: 80, speed: 1.7, throwCooldown: 170 },
        { x: 1150, y: 800, type: 'bandit', hp: 95, speed: 1.6, shootCooldown: 110 },

        // BOSS: BLACK JACK BART
        {
          x: 1600,
          y: 600,
          type: 'boss',
          name: 'Black Jack Bart',
          hp: 450,
          maxHp: 450,
          speed: 1.8,
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
        color: isCave && Math.random() < 0.25 ? '#ffd700' : color, // gold nuggets sparkle in cave!
        isSparkle: isCave && Math.random() < 0.25
      });
    }
    return details;
  }
}

window.World = World;
