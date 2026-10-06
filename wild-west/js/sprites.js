/**
 * Sprites & Visual Art System for "Desperado's Gold"
 * Renders procedural, highly expressive 2D characters, enemies, western buildings,
 * foliage, and the Legendary Spanish Treasure Chest using HTML5 Canvas.
 */

const Sprites = {
  // --- PLAYER: COLT CASSIDY ---
  drawPlayer(ctx, x, y, angle, animTime, isMoving, isShooting, recoilTime, invulnerable) {
    ctx.save();
    ctx.translate(x, y);

    // Invulnerability blink
    if (invulnerable && Math.floor(animTime * 15) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Walking leg bobbing
    const walkBob = isMoving ? Math.sin(animTime * 12) * 3 : 0;
    const legOffset = isMoving ? Math.sin(animTime * 12) * 5 : 0;

    // Boots
    ctx.fillStyle = '#3a2312'; // dark leather
    ctx.fillRect(-8, 12 + legOffset, 6, 7);
    ctx.fillRect(2, 12 - legOffset, 6, 7);

    // Spurs (brass shine)
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-9, 17 + legOffset, 2, 2);
    ctx.fillRect(7, 17 - legOffset, 2, 2);

    // Pants (blue denim)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-7, 2 + walkBob, 6, 11);
    ctx.fillRect(1, 2 + walkBob, 6, 11);

    // Gun belt & Holster
    ctx.fillStyle = '#4a2c16';
    ctx.fillRect(-8, 1 + walkBob, 16, 3);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-2, 1 + walkBob, 4, 3); // belt buckle

    // Duster Coat & Torso
    ctx.fillStyle = '#8b5a2b'; // tan leather coat
    ctx.beginPath();
    ctx.moveTo(-10, -10 + walkBob);
    ctx.lineTo(10, -10 + walkBob);
    ctx.lineTo(12, 10 + walkBob);
    ctx.lineTo(-12, 10 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Red Neck Bandana
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.moveTo(-4, -10 + walkBob);
    ctx.lineTo(4, -10 + walkBob);
    ctx.lineTo(0, -4 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#e0ac69'; // skin tone
    ctx.beginPath();
    ctx.arc(0, -14 + walkBob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cowboy Hat (Brim and Crown)
    ctx.fillStyle = '#4a2c16';
    // Brim
    ctx.beginPath();
    ctx.ellipse(0, -16 + walkBob, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crown
    ctx.beginPath();
    ctx.moveTo(-7, -16 + walkBob);
    ctx.lineTo(-5, -24 + walkBob);
    ctx.lineTo(0, -22 + walkBob); // crease
    ctx.lineTo(5, -24 + walkBob);
    ctx.lineTo(7, -16 + walkBob);
    ctx.closePath();
    ctx.fill();
    // Hat Band
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-6, -18 + walkBob, 12, 2);

    // Gun Arm (rotates towards shooting/facing angle)
    ctx.save();
    ctx.translate(0, -6 + walkBob);
    ctx.rotate(angle);

    // Arm
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, -3, 14, 5);

    // Revolver in hand
    const recoilOffset = recoilTime > 0 ? -4 : 0;
    ctx.translate(14 + recoilOffset, 0);

    // Revolver frame
    ctx.fillStyle = '#333';
    ctx.fillRect(0, -2, 10, 3);
    // Cylinder
    ctx.fillStyle = '#555';
    ctx.fillRect(1, -3, 4, 5);
    // Wood grip
    ctx.fillStyle = '#7a3e1d';
    ctx.fillRect(-2, 1, 4, 4);

    // Muzzle Flash
    if (isShooting) {
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(12, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(14, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  },

  // --- OUTLAW BANDIT ---
  drawBandit(ctx, x, y, angle, animTime, isMoving, isBoss = false) {
    ctx.save();
    ctx.translate(x, y);

    const scale = isBoss ? 1.4 : 1.0;
    ctx.scale(scale, scale);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    const walkBob = isMoving ? Math.sin(animTime * 10) * 2 : 0;
    const legOffset = isMoving ? Math.sin(animTime * 10) * 4 : 0;

    // Boots
    ctx.fillStyle = '#111';
    ctx.fillRect(-7, 12 + legOffset, 5, 7);
    ctx.fillRect(2, 12 - legOffset, 5, 7);

    // Pants (Dark charcoal)
    ctx.fillStyle = '#222';
    ctx.fillRect(-7, 2 + walkBob, 5, 11);
    ctx.fillRect(2, 2 + walkBob, 5, 11);

    // Coat / Vest
    ctx.fillStyle = isBoss ? '#1a1a1a' : '#3e2723';
    ctx.beginPath();
    ctx.moveTo(-10, -10 + walkBob);
    ctx.lineTo(10, -10 + walkBob);
    ctx.lineTo(11, 10 + walkBob);
    ctx.lineTo(-11, 10 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Bandolier (Ammo sash across chest)
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.moveTo(-9, -9 + walkBob);
    ctx.lineTo(9, 7 + walkBob);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#5d4037';
    ctx.stroke();

    // Bullets on bandolier
    ctx.fillStyle = '#ffd700';
    for (let i = -5; i <= 5; i += 4) {
      ctx.fillRect(i, i * 0.7 + walkBob - 2, 2, 3);
    }

    // Bandit Mask / Face
    ctx.fillStyle = '#d7a15c';
    ctx.beginPath();
    ctx.arc(0, -13 + walkBob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Outlaw Bandana over lower face
    ctx.fillStyle = isBoss ? '#b71c1c' : '#212121';
    ctx.beginPath();
    ctx.moveTo(-5, -12 + walkBob);
    ctx.lineTo(5, -12 + walkBob);
    ctx.lineTo(0, -7 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Menacing Eyes
    ctx.fillStyle = isBoss ? '#ff1744' : '#fff';
    ctx.fillRect(-3, -15 + walkBob, 2, 2);
    ctx.fillRect(2, -15 + walkBob, 2, 2);

    // Black Cowboy Hat
    ctx.fillStyle = isBoss ? '#0a0a0a' : '#1b1b1b';
    ctx.beginPath();
    ctx.ellipse(0, -16 + walkBob, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-7, -16 + walkBob);
    ctx.lineTo(-5, -24 + walkBob);
    ctx.lineTo(5, -24 + walkBob);
    ctx.lineTo(7, -16 + walkBob);
    ctx.closePath();
    ctx.fill();

    // Boss Skull Buckle / Gold Hat Rim
    if (isBoss) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-6, -18 + walkBob, 12, 2);
    }

    // Gun Arm
    ctx.save();
    ctx.translate(0, -6 + walkBob);
    ctx.rotate(angle);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, -3, 14, 5);
    ctx.fillStyle = '#222';
    ctx.fillRect(12, -2, 10, 3); // gun barrel
    ctx.restore();

    ctx.restore();
  },

  // --- DYNAMITE CHUCKER ---
  drawDynamiteBandit(ctx, x, y, angle, animTime) {
    this.drawBandit(ctx, x, y, angle, animTime, false, false);

    // Draw burning TNT stick in other hand
    ctx.save();
    ctx.translate(x - 10, y - 4);
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(0, 0, 4, 12);
    // Fuse
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, -4);
    ctx.stroke();
    // Spark
    ctx.fillStyle = Math.random() > 0.5 ? '#ffeb3b' : '#ff5722';
    ctx.beginPath();
    ctx.arc(2, -5, 2 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // --- DESERT SCORPION ---
  drawScorpion(ctx, x, y, angle, animTime) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (6 scurrying legs)
    ctx.strokeStyle = '#5a3d28';
    ctx.lineWidth = 1.8;
    for (let i = -1; i <= 1; i++) {
      const legWiggle = Math.sin(animTime * 18 + i * 2) * 4;
      // Left leg
      ctx.beginPath();
      ctx.moveTo(i * 4, -4);
      ctx.lineTo(i * 5 - 8, -8 + legWiggle);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(i * 4, 4);
      ctx.lineTo(i * 5 - 8, 8 - legWiggle);
      ctx.stroke();
    }

    // Body segments
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front Claws
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2.5;
    const clawTwitch = Math.sin(animTime * 8) * 2;
    // Left claw
    ctx.beginPath();
    ctx.moveTo(6, -3);
    ctx.lineTo(12, -7 + clawTwitch);
    ctx.stroke();
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(13, -7 + clawTwitch, 3, 0, Math.PI * 2);
    ctx.fill();

    // Right claw
    ctx.beginPath();
    ctx.moveTo(6, 3);
    ctx.lineTo(12, 7 - clawTwitch);
    ctx.stroke();
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(13, 7 - clawTwitch, 3, 0, Math.PI * 2);
    ctx.fill();

    // Tail & Stinger
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-14, -8, -12, -14);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#5d4037';
    ctx.stroke();

    // Stinger Bulb & Poison Tip
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(-12, -14, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#27ae60'; // venom green tip
    ctx.beginPath();
    ctx.arc(-11, -16, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  // --- RATTLESNAKE ---
  drawSnake(ctx, x, y, angle, animTime) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Slithering wavy body
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#8d6e63';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    for (let i = 12; i >= -14; i -= 2) {
      const wave = Math.sin(animTime * 10 + i * 0.3) * 4;
      ctx.lineTo(i, wave);
    }
    ctx.stroke();

    // Diamond pattern
    ctx.fillStyle = '#3e2723';
    for (let i = 8; i >= -8; i -= 4) {
      const wave = Math.sin(animTime * 10 + i * 0.3) * 4;
      ctx.fillRect(i - 1, wave - 1.5, 3, 3);
    }

    // Head
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.ellipse(14, 0, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red flicking tongue
    if (Math.sin(animTime * 8) > 0.4) {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(24, 0);
      ctx.lineTo(26, -1);
      ctx.moveTo(24, 0);
      ctx.lineTo(26, 1);
      ctx.stroke();
    }

    // Rattle tail tip (vibrating)
    const rattleWiggle = (Math.random() - 0.5) * 3;
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(-17, rattleWiggle - 2, 4, 4);

    ctx.restore();
  },

  // --- OLD PETE (PROSPECTOR NPC) ---
  drawProspector(ctx, x, y, animTime) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    const idleBob = Math.sin(animTime * 3) * 1.5;

    // Overalls / Clothes
    ctx.fillStyle = '#546e7a'; // faded blue denim overalls
    ctx.fillRect(-8, 2 + idleBob, 16, 14);

    // Flannel shirt
    ctx.fillStyle = '#c62828'; // red plaid shirt
    ctx.fillRect(-7, -8 + idleBob, 14, 10);

    // Big White Bushy Beard
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.moveTo(-6, -10 + idleBob);
    ctx.lineTo(6, -10 + idleBob);
    ctx.lineTo(5, 5 + idleBob);
    ctx.lineTo(0, 8 + idleBob);
    ctx.lineTo(-5, 5 + idleBob);
    ctx.closePath();
    ctx.fill();

    // Face & Nose
    ctx.fillStyle = '#e0ac69';
    ctx.beginPath();
    ctx.arc(0, -11 + idleBob, 5, 0, Math.PI * 2);
    ctx.fill();
    // Red rosy nose
    ctx.fillStyle = '#e57373';
    ctx.beginPath();
    ctx.arc(0, -10 + idleBob, 2, 0, Math.PI * 2);
    ctx.fill();

    // Floppy Prospector Hat
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.ellipse(0, -15 + idleBob, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -17 + idleBob, 7, Math.PI, 0);
    ctx.fill();

    // Pickaxe leaning on back
    ctx.save();
    ctx.rotate(0.4);
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(8, -18 + idleBob, 3, 28); // handle
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.arc(9.5, -18 + idleBob, 8, Math.PI * 0.9, Math.PI * 1.8);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#78909c';
    ctx.stroke();
    ctx.restore();

    // Animated exclamation or greeting icon
    const iconFloat = Math.sin(animTime * 4) * 3;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('💬', 0, -28 + iconFloat);

    ctx.restore();
  },

  // --- THE LEGENDARY SPANISH TREASURE CHEST ---
  drawTreasureChest(ctx, x, y, isOpen, animTime) {
    ctx.save();
    ctx.translate(x, y);

    // Glowing aura if opened
    if (isOpen) {
      const glowRad = 40 + Math.sin(animTime * 6) * 10;
      const radGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, glowRad);
      radGrad.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
      radGrad.addColorStop(0.5, 'rgba(255, 165, 0, 0.3)');
      radGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
      ctx.fill();

      // Radiating light rays
      ctx.save();
      ctx.rotate(animTime * 0.5);
      ctx.strokeStyle = 'rgba(255, 235, 59, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(i * Math.PI / 4) * 60, Math.sin(i * Math.PI / 4) * 60);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Chest shadow
    ctx.beginPath();
    ctx.ellipse(0, 16, 24, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Chest Base (Rich Spanish Mahogany)
    ctx.fillStyle = '#5c2c16';
    ctx.fillRect(-18, 0, 36, 18);

    // Iron Banding & Rivets
    ctx.fillStyle = '#ffd700'; // Gold-plated royal spanish bands
    ctx.fillRect(-16, 0, 4, 18);
    ctx.fillRect(12, 0, 4, 18);
    ctx.fillRect(-18, 14, 36, 3);

    // Keyhole / Skull Plate
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-1.5, 8, 3, 4);

    if (!isOpen) {
      // Closed Lid (curved wood barrel top)
      ctx.fillStyle = '#793d1f';
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 8, 0, Math.PI, 0);
      ctx.fill();

      // Gold bands on lid
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(-14, 0, 2, 7, 0, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(14, 0, 2, 7, 0, Math.PI, 0);
      ctx.stroke();

      // Shiny lock icon pulse
      const lockGlow = (Math.sin(animTime * 4) + 1) * 0.5;
      ctx.fillStyle = `rgba(255, 215, 0, ${0.4 + lockGlow * 0.6})`;
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Opened Lid hinged upward
      ctx.save();
      ctx.translate(0, -2);
      ctx.rotate(-0.35);
      ctx.fillStyle = '#793d1f';
      ctx.fillRect(-19, -16, 38, 14);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-16, -16, 4, 14);
      ctx.fillRect(12, -16, 4, 14);
      ctx.restore();

      // Overflowing Gold Coins & Jewels!
      ctx.fillStyle = '#ffd700';
      for (let i = -14; i <= 14; i += 4) {
        ctx.beginPath();
        ctx.arc(i, -1 + (i % 3), 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rubies & Emeralds
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-6, -4, 4, 4);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(4, -3, 3, 3);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(8, -2, 3, 3);
    }

    ctx.restore();
  },

  // --- ENVIRONMENT: SAGUARO CACTUS ---
  drawCactus(ctx, x, y, animTime) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();

    ctx.fillStyle = '#2e7d32'; // desert cactus green

    // Main Trunk
    ctx.beginPath();
    ctx.roundRect(-7, -42, 14, 46, 6);
    ctx.fill();

    // Left Arm
    ctx.beginPath();
    ctx.roundRect(-20, -26, 16, 6, 3);
    ctx.roundRect(-20, -38, 6, 16, 3);
    ctx.fill();

    // Right Arm
    ctx.beginPath();
    ctx.roundRect(4, -20, 16, 6, 3);
    ctx.roundRect(14, -34, 6, 18, 3);
    ctx.fill();

    // Vertical Rib Lines
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -40);
    ctx.lineTo(-3, 2);
    ctx.moveTo(3, -40);
    ctx.lineTo(3, 2);
    ctx.stroke();

    ctx.restore();
  },

  // --- ENVIRONMENT: WOODEN BARREL (Destructible) ---
  drawBarrel(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 10, 11, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Barrel Staves
    ctx.fillStyle = '#6d4c41';
    ctx.beginPath();
    ctx.roundRect(-10, -12, 20, 22, 4);
    ctx.fill();

    // Metal Hoops
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-10.5, -9, 21, 3);
    ctx.fillRect(-10.5, 4, 21, 3);

    // Top Rim
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.ellipse(0, -11, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  // --- ENVIRONMENT: TUMBLEWEED ---
  drawTumbleweed(ctx, x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.strokeStyle = '#bcaaa4';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 9 + (i % 3) * 2, i * 0.9, i * 0.9 + Math.PI * 1.2);
      ctx.stroke();
    }

    ctx.restore();
  },

  // --- ENVIRONMENT: WESTERN BUILDINGS (Saloon, Sheriff, Mine) ---
  drawBuilding(ctx, x, y, width, height, type = 'saloon') {
    ctx.save();
    ctx.translate(x, y);

    // Foundation Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, height, width, 8);

    // Main Wood Wall
    ctx.fillStyle = type === 'saloon' ? '#5d4037' : (type === 'sheriff' ? '#4e342e' : '#3e2723');
    ctx.fillRect(0, 0, width, height);

    // Wood horizontal planks
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1;
    for (let py = 12; py < height; py += 12) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    // False Western Facade / Roof Parapet
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-4, -14, width + 8, 14);

    // Decorative stepped pediment top
    ctx.beginPath();
    ctx.moveTo(width * 0.2, -14);
    ctx.lineTo(width * 0.35, -24);
    ctx.lineTo(width * 0.65, -24);
    ctx.lineTo(width * 0.8, -14);
    ctx.closePath();
    ctx.fill();

    // Signboard
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(width * 0.2, -8, width * 0.6, 16);
    ctx.strokeStyle = '#5d4037';
    ctx.strokeRect(width * 0.2, -8, width * 0.6, 16);

    ctx.fillStyle = '#212121';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'center';
    const title = type === 'saloon' ? 'SALOON' : (type === 'sheriff' ? 'SHERIFF' : 'GOLD MINE');
    ctx.fillText(title, width * 0.5, 4);

    // Doorway
    const doorW = 28;
    const doorH = 36;
    const doorX = (width - doorW) / 2;
    const doorY = height - doorH;

    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(doorX, doorY, doorW, doorH);

    // Batwing swinging doors for Saloon
    if (type === 'saloon') {
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(doorX + 2, doorY + 8, 11, 20);
      ctx.fillRect(doorX + 15, doorY + 8, 11, 20);
    }

    // Windows
    [-30, 30].forEach(offset => {
      const winX = width * 0.5 + offset - 10;
      if (winX > 8 && winX < width - 24) {
        ctx.fillStyle = '#ffd54f'; // warm lantern glow inside
        ctx.fillRect(winX, height - 36, 18, 20);
        ctx.strokeStyle = '#3e2723';
        ctx.strokeRect(winX, height - 36, 18, 20);
        // Window frame crosses
        ctx.beginPath();
        ctx.moveTo(winX + 9, height - 36);
        ctx.lineTo(winX + 9, height - 16);
        ctx.moveTo(winX, height - 26);
        ctx.lineTo(winX + 18, height - 26);
        ctx.stroke();
      }
    });

    ctx.restore();
  },

  // --- COLLECTIBLES (Coin, Key, Map Piece, Whiskey Bottle) ---
  drawPickup(ctx, x, y, type, animTime) {
    ctx.save();
    ctx.translate(x, y);

    const floatY = Math.sin(animTime * 5) * 3;
    ctx.translate(0, floatY);

    if (type === 'coin') {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb300';
      ctx.font = 'bold 8px serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 3);
    } else if (type === 'key') {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-2, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-2, -1, 3, 9);
      ctx.fillRect(1, 4, 3, 2);
      ctx.fillRect(1, 7, 3, 2);
    } else if (type === 'map') {
      ctx.fillStyle = '#f4e4ba';
      ctx.fillRect(-6, -7, 12, 14);
      ctx.strokeStyle = '#8d6e63';
      ctx.strokeRect(-6, -7, 12, 14);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 9px serif';
      ctx.textAlign = 'center';
      ctx.fillText('X', 0, 3);
    } else if (type === 'health') {
      // Whiskey Tonic flask
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.roundRect(-4, -6, 8, 12, 2);
      ctx.fill();
      ctx.fillStyle = '#c62828';
      ctx.fillRect(-4, -2, 8, 4); // red cross label
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-2, -8, 4, 3); // cork
    } else if (type === 'ammo') {
      // Brass ammo box
      ctx.fillStyle = '#37474f';
      ctx.fillRect(-6, -5, 12, 10);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-4, -3, 2, 6);
      ctx.fillRect(-1, -3, 2, 6);
      ctx.fillRect(2, -3, 2, 6);
    }

    ctx.restore();
  }
};

window.Sprites = Sprites;
