/**
 * Core Game Engine for "Desperado's Gold"
 * Manages game loop, physics, keyboard controls (Movement + Space to shoot),
 * combat mechanics, particles, camera tracking, and HUD state.
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Display sizing
    this.viewWidth = 960;
    this.viewHeight = 600;

    // Game state
    this.state = 'start'; // 'start', 'playing', 'dialogue', 'level_complete', 'game_over', 'victory'
    this.world = new World();
    this.currentZone = this.world.getCurrentZone();

    // Camera
    this.camera = { x: 0, y: 0 };

    // Player State
    this.player = {
      x: 100,
      y: 600,
      radius: 16,
      speed: 3.8,
      vx: 0,
      vy: 0,
      facingAngle: 0,
      lastMoveAngle: 0,
      isMoving: false,
      gender: 'male', // 'male' (Colt Cassidy) or 'female' (Sadie Sinclair)
      weaponType: 'revolver', // 'revolver', 'shotgun', 'dual_revolvers', 'repeater', 'buffalo_rifle'
      armor: 'none', // 'none', 'leather', 'steel', 'gold'
      armorReduction: 0,
      hasBoots: false,
      hasBandolier: false,
      hp: 100,
      maxHp: 100,
      ammo: 6,
      maxAmmo: 6,
      isReloading: false,
      reloadProgress: 0,
      recoilTimer: 0,
      invulnerableTimer: 0,
      isShooting: false,
      grit: 0,
      maxGrit: 100,
      deadEyeActive: false,
      deadEyeTimer: 0
    };

    // Inventory & Stats
    this.inventory = {
      gold: 75,
      dynamites: 0,
      canyon_key: false,
      silver_key: false,
      gold_key: false,
      mine_key: false,
      mapFragments: 0,
      map_complete: false
    };

    this.shopOpen = false;

    this.stats = {
      shotsFired: 0,
      shotsHit: 0,
      banditsKilled: 0,
      startTime: Date.now(),
      zoneKills: 0,
      zoneGold: 0
    };

    // Entities in active zone
    this.bullets = [];       // Player bullets
    this.enemyBullets = [];  // Outlaw bullets
    this.dynamites = [];     // Thrown dynamite
    this.enemies = [];
    this.barrels = [];
    this.pickups = [];
    this.tumbleweeds = [];
    this.particles = [];
    this.floatingTexts = [];

    // Dialogue State
    this.dialogueQueue = [];
    this.dialogueActive = false;

    // Keys State
    this.keys = {};

    // Animation / Time
    this.lastTime = performance.now();
    this.gameTime = 0;

    // DOM HUD elements
    this.dom = {
      healthBar: document.getElementById('health-bar'),
      healthText: document.getElementById('health-text'),
      gritBar: document.getElementById('grit-bar'),
      gritText: document.getElementById('grit-text'),
      cylinderDisplay: document.getElementById('cylinder-display'),
      ammoText: document.getElementById('ammo-text'),
      weaponLabel: document.getElementById('weapon-label'),
      goldCount: document.getElementById('gold-count'),
      tntCount: document.getElementById('tnt-count'),
      objectiveCounter: document.getElementById('objective-counter'),
      zoneName: document.getElementById('zone-name'),
      bannerNotification: document.getElementById('banner-notification'),
      dialogueBox: document.getElementById('dialogue-box'),
      dialogueSpeaker: document.getElementById('dialogue-speaker'),
      dialogueText: document.getElementById('dialogue-text'),
      deadeyeOverlay: document.getElementById('deadeye-overlay'),
      shopModal: document.getElementById('shop-modal'),
      shopGoldDisplay: document.getElementById('shop-gold-display'),
      shopCloseBtn: document.getElementById('shop-close-btn'),
      screenStart: document.getElementById('screen-start'),
      screenLevelComplete: document.getElementById('screen-level-complete'),
      screenGameOver: document.getElementById('screen-game-over'),
      screenVictory: document.getElementById('screen-victory')
    };

    this.initEventListeners();
    this.spawnTumbleweeds();
    this.buildCylinderHUD();
    this.requestLoop();
  }

  // --- INITIALIZATION ---
  initEventListeners() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Mouse click shooting on canvas
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.state === 'playing') {
        this.shootWeapon();
      }
    });

    // Character Selection
    const optColt = document.getElementById('opt-colt');
    const optSadie = document.getElementById('opt-sadie');
    if (optColt && optSadie) {
      optColt.addEventListener('click', () => {
        optColt.classList.add('selected');
        optSadie.classList.remove('selected');
        this.player.gender = 'male';
      });
      optSadie.addEventListener('click', () => {
        optSadie.classList.add('selected');
        optColt.classList.remove('selected');
        this.player.gender = 'female';
      });
    }

    // Shop Close Button
    if (this.dom.shopCloseBtn) {
      this.dom.shopCloseBtn.addEventListener('click', () => this.closeShop());
    }

    // Shop Tabs Switching
    const tabWeapons = document.getElementById('tab-btn-weapons');
    const tabArmor = document.getElementById('tab-btn-armor');
    const gridWeapons = document.getElementById('grid-weapons');
    const gridArmor = document.getElementById('grid-armor');

    if (tabWeapons && tabArmor && gridWeapons && gridArmor) {
      tabWeapons.addEventListener('click', () => {
        tabWeapons.classList.add('active');
        tabArmor.classList.remove('active');
        gridWeapons.style.display = 'grid';
        gridArmor.style.display = 'none';
      });
      tabArmor.addEventListener('click', () => {
        tabArmor.classList.add('active');
        tabWeapons.classList.remove('active');
        gridArmor.style.display = 'grid';
        gridWeapons.style.display = 'none';
      });
    }

    // Shop Item Purchase Buttons
    document.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemKey = e.target.getAttribute('data-item');
        this.buyShopItem(itemKey);
      });
    });

    // Start Screen Button
    document.getElementById('btn-start-game').addEventListener('click', () => {
      window.soundEngine.init();
      window.soundEngine.startMusic();
      this.dom.screenStart.classList.add('hidden');
      this.state = 'playing';
      this.loadZone(0);
    });

    // Next Level Button
    document.getElementById('btn-next-level').addEventListener('click', () => {
      this.dom.screenLevelComplete.classList.add('hidden');
      this.world.currentZoneIndex++;
      this.loadZone(this.world.currentZoneIndex);
      this.state = 'playing';
    });

    // Retry Button
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.dom.screenGameOver.classList.add('hidden');
      this.player.hp = this.player.maxHp;
      this.player.ammo = this.player.maxAmmo;
      this.loadZone(this.world.currentZoneIndex);
      this.state = 'playing';
    });

    // Play Again Button
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.dom.screenVictory.classList.add('hidden');
      this.inventory.gold = 75;
      this.inventory.dynamites = 0;
      this.inventory.canyon_key = false;
      this.inventory.silver_key = false;
      this.inventory.gold_key = false;
      this.inventory.mine_key = false;
      this.player.armor = 'none';
      this.player.armorReduction = 0;
      this.player.hasBoots = false;
      this.player.hasBandolier = false;
      this.player.maxAmmo = 6;
      this.player.speed = 3.8;
      this.player.maxHp = 100;
      this.player.hp = 100;
      this.player.weaponType = 'revolver';
      this.buildCylinderHUD();
      this.stats.banditsKilled = 0;
      this.stats.shotsFired = 0;
      this.stats.shotsHit = 0;
      this.stats.startTime = Date.now();
      this.world = new World();
      this.loadZone(0);
      this.state = 'playing';
    });

    // Sound toggle button
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      const active = window.soundEngine.toggleMute();
      document.getElementById('btn-sound-toggle').innerText = active ? '🔊 Sound: ON' : '🔈 Sound: OFF';
    });
  }

  buildCylinderHUD() {
    this.dom.cylinderDisplay.innerHTML = '';
    const maxA = this.player.maxAmmo || 6;
    for (let i = 0; i < maxA; i++) {
      const chamber = document.createElement('div');
      chamber.className = 'bullet-chamber loaded';
      chamber.id = `chamber-${i}`;
      this.dom.cylinderDisplay.appendChild(chamber);
    }
  }

  updateCylinderHUD() {
    const maxA = this.player.maxAmmo || 6;
    for (let i = 0; i < maxA; i++) {
      const chamber = document.getElementById(`chamber-${i}`);
      if (chamber) {
        if (i < this.player.ammo) {
          chamber.classList.add('loaded');
        } else {
          chamber.classList.remove('loaded');
        }
      }
    }
    this.dom.ammoText.innerText = this.player.isReloading ? 'RELOADING...' : `${this.player.ammo} / ${maxA} [K]`;

    if (this.dom.weaponLabel) {
      let lbl = 'SIX-SHOOTER';
      if (this.player.weaponType === 'shotgun') lbl = 'SAWED-OFF SHOTGUN';
      else if (this.player.weaponType === 'dual_revolvers') lbl = 'DUAL PEACEMAKERS';
      else if (this.player.weaponType === 'repeater') lbl = 'WINCHESTER REPEATER';
      else if (this.player.weaponType === 'buffalo_rifle') lbl = 'BUFFALO RIFLE';
      this.dom.weaponLabel.innerText = lbl;
    }

    if (this.dom.tntCount) {
      this.dom.tntCount.innerText = this.inventory.dynamites;
    }
  }

  loadZone(zoneIndex) {
    this.currentZone = this.world.zones[zoneIndex];
    this.dom.zoneName.innerText = this.currentZone.name;

    // Reset player position
    this.player.x = this.currentZone.playerStart.x;
    this.player.y = this.currentZone.playerStart.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isShooting = false;
    this.player.recoilTimer = 0;

    // Copy world entities to active zone
    this.enemies = JSON.parse(JSON.stringify(this.currentZone.enemies));
    this.barrels = JSON.parse(JSON.stringify(this.currentZone.barrels));
    this.pickups = JSON.parse(JSON.stringify(this.currentZone.pickups));
    this.bullets = [];
    this.enemyBullets = [];
    this.dynamites = [];
    this.particles = [];
    this.floatingTexts = [];

    this.stats.zoneKills = 0;
    this.stats.zoneGold = 0;

    this.dom.goldCount.innerText = this.inventory.gold;
    this.updateObjectiveUI();
    this.updateCylinderHUD();
    if (this.canvas) this.canvas.focus();

    if (zoneIndex === 0) {
      this.showBanner('★ Press [L] or [SPACE] to Shoot! Move with WASD / Arrows ★');
    } else {
      this.showBanner(this.currentZone.name);
    }
  }

  spawnTumbleweeds() {
    this.tumbleweeds = [];
    for (let i = 0; i < 6; i++) {
      this.tumbleweeds.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        vx: 1.2 + Math.random() * 1.5,
        vy: 0.2 + (Math.random() - 0.5) * 0.4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 0.05 + Math.random() * 0.05
      });
    }
  }

  // --- KEYBOARD CONTROLS ---
  handleKeyDown(e) {
    // Initialize audio context on first key press
    window.soundEngine.init();

    // Advance Dialogue
    if (this.dialogueActive) {
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'KeyL' || (e.key && e.key.toLowerCase() === 'l') || e.code === 'Enter') {
        e.preventDefault();
        this.advanceDialogue();
        return;
      }
    }

    // Close Shop with Escape or E
    if (this.shopOpen) {
      if (e.code === 'Escape' || e.code === 'KeyE') {
        e.preventDefault();
        this.closeShop();
        return;
      }
    }

    if (this.state !== 'playing') return;

    // Shoot Weapon: L key (primary) or Space Bar
    const isShootKey = (
      e.code === 'KeyL' ||
      (e.key && e.key.toLowerCase() === 'l') ||
      e.keyCode === 76 ||
      e.which === 76 ||
      e.code === 'Space' ||
      e.key === ' ' ||
      e.keyCode === 32
    );

    if (isShootKey) {
      e.preventDefault();
      this.shootWeapon();
      return;
    }

    // Reload Cylinder: K Key (primary), or R
    const isReloadKey = (
      e.code === 'KeyK' ||
      (e.key && e.key.toLowerCase() === 'k') ||
      e.keyCode === 75 ||
      e.which === 75 ||
      e.code === 'KeyR' ||
      (e.key && e.key.toLowerCase() === 'r') ||
      e.keyCode === 82
    );

    if (isReloadKey) {
      e.preventDefault();
      this.reloadRevolver();
      return;
    }

    // Throw Dynamite: G Key
    if (e.code === 'KeyG' || (e.key && e.key.toLowerCase() === 'g')) {
      e.preventDefault();
      this.throwDynamite();
      return;
    }

    // Interact: E Key
    if (e.code === 'KeyE' || (e.key && e.key.toLowerCase() === 'e')) {
      e.preventDefault();
      this.interact();
      return;
    }

    // Dead-Eye Slow Motion: F Key
    if (e.code === 'KeyF' || (e.key && e.key.toLowerCase() === 'f')) {
      e.preventDefault();
      this.toggleDeadEye();
      return;
    }

    // Mute toggle: M Key
    if (e.code === 'KeyM' || (e.key && e.key.toLowerCase() === 'm')) {
      e.preventDefault();
      const active = window.soundEngine.toggleMute();
      document.getElementById('btn-sound-toggle').innerText = active ? '🔊 Sound: ON' : '🔈 Sound: OFF';
      return;
    }

    // Track movement keys (WASD and Arrows)
    this.keys[e.code] = true;
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  // --- COMBAT & MECHANICS ---
  shootWeapon() {
    if (this.player.isReloading) return;

    if (this.player.ammo <= 0) {
      window.soundEngine.playEmptyClick();
      this.showFloatingText(this.player.x, this.player.y - 25, '*CLICK* Press [K] to Reload!', '#ff9800');
      this.reloadRevolver(); // auto reload on empty click
      return;
    }

    this.player.ammo--;
    this.stats.shotsFired++;
    this.updateCylinderHUD();

    this.player.isShooting = true;
    this.player.recoilTimer = 8;
    setTimeout(() => { this.player.isShooting = false; }, 90);

    const angle = this.player.facingAngle;

    if (this.player.weaponType === 'buffalo_rifle') {
      // High-Velocity Buffalo Rifle
      window.soundEngine.playRifleShot();
      const speed = 18;
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 22,
        y: this.player.y + Math.sin(angle) * 22,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 75,
        damage: 85
      });
      this.createSmokeParticles(this.player.x + Math.cos(angle) * 28, this.player.y + Math.sin(angle) * 28, 8);
    } else if (this.player.weaponType === 'shotgun') {
      // Sawed-Off Double-Barrel Shotgun: 3-pellet cone
      window.soundEngine.playGunshot(true);
      const speed = 13;
      [-0.18, 0, 0.18].forEach(spread => {
        const bAngle = angle + spread;
        this.bullets.push({
          x: this.player.x + Math.cos(bAngle) * 16,
          y: this.player.y + Math.sin(bAngle) * 16,
          vx: Math.cos(bAngle) * speed,
          vy: Math.sin(bAngle) * speed,
          life: 45,
          damage: 35
        });
      });
      this.createSmokeParticles(this.player.x + Math.cos(angle) * 24, this.player.y + Math.sin(angle) * 24, 9);
    } else if (this.player.weaponType === 'repeater') {
      // Winchester Repeater 1873: Rapid lever action
      window.soundEngine.playRifleShot();
      const speed = 16;
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 20,
        y: this.player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 65,
        damage: 50
      });
      this.createSmokeParticles(this.player.x + Math.cos(angle) * 22, this.player.y + Math.sin(angle) * 22, 6);
    } else if (this.player.weaponType === 'dual_revolvers') {
      // Dual Peacemakers: Twin bullets in tight spread!
      window.soundEngine.playGunshot(true);
      const speed = 14;
      [-0.08, 0.08].forEach(spread => {
        const bAngle = angle + spread;
        this.bullets.push({
          x: this.player.x + Math.cos(bAngle) * 16,
          y: this.player.y + Math.sin(bAngle) * 16,
          vx: Math.cos(bAngle) * speed,
          vy: Math.sin(bAngle) * speed,
          life: 60,
          damage: 35
        });
      });
      this.createSmokeParticles(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, 6);
    } else {
      // Standard Six-Shooter Revolver
      window.soundEngine.playGunshot(true);
      const speed = 14;
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 16,
        y: this.player.y + Math.sin(angle) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60,
        damage: 40
      });
      this.createSmokeParticles(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, 5);
    }
  }

  // Alias for legacy calls
  shootRevolver() {
    this.shootWeapon();
  }

  reloadRevolver() {
    if (this.player.isReloading) return;
    if (this.player.ammo === this.player.maxAmmo) {
      this.showFloatingText(this.player.x, this.player.y - 25, 'Cylinder Full!', '#3498db');
      return;
    }

    this.player.isReloading = true;
    window.soundEngine.playReload();
    this.updateCylinderHUD();

    setTimeout(() => {
      this.player.ammo = this.player.maxAmmo;
      this.player.isReloading = false;
      this.updateCylinderHUD();
      this.showFloatingText(this.player.x, this.player.y - 25, 'LOADED!', '#ffd700');
    }, 600);
  }

  throwDynamite() {
    if (this.inventory.dynamites <= 0) {
      this.showFloatingText(this.player.x, this.player.y - 25, 'No TNT! Buy at Outpost!', '#ff9800');
      return;
    }

    this.inventory.dynamites--;
    this.updateCylinderHUD();
    const angle = this.player.facingAngle;
    const throwSpeed = 6.5;

    this.dynamites.push({
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * throwSpeed,
      vy: Math.sin(angle) * throwSpeed,
      fuse: 65,
      isPlayer: true
    });

    this.showFloatingText(this.player.x, this.player.y - 25, 'TNT THROWN!', '#ff5722');
  }

  toggleDeadEye() {
    if (this.player.grit >= 40 && !this.player.deadEyeActive) {
      this.player.deadEyeActive = true;
      this.player.deadEyeTimer = 180; // ~3 seconds of slow-mo
      window.soundEngine.playDeadEye();
      this.dom.deadeyeOverlay.classList.remove('hidden');
      this.showBanner('★ DEAD-EYE ACTIVE ★');
    }
  }

  // --- GENERAL STORE & ARMORY SHOP ---
  openShop(tab = 'weapons', shopName = null) {
    this.shopOpen = true;
    if (this.dom.shopModal) {
      this.dom.shopModal.classList.remove('hidden');
      if (this.dom.shopGoldDisplay) {
        this.dom.shopGoldDisplay.innerText = `$${this.inventory.gold}`;
      }

      if (shopName) {
        const titleEl = document.getElementById('shop-title-text');
        if (titleEl) titleEl.innerText = `🏪 ${shopName.toUpperCase()}`;
      }

      // Switch to the requested tab
      const tabWeapons = document.getElementById('tab-btn-weapons');
      const tabArmor = document.getElementById('tab-btn-armor');
      const gridWeapons = document.getElementById('grid-weapons');
      const gridArmor = document.getElementById('grid-armor');

      if (tab === 'armor') {
        if (tabArmor) tabArmor.classList.add('active');
        if (tabWeapons) tabWeapons.classList.remove('active');
        if (gridArmor) gridArmor.style.display = 'grid';
        if (gridWeapons) gridWeapons.style.display = 'none';
      } else {
        if (tabWeapons) tabWeapons.classList.add('active');
        if (tabArmor) tabArmor.classList.remove('active');
        if (gridWeapons) gridWeapons.style.display = 'grid';
        if (gridArmor) gridArmor.style.display = 'none';
      }

      // Update Weapons cards button states
      const updateWeaponBtn = (cardId, isEquipped) => {
        const card = document.getElementById(cardId);
        if (card) {
          const btn = card.querySelector('.shop-buy-btn');
          if (btn) {
            btn.innerText = isEquipped ? 'EQUIPPED' : (cardId === 'card-revolver' ? 'EQUIP' : 'BUY');
            btn.disabled = isEquipped;
          }
        }
      };

      updateWeaponBtn('card-revolver', this.player.weaponType === 'revolver');
      updateWeaponBtn('card-shotgun', this.player.weaponType === 'shotgun');
      updateWeaponBtn('card-dual-revolvers', this.player.weaponType === 'dual_revolvers');
      updateWeaponBtn('card-repeater', this.player.weaponType === 'repeater');
      updateWeaponBtn('card-buffalo-rifle', this.player.weaponType === 'buffalo_rifle');

      // Update Armor cards button states
      const updateArmorBtn = (cardId, isOwned) => {
        const card = document.getElementById(cardId);
        if (card) {
          const btn = card.querySelector('.shop-buy-btn');
          if (btn) {
            btn.innerText = isOwned ? 'EQUIPPED' : 'BUY';
            btn.disabled = isOwned;
          }
        }
      };

      updateArmorBtn('card-leather-armor', this.player.armor === 'leather' || this.player.armor === 'steel' || this.player.armor === 'gold');
      updateArmorBtn('card-steel-armor', this.player.armor === 'steel' || this.player.armor === 'gold');
      updateArmorBtn('card-gold-armor', this.player.armor === 'gold');
      updateArmorBtn('card-boots', this.player.hasBoots);
      updateArmorBtn('card-bandolier', this.player.hasBandolier);
    }
  }

  closeShop() {
    this.shopOpen = false;
    if (this.dom.shopModal) {
      this.dom.shopModal.classList.add('hidden');
    }
  }

  buyShopItem(itemKey) {
    const prices = {
      revolver: 0,
      shotgun: 160,
      dual_revolvers: 220,
      repeater: 300,
      buffalo_rifle: 380,
      ammo: 25,
      dynamite: 60,
      leather_armor: 120,
      steel_armor: 240,
      gold_armor: 420,
      boots: 140,
      bandolier: 180,
      health: 40
    };

    const cost = prices[itemKey];
    if (cost === undefined) return;

    if (this.inventory.gold < cost) {
      window.soundEngine.playEmptyClick();
      this.showFloatingText(this.player.x, this.player.y - 25, 'Not enough gold, partner!', '#e74c3c');
      return;
    }

    this.inventory.gold -= cost;
    this.dom.goldCount.innerText = this.inventory.gold;
    if (this.dom.shopGoldDisplay) this.dom.shopGoldDisplay.innerText = `$${this.inventory.gold}`;
    window.soundEngine.playBuy();

    if (itemKey === 'ammo') {
      this.player.ammo = this.player.maxAmmo;
      this.showFloatingText(this.player.x, this.player.y - 25, '+AMMO RESTOCKED', '#ffd700');
    } else if (itemKey === 'health') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
      this.dom.healthBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
      this.dom.healthText.innerText = `${this.player.hp} / ${this.player.maxHp}`;
      this.showFloatingText(this.player.x, this.player.y - 25, '+50 HEALTH TONIC', '#2ecc71');
    } else if (itemKey === 'revolver') {
      this.player.weaponType = 'revolver';
      this.showFloatingText(this.player.x, this.player.y - 25, 'SIX-SHOOTER EQUIPPED!', '#ffd700');
      this.openShop('weapons');
    } else if (itemKey === 'shotgun') {
      this.player.weaponType = 'shotgun';
      this.showFloatingText(this.player.x, this.player.y - 25, 'SAWED-OFF SHOTGUN EQUIPPED!', '#ffd700');
      this.openShop('weapons');
    } else if (itemKey === 'dual_revolvers') {
      this.player.weaponType = 'dual_revolvers';
      this.showFloatingText(this.player.x, this.player.y - 25, 'DUAL PEACEMAKERS EQUIPPED!', '#ffd700');
      this.openShop('weapons');
    } else if (itemKey === 'repeater') {
      this.player.weaponType = 'repeater';
      this.showFloatingText(this.player.x, this.player.y - 25, 'WINCHESTER REPEATER EQUIPPED!', '#ffd700');
      this.openShop('weapons');
    } else if (itemKey === 'buffalo_rifle') {
      this.player.weaponType = 'buffalo_rifle';
      this.showFloatingText(this.player.x, this.player.y - 25, 'BUFFALO RIFLE EQUIPPED!', '#ffd700');
      this.openShop('weapons');
    } else if (itemKey === 'dynamite') {
      this.inventory.dynamites++;
      this.showFloatingText(this.player.x, this.player.y - 25, '+1 TNT STICK [G]', '#ff5722');
    } else if (itemKey === 'leather_armor') {
      this.player.armor = 'leather';
      this.player.armorReduction = 0.15;
      this.player.maxHp = Math.max(this.player.maxHp, 125);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
      this.dom.healthBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
      this.dom.healthText.innerText = `${this.player.hp} / ${this.player.maxHp}`;
      this.showFloatingText(this.player.x, this.player.y - 25, 'LEATHER VEST! (15% REDUCTION)', '#3498db');
      this.openShop('armor');
    } else if (itemKey === 'steel_armor') {
      this.player.armor = 'steel';
      this.player.armorReduction = 0.30;
      this.player.maxHp = Math.max(this.player.maxHp, 150);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
      this.dom.healthBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
      this.dom.healthText.innerText = `${this.player.hp} / ${this.player.maxHp}`;
      this.showFloatingText(this.player.x, this.player.y - 25, 'STEEL MARSHAL PLATE! (30% REDUCTION)', '#3498db');
      this.openShop('armor');
    } else if (itemKey === 'gold_armor') {
      this.player.armor = 'gold';
      this.player.armorReduction = 0.45;
      this.player.maxHp = Math.max(this.player.maxHp, 180);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 80);
      this.dom.healthBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
      this.dom.healthText.innerText = `${this.player.hp} / ${this.player.maxHp}`;
      this.showFloatingText(this.player.x, this.player.y - 25, 'GOLDEN CUIRASS! (45% REDUCTION)', '#ffd700');
      this.openShop('armor');
    } else if (itemKey === 'boots') {
      this.player.hasBoots = true;
      this.player.speed = 4.3;
      this.showFloatingText(this.player.x, this.player.y - 25, 'SWIFT BOOTS! (+30% SPEED)', '#2ecc71');
      this.openShop('armor');
    } else if (itemKey === 'bandolier') {
      this.player.hasBandolier = true;
      this.player.maxAmmo = 10;
      this.player.ammo = 10;
      this.buildCylinderHUD();
      this.showFloatingText(this.player.x, this.player.y - 25, 'BANDOLIER! (10 ROUND CYLINDER)', '#ffd700');
      this.openShop('armor');
    }

    this.updateCylinderHUD();
  }

  interact() {
    // If shop open, close it
    if (this.shopOpen) {
      this.closeShop();
      return;
    }

    // Check multiple shopkeepers or single shopkeeper
    const shopkeepers = this.currentZone.shopkeepers || (this.currentZone.shopkeeper ? [this.currentZone.shopkeeper] : []);
    for (const sk of shopkeepers) {
      const dist = Math.hypot(this.player.x - sk.x, this.player.y - sk.y);
      if (dist < 80) {
        this.openShop(sk.shopTab || 'weapons', sk.name);
        return;
      }
    }

    // Check NPC interaction
    if (this.currentZone.npc) {
      const dist = Math.hypot(this.player.x - this.currentZone.npc.x, this.player.y - this.currentZone.npc.y);
      if (dist < 60) {
        this.startDialogue(this.currentZone.npc.name, this.currentZone.npc.dialogue);
        return;
      }
    }

    // Check Treasure Chest interaction in Zone 5
    if (this.currentZone.treasureChest) {
      const chest = this.currentZone.treasureChest;
      const dist = Math.hypot(this.player.x - chest.x, this.player.y - chest.y);
      if (dist < 70) {
        // Check if boss is alive
        const bossAlive = this.enemies.some(e => e.isBoss && e.hp > 0);
        if (bossAlive) {
          this.showBanner('Defeat Black Jack Bart first!');
          return;
        }

        if (!chest.isOpen) {
          chest.isOpen = true;
          this.claimTreasure();
        }
      }
    }

    // Check Exit Gate interaction
    if (this.currentZone.exitGate) {
      const gate = this.currentZone.exitGate;
      const dist = Math.hypot(this.player.x - (gate.x + gate.width / 2), this.player.y - (gate.y + gate.height / 2));
      if (dist < 80) {
        const keyReq = gate.requiredItem;
        if (!keyReq || this.inventory[keyReq]) {
          this.completeLevel();
        } else {
          this.showBanner(`Gate Locked! Find the Level Key to unlock Level ${this.world.currentZoneIndex + 2}!`);
        }
      }
    }
  }

  claimTreasure() {
    window.soundEngine.playTreasureChestFanfare();
    this.createExplosionParticles(this.currentZone.treasureChest.x, this.currentZone.treasureChest.y, 60, true);
    this.inventory.gold += 5000;
    this.dom.goldCount.innerText = this.inventory.gold;

    setTimeout(() => {
      this.state = 'victory';
      this.showVictoryScreen();
    }, 1800);
  }

  showVictoryScreen() {
    this.dom.screenVictory.classList.remove('hidden');
    document.getElementById('final-gold').innerText = `$${this.inventory.gold}`;
    document.getElementById('final-kills').innerText = this.stats.banditsKilled;

    const totalSeconds = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    document.getElementById('final-time').innerText = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    let rank = 'Desert Drifter';
    if (this.stats.banditsKilled >= 18 && this.inventory.gold >= 4000) rank = 'Legendary Western Sheriff ⭐️';
    else if (this.stats.banditsKilled >= 10) rank = 'Master Gunslinger';
    document.getElementById('final-rank').innerText = rank;
  }

  completeLevel() {
    window.soundEngine.playClueFound();
    this.state = 'level_complete';
    this.dom.screenLevelComplete.classList.remove('hidden');

    document.getElementById('stat-bandits').innerText = this.stats.zoneKills;
    document.getElementById('stat-gold').innerText = `$${this.stats.zoneGold}`;
    const acc = this.stats.shotsFired > 0 ? Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100) : 100;
    document.getElementById('stat-accuracy').innerText = `${acc}%`;

    const nextIdx = this.world.currentZoneIndex + 1;
    const nextZone = this.world.zones[nextIdx];
    const summaryText = nextZone 
      ? `Level ${this.world.currentZoneIndex + 1} Cleared! You unlocked the trail gates to ${nextZone.name}! Equip new weapons & armor, and ride on!` 
      : 'You breached the inner gates to El Dorado Cavern! Face Black Jack Bart and claim the lost treasure!';
    document.getElementById('level-summary-text').innerText = summaryText;
  }

  gameOver(cause = 'Killed in action') {
    window.soundEngine.playPlayerHurt();
    this.state = 'game_over';
    this.dom.screenGameOver.classList.remove('hidden');
    document.getElementById('game-over-cause').innerText = cause;
  }

  // --- DIALOGUE SYSTEM ---
  startDialogue(speaker, lines) {
    this.dialogueQueue = [...lines];
    this.dom.dialogueSpeaker.innerText = speaker;
    this.dialogueActive = true;
    this.state = 'dialogue';
    this.dom.dialogueBox.classList.remove('hidden');
    this.advanceDialogue();
  }

  advanceDialogue() {
    if (this.dialogueQueue.length > 0) {
      const line = this.dialogueQueue.shift();
      this.dom.dialogueText.innerText = line;
      window.soundEngine.playCoin(); // soft beep on text
    } else {
      this.dialogueActive = false;
      this.dom.dialogueBox.classList.add('hidden');
      this.state = 'playing';
    }
  }

  showBanner(msg) {
    this.dom.bannerNotification.innerText = msg;
    this.dom.bannerNotification.classList.remove('hidden');
    this.dom.bannerNotification.style.opacity = '1';
    setTimeout(() => {
      this.dom.bannerNotification.style.opacity = '0';
      setTimeout(() => {
        this.dom.bannerNotification.classList.add('hidden');
      }, 300);
    }, 2500);
  }

  showFloatingText(x, y, text, color = '#ffd700') {
    this.floatingTexts.push({ x, y, text, color, life: 50, vy: -1 });
  }

  updateObjectiveUI() {
    if (this.currentZone.exitGate) {
      const keyReq = this.currentZone.exitGate.requiredItem;
      if (!keyReq || this.inventory[keyReq]) {
        this.dom.objectiveCounter.innerText = 'Gate: UNLOCKED [GO EAST]';
      } else {
        this.dom.objectiveCounter.innerText = `Key: 0/1 (Level ${this.world.currentZoneIndex + 1})`;
      }
    } else if (this.currentZone.treasureChest) {
      this.dom.objectiveCounter.innerText = 'Boss: Black Jack';
    }
  }

  // --- MAIN LOOP & UPDATES ---
  requestLoop() {
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.gameTime += dt;

    if (this.state === 'playing' || this.state === 'dialogue') {
      this.update(dt);
    }

    this.render();
    this.requestLoop();
  }

  update(dt) {
    const timeScale = this.player.deadEyeActive ? 0.35 : 1.0;

    // Dead-Eye Timer
    if (this.player.deadEyeActive) {
      this.player.deadEyeTimer--;
      this.player.grit = Math.max(0, this.player.grit - 0.5);
      if (this.player.deadEyeTimer <= 0 || this.player.grit <= 0) {
        this.player.deadEyeActive = false;
        this.dom.deadeyeOverlay.classList.add('hidden');
      }
    }
    this.dom.gritBar.style.width = `${(this.player.grit / this.player.maxGrit) * 100}%`;

    // Invulnerability timer
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer--;
    }

    // Player Recoil Timer
    if (this.player.recoilTimer > 0) {
      this.player.recoilTimer--;
    }

    // Update Player Movement (Keyboard WASD / Arrows)
    if (this.state === 'playing') {
      let dx = 0;
      let dy = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['KeyQ']) dx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      this.player.isMoving = dx !== 0 || dy !== 0;
      if (this.player.isMoving) {
        this.player.facingAngle = Math.atan2(dy, dx);
        this.player.lastMoveAngle = this.player.facingAngle;

        // Dust particle behind cowboy boots
        if (Math.random() < 0.25) {
          this.createDustParticles(this.player.x, this.player.y + 14, 1);
        }
      }

      const moveSpeed = this.player.speed;
      const targetX = this.player.x + dx * moveSpeed;
      const targetY = this.player.y + dy * moveSpeed;

      // Obstacle collision checking
      if (!this.checkObstacleCollision(targetX, this.player.y, this.player.radius)) {
        this.player.x = targetX;
      }
      if (!this.checkObstacleCollision(this.player.x, targetY, this.player.radius)) {
        this.player.y = targetY;
      }

      // Keep inside bounds
      this.player.x = Math.max(30, Math.min(this.currentZone.width - 30, this.player.x));
      this.player.y = Math.max(30, Math.min(this.currentZone.height - 30, this.player.y));

      // Automatic Level Gate Passage when stepping through unlocked gate
      if (this.currentZone.exitGate) {
        const g = this.currentZone.exitGate;
        const gateCenterX = g.x + g.width / 2;
        const gateCenterY = g.y + g.height / 2;
        if (Math.hypot(this.player.x - gateCenterX, this.player.y - gateCenterY) < 60) {
          if (!g.locked) {
            this.completeLevel();
            return;
          } else {
            if (!this.player.gateNoticeTimer || this.gameTime - this.player.gateNoticeTimer > 3.5) {
              this.showBanner(`🔒 Canyon Gate Locked! Find the Level Key to unlock Level ${this.world.currentZoneIndex + 2}!`);
              this.player.gateNoticeTimer = this.gameTime;
            }
          }
        }
      }
    }

    // Camera follow player smoothly
    const targetCamX = this.player.x - this.viewWidth / 2;
    const targetCamY = this.player.y - this.viewHeight / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;
    this.camera.x = Math.max(0, Math.min(this.currentZone.width - this.viewWidth, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.currentZone.height - this.viewHeight, this.camera.y));

    // Update Player Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Check wall / obstacle hit (don't block on barrels here, let bullet destroy barrel)
      if (this.checkObstacleCollision(b.x, b.y, 4, false)) {
        window.soundEngine.playRicochet();
        this.createSparks(b.x, b.y, 6);
        this.bullets.splice(i, 1);
        continue;
      }

      // Check Barrel Hit
      let hitBarrel = false;
      for (let bi = this.barrels.length - 1; bi >= 0; bi--) {
        const barrel = this.barrels[bi];
        if (Math.hypot(b.x - barrel.x, b.y - barrel.y) < 18) {
          window.soundEngine.playBarrelSmash();
          this.createWoodSplinters(barrel.x, barrel.y, 10);
          this.dropLoot(barrel.x, barrel.y, barrel.loot);
          this.barrels.splice(bi, 1);
          hitBarrel = true;
          break;
        }
      }
      if (hitBarrel) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check Enemy Hit
      let hitEnemy = false;
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        const hitRadius = enemy.isBoss ? 32 : 18;
        if (Math.hypot(b.x - enemy.x, b.y - enemy.y) < hitRadius) {
          enemy.hp -= b.damage;
          this.stats.shotsHit++;
          window.soundEngine.playHit();
          this.createSparks(b.x, b.y, 6);
          this.showFloatingText(enemy.x, enemy.y - 20, `-${b.damage}`, '#e74c3c');

          // Build up Grit on hits
          this.player.grit = Math.min(this.player.maxGrit, this.player.grit + 12);

          if (enemy.hp <= 0) {
            this.killEnemy(ei);
          }

          hitEnemy = true;
          break;
        }
      }
      if (hitEnemy) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx * timeScale;
      eb.y += eb.vy * timeScale;
      eb.life -= timeScale;

      // Obstacle collision
      if (this.checkObstacleCollision(eb.x, eb.y, 4)) {
        this.createSparks(eb.x, eb.y, 4);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      // Hit Player
      if (Math.hypot(eb.x - this.player.x, eb.y - this.player.y) < this.player.radius) {
        if (this.player.invulnerableTimer <= 0) {
          this.damagePlayer(eb.damage || 20);
          this.enemyBullets.splice(i, 1);
          continue;
        }
      }

      if (eb.life <= 0) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // Update Dynamites
    for (let i = this.dynamites.length - 1; i >= 0; i--) {
      const d = this.dynamites[i];
      d.x += d.vx * timeScale;
      d.y += d.vy * timeScale;
      d.vx *= 0.95;
      d.vy *= 0.95;
      d.fuse -= timeScale;

      // Spark fuse
      if (Math.random() < 0.4) {
        this.particles.push({
          x: d.x,
          y: d.y - 6,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2,
          color: '#ff5722',
          radius: 2,
          life: 15,
          maxLife: 15
        });
      }

      if (d.fuse <= 0) {
        // DETONATE!
        window.soundEngine.playExplosion();
        this.createExplosionParticles(d.x, d.y, 35);

        // AOE Damage
        const distToPlayer = Math.hypot(this.player.x - d.x, this.player.y - d.y);
        if (distToPlayer < 75) {
          this.damagePlayer(35);
        }

        // Damage nearby enemies too!
        this.enemies.forEach(en => {
          if (Math.hypot(en.x - d.x, en.y - d.y) < 80) {
            en.hp -= 50;
            this.showFloatingText(en.x, en.y - 20, '-50', '#ff9800');
          }
        });

        this.dynamites.splice(i, 1);
      }
    }

    // Update Enemies AI
    this.enemies.forEach((en, idx) => {
      const dist = Math.hypot(this.player.x - en.x, this.player.y - en.y);
      const angle = Math.atan2(this.player.y - en.y, this.player.x - en.x);
      en.angle = angle;

      if (en.type === 'scorpion') {
        const detectRange = this.currentZone.id === 1 ? 130 : 320;
        if (dist < detectRange) {
          const moveX = Math.cos(angle) * en.speed * timeScale;
          const moveY = Math.sin(angle) * en.speed * timeScale;
          this.moveEnemy(en, moveX, moveY);

          if (dist < 22 && this.player.invulnerableTimer <= 0) {
            const dmg = this.currentZone.id === 1 ? 8 : 15;
            this.damagePlayer(dmg, 'Stung by a Desert Scorpion!');
          }
        }
      } else if (en.type === 'snake') {
        const detectRange = this.currentZone.id === 1 ? 130 : 300;
        if (dist < detectRange) {
          if (dist < 120 && Math.random() < 0.03) {
            window.soundEngine.playRattle();
          }
          const moveX = Math.cos(angle) * en.speed * timeScale;
          const moveY = Math.sin(angle) * en.speed * timeScale;
          this.moveEnemy(en, moveX, moveY);

          if (dist < 22 && this.player.invulnerableTimer <= 0) {
            const dmg = this.currentZone.id === 1 ? 10 : 20;
            this.damagePlayer(dmg, 'Bitten by a venomous Rattlesnake!');
          }
        }
      } else if (en.type === 'bandit') {
        const detectRange = this.currentZone.id === 1 ? 200 : 420;
        if (dist < detectRange) {
          // Maintain tactical distance
          if (dist > 180) {
            const moveX = Math.cos(angle) * en.speed * timeScale;
            const moveY = Math.sin(angle) * en.speed * timeScale;
            this.moveEnemy(en, moveX, moveY);
          } else if (dist < 100) {
            const moveX = -Math.cos(angle) * en.speed * timeScale;
            const moveY = -Math.sin(angle) * en.speed * timeScale;
            this.moveEnemy(en, moveX, moveY);
          }

          en.shootCooldown = (en.shootCooldown || 140) - timeScale;
          if (en.shootCooldown <= 0) {
            en.shootCooldown = this.currentZone.id === 1 ? (300 + Math.random() * 90) : (130 + Math.random() * 50);
            window.soundEngine.playGunshot(false);
            const bSpeed = this.currentZone.id === 1 ? 3.5 : 7;
            const bDmg = this.currentZone.id === 1 ? 7 : 18;
            this.enemyBullets.push({
              x: en.x + Math.cos(angle) * 16,
              y: en.y + Math.sin(angle) * 16,
              vx: Math.cos(angle) * bSpeed,
              vy: Math.sin(angle) * bSpeed,
              damage: bDmg,
              life: 90
            });
          }
        }
      } else if (en.type === 'dynamite') {
        if (dist < 380) {
          en.throwCooldown = (en.throwCooldown || 180) - timeScale;
          if (en.throwCooldown <= 0) {
            en.throwCooldown = 190 + Math.random() * 60;
            const throwSpeed = 6;
            this.dynamites.push({
              x: en.x,
              y: en.y,
              vx: Math.cos(angle) * throwSpeed,
              vy: Math.sin(angle) * throwSpeed,
              fuse: 70
            });
            this.showFloatingText(en.x, en.y - 25, 'FIRE IN THE HOLE!', '#ff5722');
          }
        }
      } else if (en.type === 'boss') {
        // Black Jack Bart
        if (dist < 550) {
          if (dist > 220) {
            const moveX = Math.cos(angle) * en.speed * timeScale;
            const moveY = Math.sin(angle) * en.speed * timeScale;
            this.moveEnemy(en, moveX, moveY);
          }

          en.shootCooldown = (en.shootCooldown || 90) - timeScale;
          if (en.shootCooldown <= 0) {
            en.shootCooldown = 75;
            window.soundEngine.playGunshot(false);
            // Dual-revolver fan shot (3 spread bullets)
            [-0.2, 0, 0.2].forEach(offset => {
              const bAngle = angle + offset;
              this.enemyBullets.push({
                x: en.x,
                y: en.y,
                vx: Math.cos(bAngle) * 8,
                vy: Math.sin(bAngle) * 8,
                damage: 22,
                life: 90
              });
            });
          }
        }
      }
    });

    // Check Pickup Collisions
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (Math.hypot(this.player.x - p.x, this.player.y - p.y) < 24) {
        this.collectPickup(p);
        this.pickups.splice(i, 1);
      }
    }

    // Update Tumbleweeds
    this.tumbleweeds.forEach(t => {
      t.x += t.vx * timeScale;
      t.y += t.vy * timeScale;
      t.rot += t.rotSpeed * timeScale;
      if (t.x > this.currentZone.width + 50) {
        t.x = -50;
        t.y = Math.random() * this.currentZone.height;
      }
    });

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  damagePlayer(amount, customCause) {
    const armorReduction = this.player.armorReduction || 0;
    const finalAmount = Math.max(1, Math.round(amount * (1 - armorReduction)));

    this.player.hp = Math.max(0, this.player.hp - finalAmount);
    this.player.invulnerableTimer = 35; // invulnerability frames
    window.soundEngine.playPlayerHurt();
    this.createBloodSparks(this.player.x, this.player.y, 6);
    if (armorReduction > 0) {
      this.showFloatingText(this.player.x, this.player.y - 20, `-${finalAmount} (ARMOR -${Math.round(armorReduction * 100)}%)`, '#3498db');
    } else {
      this.showFloatingText(this.player.x, this.player.y - 20, `-${finalAmount}`, '#c0392b');
    }

    // Update HUD
    this.dom.healthBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    this.dom.healthText.innerText = `${this.player.hp} / ${this.player.maxHp}`;

    if (this.player.hp <= 0) {
      this.gameOver(customCause || 'Gunned down by outlaws in the badlands!');
    }
  }

  killEnemy(index) {
    const en = this.enemies[index];
    this.stats.banditsKilled++;
    this.stats.zoneKills++;
    this.createExplosionParticles(en.x, en.y, 16);

    // Drop loot
    if (en.isBoss) {
      this.showBanner('★ BLACK JACK BART HAS FALLEN! ★');
      this.dropLoot(en.x, en.y, 'coin');
      this.dropLoot(en.x + 20, en.y, 'coin');
      this.dropLoot(en.x - 20, en.y, 'coin');
    } else {
      const roll = Math.random();
      if (roll < 0.4) this.dropLoot(en.x, en.y, 'coin');
      else if (roll < 0.6) this.dropLoot(en.x, en.y, 'ammo');
      else if (roll < 0.75) this.dropLoot(en.x, en.y, 'health');
    }

    this.enemies.splice(index, 1);
  }

  dropLoot(x, y, lootType) {
    if (!lootType) return;
    this.pickups.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      type: lootType,
      val: lootType === 'coin' ? 75 : 0
    });
  }

  collectPickup(p) {
    if (p.type === 'coin') {
      const val = p.val || 50;
      this.inventory.gold += val;
      this.stats.zoneGold += val;
      this.dom.goldCount.innerText = this.inventory.gold;
      window.soundEngine.playCoin();
      this.showFloatingText(p.x, p.y, `+$${val}`, '#ffd700');
    } else if (p.type === 'key') {
      const keyId = p.id || 'canyon_key';
      this.inventory[keyId] = true;
      if (this.currentZone.exitGate) {
        this.currentZone.exitGate.locked = false;
      }
      window.soundEngine.playClueFound();
      this.showBanner(`★ ${p.name || 'LEVEL KEY'} FOUND! Gate is UNLOCKED! Head East to Enter Level ${this.world.currentZoneIndex + 2}! ★`);
      this.showFloatingText(p.x, p.y, 'GATE UNLOCKED! [HEAD EAST]', '#ffd700');
      this.updateObjectiveUI();
    } else if (p.type === 'map') {
      this.inventory.mapFragments++;
      window.soundEngine.playClueFound();
      this.showBanner(`Obtained: ${p.name}!`);
      this.showFloatingText(p.x, p.y, `MAP PIECE (${this.inventory.mapFragments}/3)`, '#ffd700');
      if (this.inventory.mapFragments >= 3) {
        this.inventory.map_complete = true;
        this.showBanner('★ TREASURE MAP COMPLETED! Mine Shaft Unlocked! ★');
      }
      this.updateObjectiveUI();
    } else if (p.type === 'health') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
      this.dom.healthBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
      this.dom.healthText.innerText = `${this.player.hp} / ${this.player.maxHp}`;
      window.soundEngine.playCoin();
      this.showFloatingText(p.x, p.y, '+35 HEALTH', '#2ecc71');
    } else if (p.type === 'ammo') {
      this.player.ammo = this.player.maxAmmo;
      this.updateCylinderHUD();
      window.soundEngine.playReload();
      this.showFloatingText(p.x, p.y, 'AMMO REFILLED!', '#3498db');
    }
  }

  moveEnemy(en, dx, dy) {
    const radius = en.isBoss ? 28 : (en.type === 'scorpion' || en.type === 'snake' ? 14 : 16);
    const targetX = en.x + dx;
    const targetY = en.y + dy;

    // Slide along walls: test X and Y separately
    if (!this.checkObstacleCollision(targetX, en.y, radius, false)) {
      en.x = targetX;
    }
    if (!this.checkObstacleCollision(en.x, targetY, radius, false)) {
      en.y = targetY;
    }

    // Keep enemies within world boundaries
    en.x = Math.max(35, Math.min(this.currentZone.width - 35, en.x));
    en.y = Math.max(35, Math.min(this.currentZone.height - 35, en.y));
  }

  checkObstacleCollision(x, y, radius, checkBarrels = true) {
    // Check against buildings
    if (this.currentZone.buildings) {
      for (const b of this.currentZone.buildings) {
        if (x + radius > b.x && x - radius < b.x + b.width &&
            y + radius > b.y && y - radius < b.y + b.height) {
          return true;
        }
      }
    }

    // Check against rocks, walls, cacti
    if (this.currentZone.obstacles) {
      for (const obs of this.currentZone.obstacles) {
        if (x + radius > obs.x && x - radius < obs.x + obs.width &&
            y + radius > obs.y && y - radius < obs.y + obs.height) {
          return true;
        }
      }
    }

    // Check against barrels
    if (checkBarrels) {
      for (const bar of this.barrels) {
        if (Math.hypot(x - bar.x, y - bar.y) < radius + 10) {
          return true;
        }
      }
    }

    return false;
  }

  // --- PARTICLE GENERATION ---
  createSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: '#ffeb3b',
        radius: 1.5,
        life: 12,
        maxLife: 12
      });
    }
  }

  createBloodSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: '#b71c1c',
        radius: 2,
        life: 14,
        maxLife: 14
      });
    }
  }

  createSmokeParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2,
        color: 'rgba(200, 200, 200, 0.6)',
        radius: 3 + Math.random() * 3,
        life: 20,
        maxLife: 20
      });
    }
  }

  createDustParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1,
        color: 'rgba(210, 180, 140, 0.5)',
        radius: 2.5,
        life: 15,
        maxLife: 15
      });
    }
  }

  createWoodSplinters(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        color: '#8d6e63',
        radius: 2,
        life: 18,
        maxLife: 18
      });
    }
  }

  createExplosionParticles(x, y, count, isGold = false) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isGold ? (Math.random() < 0.6 ? '#ffd700' : '#ff9800') : (Math.random() < 0.5 ? '#ff5722' : '#ffeb3b'),
        radius: 2 + Math.random() * 4,
        life: 30 + Math.random() * 20,
        maxLife: 50
      });
    }
  }

  // --- RENDERING ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

    ctx.save();
    // Apply Camera Translation
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // Ground fill
    ctx.fillStyle = this.currentZone.backgroundColor;
    ctx.fillRect(0, 0, this.currentZone.width, this.currentZone.height);

    // Ground pebbles / nuggets
    this.currentZone.groundDetails.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Buildings
    if (this.currentZone.buildings) {
      this.currentZone.buildings.forEach(b => {
        Sprites.drawBuilding(ctx, b.x, b.y, b.width, b.height, b.type);
      });
    }

    // Canyon Rocks & Obstacles
    if (this.currentZone.obstacles) {
      this.currentZone.obstacles.forEach(obs => {
        if (obs.type === 'rock' || obs.type === 'cave_rock') {
          ctx.fillStyle = obs.type === 'cave_rock' ? '#1c120c' : '#8d6e63';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          // Dark rocky rim
          ctx.strokeStyle = '#5d4037';
          ctx.lineWidth = 2;
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'cactus') {
          Sprites.drawCactus(ctx, obs.x + 12, obs.y + 12, this.gameTime);
        } else if (obs.type === 'crate') {
          ctx.fillStyle = '#6d4c41';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeStyle = '#3e2723';
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.stroke();
        }
      });
    }

    // Exit Gate
    if (this.currentZone.exitGate) {
      const g = this.currentZone.exitGate;
      const isOpen = !g.locked;
      const nextLevelText = `LEVEL ${this.world.currentZoneIndex + 2}`;
      Sprites.drawExitGate(ctx, g, isOpen, this.gameTime, nextLevelText);
    }

    // Destructible Barrels
    this.barrels.forEach(b => {
      Sprites.drawBarrel(ctx, b.x, b.y);
    });

    // Pickups (Coins, Keys, Maps, Health)
    this.pickups.forEach(p => {
      Sprites.drawPickup(ctx, p.x, p.y, p.type, this.gameTime);
    });

    // Tumbleweeds
    this.tumbleweeds.forEach(t => {
      Sprites.drawTumbleweed(ctx, t.x, t.y, t.rot);
    });

    // NPC (Old Pete)
    if (this.currentZone.npc) {
      Sprites.drawProspector(ctx, this.currentZone.npc.x, this.currentZone.npc.y, this.gameTime);
    }

    // Shopkeeper NPCs (Gunsmith, Blacksmith & Armory)
    const shopkeepers = this.currentZone.shopkeepers || (this.currentZone.shopkeeper ? [this.currentZone.shopkeeper] : []);
    shopkeepers.forEach(sk => {
      Sprites.drawShopkeeper(ctx, sk.x, sk.y, this.gameTime);
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 9px serif';
      ctx.textAlign = 'center';
      ctx.fillText(sk.name, sk.x, sk.y - 20);
      ctx.fillStyle = '#ffd54f';
      ctx.fillText('[E] TALK / SHOP', sk.x, sk.y - 10);
    });

    // Treasure Chest
    if (this.currentZone.treasureChest) {
      const tc = this.currentZone.treasureChest;
      Sprites.drawTreasureChest(ctx, tc.x, tc.y, tc.isOpen, this.gameTime);
    }

    // Enemies
    this.enemies.forEach(en => {
      if (en.type === 'scorpion') {
        Sprites.drawScorpion(ctx, en.x, en.y, en.angle || 0, this.gameTime);
      } else if (en.type === 'snake') {
        Sprites.drawSnake(ctx, en.x, en.y, en.angle || 0, this.gameTime);
      } else if (en.type === 'bandit') {
        Sprites.drawBandit(ctx, en.x, en.y, en.angle || 0, this.gameTime, true, false);
      } else if (en.type === 'dynamite') {
        Sprites.drawDynamiteBandit(ctx, en.x, en.y, en.angle || 0, this.gameTime);
      } else if (en.type === 'boss') {
        Sprites.drawBandit(ctx, en.x, en.y, en.angle || 0, this.gameTime, true, true);
        // Boss health bar above head
        ctx.fillStyle = '#222';
        ctx.fillRect(en.x - 40, en.y - 50, 80, 8);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(en.x - 39, en.y - 49, (en.hp / en.maxHp) * 78, 6);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px serif';
        ctx.textAlign = 'center';
        ctx.fillText('BLACK JACK BART', en.x, en.y - 54);
      }
    });

    // Dynamites in flight
    this.dynamites.forEach(d => {
      ctx.fillStyle = '#b71c1c';
      ctx.fillRect(d.x - 3, d.y - 6, 6, 12);
    });

    // Player Bullets
    ctx.fillStyle = '#ffeb3b';
    this.bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Enemy Bullets
    ctx.fillStyle = '#ff5722';
    this.enemyBullets.forEach(eb => {
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player Character (Colt Cassidy or Sadie Sinclair)
    Sprites.drawPlayer(
      ctx,
      this.player.x,
      this.player.y,
      this.player.facingAngle,
      this.gameTime,
      this.player.isMoving,
      this.player.isShooting,
      this.player.recoilTimer,
      this.player.invulnerableTimer > 0,
      this.player.gender,
      this.player.weaponType
    );

    // Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Floating combat text
    this.floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 13px serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore();
  }
}

// Start Game on window load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
