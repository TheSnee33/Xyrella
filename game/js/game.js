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
      gold: 0,
      canyon_key: false,
      mapFragments: 0, // 0 to 3
      map_complete: false
    };

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
      goldCount: document.getElementById('gold-count'),
      objectiveCounter: document.getElementById('objective-counter'),
      zoneName: document.getElementById('zone-name'),
      bannerNotification: document.getElementById('banner-notification'),
      dialogueBox: document.getElementById('dialogue-box'),
      dialogueSpeaker: document.getElementById('dialogue-speaker'),
      dialogueText: document.getElementById('dialogue-text'),
      deadeyeOverlay: document.getElementById('deadeye-overlay'),
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
      this.inventory.gold = 0;
      this.inventory.canyon_key = false;
      this.inventory.mapFragments = 0;
      this.inventory.map_complete = false;
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
    for (let i = 0; i < 6; i++) {
      const chamber = document.createElement('div');
      chamber.className = 'bullet-chamber loaded';
      chamber.id = `chamber-${i}`;
      this.dom.cylinderDisplay.appendChild(chamber);
    }
  }

  updateCylinderHUD() {
    for (let i = 0; i < 6; i++) {
      const chamber = document.getElementById(`chamber-${i}`);
      if (chamber) {
        if (i < this.player.ammo) {
          chamber.classList.add('loaded');
        } else {
          chamber.classList.remove('loaded');
        }
      }
    }
    this.dom.ammoText.innerText = this.player.isReloading ? 'RELOADING...' : `${this.player.ammo} / 6 [R]`;
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

    this.updateObjectiveUI();
    this.showBanner(this.currentZone.name);

    // If Zone 1, trigger Old Pete's intro dialogue right away
    if (zoneIndex === 0 && this.currentZone.npc) {
      setTimeout(() => {
        this.startDialogue(this.currentZone.npc.name, this.currentZone.npc.dialogue);
      }, 500);
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
    this.keys[e.code] = true;

    // Initialize audio context on first key press
    window.soundEngine.init();

    // Advance Dialogue
    if (this.dialogueActive) {
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.advanceDialogue();
        return;
      }
    }

    if (this.state !== 'playing') return;

    // Space Bar: Shoot Revolver
    if (e.code === 'Space') {
      e.preventDefault();
      this.shootRevolver();
    }

    // R: Reload Revolver
    if (e.code === 'KeyR') {
      e.preventDefault();
      this.reloadRevolver();
    }

    // E: Interact
    if (e.code === 'KeyE') {
      e.preventDefault();
      this.interact();
    }

    // F: Dead-Eye Slow Motion
    if (e.code === 'KeyF') {
      e.preventDefault();
      this.toggleDeadEye();
    }

    // M: Mute toggle
    if (e.code === 'KeyM') {
      e.preventDefault();
      const active = window.soundEngine.toggleMute();
      document.getElementById('btn-sound-toggle').innerText = active ? '🔊 Sound: ON' : '🔈 Sound: OFF';
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  // --- COMBAT & MECHANICS ---
  shootRevolver() {
    if (this.player.isReloading) return;

    if (this.player.ammo <= 0) {
      window.soundEngine.playEmptyClick();
      this.showFloatingText(this.player.x, this.player.y - 25, '*CLICK* Reload [R]!', '#ff9800');
      this.reloadRevolver(); // auto reload on empty click
      return;
    }

    this.player.ammo--;
    this.stats.shotsFired++;
    this.updateCylinderHUD();

    window.soundEngine.playGunshot(true);

    this.player.isShooting = true;
    this.player.recoilTimer = 8;
    setTimeout(() => { this.player.isShooting = false; }, 90);

    // Calculate bullet velocity
    const angle = this.player.facingAngle;
    const speed = 14;

    this.bullets.push({
      x: this.player.x + Math.cos(angle) * 16,
      y: this.player.y + Math.sin(angle) * 16,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60,
      damage: 40
    });

    // Muzzle smoke particle
    this.createSmokeParticles(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, 5);
  }

  reloadRevolver() {
    if (this.player.isReloading || this.player.ammo === this.player.maxAmmo) return;

    this.player.isReloading = true;
    window.soundEngine.playReload();
    this.updateCylinderHUD();

    setTimeout(() => {
      this.player.ammo = this.player.maxAmmo;
      this.player.isReloading = false;
      this.updateCylinderHUD();
      this.showFloatingText(this.player.x, this.player.y - 25, 'LOADED!', '#ffd700');
    }, 700);
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

  interact() {
    // Check NPC interaction
    if (this.currentZone.npc) {
      const dist = Math.hypot(this.player.x - this.currentZone.npc.x, this.player.y - this.currentZone.npc.y);
      if (dist < 60) {
        this.startDialogue(this.currentZone.npc.name, this.currentZone.npc.dialogue);
        return;
      }
    }

    // Check Treasure Chest interaction in Zone 3
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
        if (this.currentZone.id === 1) {
          if (this.inventory.canyon_key) {
            this.completeLevel();
          } else {
            this.showBanner('Gate Locked! Find the Canyon Key in the scorpion nest!');
          }
        } else if (this.currentZone.id === 2) {
          if (this.inventory.map_complete) {
            this.completeLevel();
          } else {
            this.showBanner(`Requires 3 Map Fragments! (Found: ${this.inventory.mapFragments}/3)`);
          }
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

    const summaryText = this.currentZone.id === 1 
      ? 'You unlocked the Canyon Gates and braved through Rattlesnake Gulch!' 
      : 'You assembled the 3 Torn Map Fragments and located the secret entrance to El Dorado Cavern!';
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
    if (this.currentZone.id === 1) {
      this.dom.objectiveCounter.innerText = this.inventory.canyon_key ? 'Gate: UNLOCKED' : 'Key: 0/1';
    } else if (this.currentZone.id === 2) {
      this.dom.objectiveCounter.innerText = `Map: ${this.inventory.mapFragments}/3`;
    } else if (this.currentZone.id === 3) {
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
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
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

      // Check wall / obstacle hit
      if (this.checkObstacleCollision(b.x, b.y, 4)) {
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
        if (dist < 320) {
          en.x += Math.cos(angle) * en.speed * timeScale;
          en.y += Math.sin(angle) * en.speed * timeScale;
          if (dist < 22 && this.player.invulnerableTimer <= 0) {
            this.damagePlayer(15, 'Stung by a Desert Scorpion!');
          }
        }
      } else if (en.type === 'snake') {
        if (dist < 300) {
          if (dist < 140 && Math.random() < 0.03) {
            window.soundEngine.playRattle();
          }
          en.x += Math.cos(angle) * en.speed * timeScale;
          en.y += Math.sin(angle) * en.speed * timeScale;
          if (dist < 22 && this.player.invulnerableTimer <= 0) {
            this.damagePlayer(20, 'Bitten by a venomous Rattlesnake!');
          }
        }
      } else if (en.type === 'bandit') {
        if (dist < 420) {
          // Maintain tactical distance
          if (dist > 180) {
            en.x += Math.cos(angle) * en.speed * timeScale;
            en.y += Math.sin(angle) * en.speed * timeScale;
          } else if (dist < 100) {
            en.x -= Math.cos(angle) * en.speed * timeScale;
            en.y -= Math.sin(angle) * en.speed * timeScale;
          }

          en.shootCooldown = (en.shootCooldown || 140) - timeScale;
          if (en.shootCooldown <= 0) {
            en.shootCooldown = 130 + Math.random() * 50;
            window.soundEngine.playGunshot(false);
            const bSpeed = 7;
            this.enemyBullets.push({
              x: en.x + Math.cos(angle) * 16,
              y: en.y + Math.sin(angle) * 16,
              vx: Math.cos(angle) * bSpeed,
              vy: Math.sin(angle) * bSpeed,
              damage: 18,
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
            en.x += Math.cos(angle) * en.speed * timeScale;
            en.y += Math.sin(angle) * en.speed * timeScale;
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
    this.player.hp = Math.max(0, this.player.hp - amount);
    this.player.invulnerableTimer = 35; // invulnerability frames
    window.soundEngine.playPlayerHurt();
    this.createBloodSparks(this.player.x, this.player.y, 6);
    this.showFloatingText(this.player.x, this.player.y - 20, `-${amount}`, '#c0392b');

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
      this.inventory.canyon_key = true;
      window.soundEngine.playClueFound();
      this.showBanner(`Obtained: ${p.name}!`);
      this.showFloatingText(p.x, p.y, 'KEY ACQUIRED!', '#ffd700');
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

  checkObstacleCollision(x, y, radius) {
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
    for (const bar of this.barrels) {
      if (Math.hypot(x - bar.x, y - bar.y) < radius + 10) {
        return true;
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
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(g.x, g.y, g.width, g.height);
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 12px serif';
      ctx.fillText('EXIT GATE', g.x - 14, g.y - 10);
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

    // Colt Cassidy (Player)
    Sprites.drawPlayer(
      ctx,
      this.player.x,
      this.player.y,
      this.player.facingAngle,
      this.gameTime,
      this.player.isMoving,
      this.player.isShooting,
      this.player.recoilTimer,
      this.player.invulnerableTimer > 0
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
