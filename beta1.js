// Вспомогательная функция для преобразования hex в rgb
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "255, 0, 0";
  }
  
  // Игровые переменные
  let canvas, ctx;
  let player = { x: 400, y: 500, size: 30, speed: 3, color: "#48bb78" };
  let coins = [];
  let enemies = [];
  let bullets = [];
  let gameRunning = false;
  let gamePaused = false;
  let score = 0;
  let lives = 10;
  let currentLevel = 1;
  let difficulty = 'normal';
  let keys = {};
  let lastWaveTime = 0;
  let lastMagnetTime = 0;
  let isMagnetActive = false;
  let waveEffects = [];
  let magnetLines = [];
  
  // Настройки уровней
  const levelSettings = {
    easy: {
      1: { winScore: 10, enemySpeed: 1, enemySpawnRate: 800 },
      2: { winScore: 15, enemySpeed: 1.2, enemySpawnRate: 700 },
      3: { winScore: 20, enemySpeed: 1.4, enemySpawnRate: 600 },
      4: { winScore: 25, enemySpeed: 1.6, enemySpawnRate: 500 },
      5: { winScore: 30, enemySpeed: 1.8, enemySpawnRate: 400 },
      6: { winScore: 35, enemySpeed: 2, enemySpawnRate: 350 },
      7: { winScore: 40, enemySpeed: 2.2, enemySpawnRate: 300 },
      8: { winScore: 45, enemySpeed: 2.4, enemySpawnRate: 250 },
      9: { winScore: 50, enemySpeed: 2.6, enemySpawnRate: 200 },
      10: { winScore: 60, enemySpeed: 2.8, enemySpawnRate: 150 }
    },
    normal: {
      1: { winScore: 15, enemySpeed: 1.5, enemySpawnRate: 700 },
      2: { winScore: 20, enemySpeed: 1.7, enemySpawnRate: 600 },
      3: { winScore: 25, enemySpeed: 1.9, enemySpawnRate: 500 },
      4: { winScore: 30, enemySpeed: 2.1, enemySpawnRate: 400 },
      5: { winScore: 35, enemySpeed: 2.3, enemySpawnRate: 350 },
      6: { winScore: 40, enemySpeed: 2.5, enemySpawnRate: 300 },
      7: { winScore: 45, enemySpeed: 2.7, enemySpawnRate: 250 },
      8: { winScore: 50, enemySpeed: 2.9, enemySpawnRate: 200 },
      9: { winScore: 55, enemySpeed: 3.1, enemySpawnRate: 150 },
      10: { winScore: 70, enemySpeed: 3.3, enemySpawnRate: 100 }
    },
    hard: {
      1: { winScore: 20, enemySpeed: 2, enemySpawnRate: 600 },
      2: { winScore: 25, enemySpeed: 2.3, enemySpawnRate: 500 },
      3: { winScore: 30, enemySpeed: 2.6, enemySpawnRate: 400 },
      4: { winScore: 35, enemySpeed: 2.9, enemySpawnRate: 300 },
      5: { winScore: 40, enemySpeed: 3.2, enemySpawnRate: 250 },
      6: { winScore: 45, enemySpeed: 3.5, enemySpawnRate: 200 },
      7: { winScore: 50, enemySpeed: 3.8, enemySpawnRate: 150 },
      8: { winScore: 55, enemySpeed: 4.1, enemySpawnRate: 120 },
      9: { winScore: 60, enemySpeed: 4.4, enemySpawnRate: 100 },
      10: { winScore: 80, enemySpeed: 4.7, enemySpawnRate: 80 }
    }
  };
  
  // Прогресс
  let unlockedLevels = 1;
  let completedLevels = [];
  let unlockedEpisodes = 1;
  let lastAttemptedLevel = 1;
  
  // Улучшения
  let upgrades = {
    wave: 0,
    magnet: 0,
    health: 0,
    speed: 0
  };
  
  // Конфигурация улучшений
  const upgradeConfig = {
    wave: {
      maxLevel: 3,
      baseCooldown: 3000,
      cooldownReduction: [1000, 700, 500],
      costs: [800, 1500, 2500],
      effects: [
        "Сокращает перезарядку с 3 до 2 секунд",
        "Сокращает перезарядку до 1.3 секунд",
        "Сокращает перезарядку до 0.8 секунд"
      ]
    },
    magnet: {
      maxLevel: 3,
      baseCooldown: 5000,
      cooldownReduction: [2000, 1500, 1000],
      costs: [1000, 2000, 3500],
      effects: [
        "Сокращает перезарядку с 5 до 3 секунд",
        "Сокращает перезарядку до 1.5 секунд",
        "Сокращает перезарядку до 0.5 секунд"
      ]
    },
    health: {
      maxLevel: 3,
      baseHealth: 10,
      healthIncrease: [2, 3, 5],
      costs: [1200, 2500, 4000],
      effects: [
        "Увеличивает макс. здоровье до 12",
        "Увеличивает макс. здоровье до 15",
        "Увеличивает макс. здоровье до 20"
      ]
    },
    speed: {
      maxLevel: 3,
      baseSpeed: 3,
      speedIncrease: [0.5, 0.7, 1],
      costs: [900, 1800, 3000],
      effects: [
        "Увеличивает скорость до 3.5",
        "Увеличивает скорость до 4.2",
        "Увеличивает скорость до 5.0"
      ]
    }
  };
  
  // Ранг и опыт
  let rankLevel = 1;
  let currentExp = 0;
  let requiredExp = 100;
  let totalCoins = 0;
  let resetCount = 0;
  
  // Аудио
  const coinAudio = document.getElementById("coinSound");
  const hitAudio = document.getElementById("hitSound");
  const levelUpAudio = document.getElementById("levelUpSound");
  
  // === ИНИЦИАЛИЗАЦИЯ ===
  window.addEventListener("load", function () {
    loadProgress();
    updateDailyBonusButton();
    updateResetButton();
  });
  
  // === ОСНОВНЫЕ ФУНКЦИИ ИГРЫ ===
  function startGame() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
    gameRunning = true;
    gamePaused = false;
    initGame();
  }
  
  function initGame() {
    player.x = 400;
    player.y = 500;
    lives = maxLives;
    score = 0;
    enemies = [];
    coins = [];
    bullets = [];
    keys = {};
    lastWaveTime = 0;
    lastMagnetTime = 0;
    isMagnetActive = false;
    waveEffects = [];
    magnetLines = [];
  
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("level").textContent = currentLevel;
  
    spawnCoins();
    spawnEnemies();
  
    gameLoop = setInterval(update, 1000 / 60);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }
  
  function update() {
    if (!gameRunning || gamePaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    movePlayer();
    drawPlayer();
  
    coins.forEach((coin, i) => {
      if (checkCollision(player, coin)) {
        coins.splice(i, 1);
        score++;
        document.getElementById("score").textContent = score;
        coinAudio.play().catch(e => console.log("Ошибка воспроизведения звука монеты:", e));
        addExp(2);
      } else {
        drawCoin(coin);
      }
    });
  
    enemies.forEach((enemy, i) => {
      enemy.y += enemy.speed;
      if (enemy.y > canvas.height) {
        enemies.splice(i, 1);
        spawnEnemy();
      } else if (checkCollision(player, enemy)) {
        enemies.splice(i, 1);
        lives--;
        document.getElementById("lives").textContent = lives;
        hitAudio.play().catch(e => console.log("Ошибка воспроизведения звука удара:", e));
        addExp(3);
        spawnEnemy();
        if (lives <= 0) {
          gameOver();
        }
      } else {
        drawEnemy(enemy);
      }
    });
  
    waveEffects.forEach((effect, i) => {
      effect.radius += 5;
      effect.opacity -= 0.02;
      if (effect.opacity <= 0) {
        waveEffects.splice(i, 1);
      } else {
        drawWave(effect);
      }
    });
  
    magnetLines.forEach((line, i) => {
      line.length -= 5;
      if (line.length <= 0) {
        magnetLines.splice(i, 1);
      } else {
        drawMagnetLine(line);
      }
    });
  
    const levelConfig = levelSettings[difficulty][currentLevel];
    if (score >= levelConfig.winScore) {
      if (currentLevel < 10) {
        completeLevel();
      } else {
        winGame();
      }
    }
  
    updateCooldowns();
  }
  
  function spawnCoins() {
    for (let i = 0; i < 10; i++) {
      coins.push({
        x: Math.random() * (canvas.width - 20),
        y: Math.random() * (canvas.height - 100),
        size: 10,
        color: "#facc15"
      });
    }
  }
  
  function spawnEnemies() {
    const config = levelSettings[difficulty][currentLevel];
    setInterval(() => {
      if (gameRunning && !gamePaused) spawnEnemy();
    }, config.enemySpawnRate);
  }
  
  function spawnEnemy() {
    const size = 20;
    enemies.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size: size,
      speed: levelSettings[difficulty][currentLevel].enemySpeed,
      color: "#e53e3e"
    });
  }
  
  function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
  }
  
  function drawCoin(coin) {
    ctx.fillStyle = coin.color;
    ctx.beginPath();
    ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawEnemy(enemy) {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
  }
  
  function drawWave(wave) {
    ctx.strokeStyle = `rgba(124, 58, 237, ${wave.opacity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  function drawMagnetLine(line) {
    ctx.strokeStyle = "rgba(72, 187, 120, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x1 + Math.cos(line.angle) * line.length, line.y1 + Math.sin(line.angle) * line.length);
    ctx.stroke();
  }
  
  function checkCollision(a, b) {
    return a.x < b.x + b.size &&
           a.x + a.size > b.x &&
           a.y < b.y + b.size &&
           a.y + a.size > b.y;
  }
  
  function movePlayer() {
    const speed = isMagnetActive ? player.speed * 1.5 : player.speed;
    if (keys['w'] || keys['ArrowUp']) player.y = Math.max(0, player.y - speed);
    if (keys['s'] || keys['ArrowDown']) player.y = Math.min(canvas.height - player.size, player.y + speed);
    if (keys['a'] || keys['ArrowLeft']) player.x = Math.max(0, player.x - speed);
    if (keys['d'] || keys['ArrowRight']) player.x = Math.min(canvas.width - player.size, player.x + speed);
  }
  
  function onKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
  
    if (e.key === 'q' && canUseWave()) {
      useWave();
    }
    if (e.key === 'e' && canUseMagnet()) {
      useMagnet();
    }
  }
  
  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }
  
  // === СПОСОБНОСТИ ===
  function canUseWave() {
    return Date.now() - lastWaveTime > (upgradeConfig.wave.baseCooldown - (upgradeConfig.wave.cooldownReduction.slice(0, upgrades.wave).reduce((a, b) => a + b, 0)));
  }
  
  function useWave() {
    lastWaveTime = Date.now();
    waveEffects.push({ x: player.x + player.size / 2, y: player.y + player.size / 2, radius: 10, opacity: 1 });
    enemies = enemies.filter(enemy => {
      const dx = (player.x + player.size / 2) - (enemy.x + enemy.size / 2);
      const dy = (player.y + player.size / 2) - (enemy.y + enemy.size / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 100) {
        score += 2;
        document.getElementById("score").textContent = score;
        addExp(5);
        return false;
      }
      return true;
    });
  }
  
  function canUseMagnet() {
    return Date.now() - lastMagnetTime > (upgradeConfig.magnet.baseCooldown - (upgradeConfig.magnet.cooldownReduction.slice(0, upgrades.magnet).reduce((a, b) => a + b, 0)));
  }
  
  function useMagnet() {
    lastMagnetTime = Date.now();
    isMagnetActive = true;
    setTimeout(() => isMagnetActive = false, 3000);
  
    coins.forEach(coin => {
      const angle = Math.atan2(player.y - coin.y, player.x - coin.x);
      magnetLines.push({
        x1: coin.x + coin.size / 2,
        y1: coin.y + coin.size / 2,
        angle: angle,
        length: 100
      });
    });
  }
  
  function updateCooldowns() {
    const waveCooldown = upgradeConfig.wave.baseCooldown - (upgradeConfig.wave.cooldownReduction.slice(0, upgrades.wave).reduce((a, b) => a + b, 0));
    const magnetCooldown = upgradeConfig.magnet.baseCooldown - (upgradeConfig.magnet.cooldownReduction.slice(0, upgrades.magnet).reduce((a, b) => a + b, 0));
  
    const waveTimeLeft = waveCooldown - (Date.now() - lastWaveTime);
    const magnetTimeLeft = magnetCooldown - (Date.now() - lastMagnetTime);
  
    document.getElementById("waveCooldown").textContent = canUseWave() ? "Готова" : `${Math.ceil(waveTimeLeft / 1000)}с`;
    document.getElementById("magnetCooldown").textContent = canUseMagnet() ? "Готов" : `${Math.ceil(magnetTimeLeft / 1000)}с`;
  
    document.getElementById("waveCooldown").style.color = canUseWave() ? "#48bb78" : "#e53e3e";
    document.getElementById("magnetCooldown").style.color = canUseMagnet() ? "#48bb78" : "#e53e3e";
  }
  
  // === УРОВНИ И ПРОГРЕСС ===
  function completeLevel() {
    gameRunning = false;
    clearInterval(gameLoop);
    totalCoins += score;
    document.getElementById("totalCoins").textContent = totalCoins;
    if (!completedLevels.includes(currentLevel)) {
      completedLevels.push(currentLevel);
      if (unlockedLevels < 10) unlockedLevels++;
      if (currentLevel === 5) {
        showNotification("🔓 Открыт Эпизод 2: Тёмные глубины!");
        unlockedEpisodes = 2;
      }
    }
    lastAttemptedLevel = currentLevel + 1;
    saveProgress();
    document.getElementById("levelCompleteText").textContent = `Уровень ${currentLevel} пройден! Собрано: ${score} монет. Всего: ${totalCoins}`;
    document.getElementById("levelComplete").style.display = "block";
  }
  
  function nextLevel() {
    currentLevel = Math.min(currentLevel + 1, 10);
    document.getElementById("levelComplete").style.display = "none";
    startGame();
  }
  
  function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    document.getElementById("finalScore").textContent = `Вы проиграли на уровне ${currentLevel}. Собрано: ${score} монет. Всего: ${totalCoins}`;
    document.getElementById("gameOver").style.display = "block";
  }
  
  function winGame() {
    gameRunning = false;
    clearInterval(gameLoop);
    totalCoins += score;
    document.getElementById("finalWinScore").textContent = totalCoins;
    document.getElementById("winScreen").style.display = "block";
  }
  
  // === МАГАЗИН ===
  const shopItems = {
    abilities: [
      { id: "buyWaveBtn", title: "Улучшение волны", desc: "Сокращает время перезарядки волны", type: "wave" },
      { id: "buyMagnetBtn", title: "Улучшение магнита", desc: "Сокращает время перезарядки магнита", type: "magnet" }
    ],
    power: [
      { id: "buyHealthBtn", title: "Дополнительное здоровье", desc: "Увеличивает максимальное количество жизней", type: "health" },
      { id: "buySpeedBtn", title: "Увеличение скорости", desc: "Увеличивает скорость передвижения", type: "speed" }
    ],
    bonuses: [
      { id: "dailyBonusBtn", title: "Ежедневный бонус", desc: "Получайте 100 монет каждый день", type: "bonus" }
    ]
  };
  
  function switchTab(tab) {
    document.getElementById("tab-abilities").classList.toggle("active", tab === "abilities");
    document.getElementById("tab-power").classList.toggle("active", tab === "power");
    document.getElementById("tab-bonuses").classList.toggle("active", tab === "bonuses");
    renderShopItems(tab);
  }
  
  function renderShopItems(tab) {
    const container = document.getElementById("shopItems");
    container.innerHTML = "";
    shopItems[tab].forEach(item => {
      const shopItem = document.createElement("div");
      shopItem.className = tab === "bonuses" ? "shop-item bonus-item" : "shop-item";
  
      if (tab === "bonuses") {
        const now = Date.now();
        const lastBonusTime = localStorage.getItem("lastDailyBonusTime");
        let buttonText, isDisabled = false;
        if (lastBonusTime && now - parseInt(lastBonusTime) < 86400000) {
          const hoursLeft = Math.ceil((86400000 - (now - parseInt(lastBonusTime))) / 3600000);
          buttonText = `Доступно через ${hoursLeft}ч`;
          isDisabled = true;
        } else {
          buttonText = "Получить 100 монет";
          isDisabled = false;
        }
        shopItem.innerHTML = `
          <div class="daily-bonus-icon">🎁</div>
          <h3 class="bonus-title">${item.title}</h3>
          <p class="bonus-desc">${item.desc}</p>
          <button id="${item.id}" class="bonus-btn" onclick="claimDailyBonus()" ${isDisabled ? "disabled" : ""}>${buttonText}</button>
        `;
      } else {
        const currentLevel = upgrades[item.type];
        const config = upgradeConfig[item.type];
        const isMaxLevel = currentLevel >= config.maxLevel;
        const canAfford = totalCoins >= config.costs[currentLevel];
  
        let levelIndicator = '<div class="level-indicator">';
        for (let i = 0; i < config.maxLevel; i++) {
          levelIndicator += `<div class="level-dot-small ${i < currentLevel ? "active" : ""}"></div>`;
        }
        levelIndicator += "</div>";
  
        let buttonText = isMaxLevel ? "Макс. уровень" : `Купить за ${config.costs[currentLevel]}`;
  
        shopItem.innerHTML = `
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
          ${levelIndicator}
          <p>${config.effects[currentLevel] || "Максимальный уровень"}</p>
          <button id="${item.id}" onclick="buyUpgrade('${item.type}')" ${isMaxLevel || !canAfford ? "disabled" : ""}>${buttonText}</button>
        `;
      }
      container.appendChild(shopItem);
    });
  }
  
  function buyUpgrade(type) {
    const level = upgrades[type];
    const cost = upgradeConfig[type].costs[level];
    if (level >= upgradeConfig[type].maxLevel) return;
    if (totalCoins < cost) {
      showNotification("Недостаточно монет!");
      return;
    }
  
    totalCoins -= cost;
    upgrades[type]++;
    document.getElementById("totalCoins").textContent = totalCoins;
    saveProgress();
    applyUpgradeEffect(type);
    renderShopItems(document.getElementById("tab-abilities").classList.contains("active") ? "abilities" : "power");
    showNotification(`⚡ Уровень ${upgrades[type]} улучшения ${type} куплен!`);
    showPurchaseAnimation(cost);
  }
  
  function applyUpgradeEffect(type) {
    if (type === "health") maxLives = upgradeConfig.health.baseHealth + upgradeConfig.health.healthIncrease.slice(0, upgrades.health).reduce((a, b) => a + b, 0);
    if (type === "speed") player.speed = upgradeConfig.speed.baseSpeed + upgradeConfig.speed.speedIncrease.slice(0, upgrades.speed).reduce((a, b) => a + b, 0);
  }
  
  // === ЕЖЕДНЕВНЫЙ БОНУС ===
  function claimDailyBonus() {
    const now = Date.now();
    const lastBonusTime = localStorage.getItem("lastDailyBonusTime");
    if (lastBonusTime && now - parseInt(lastBonusTime) < 86400000) {
      showNotification("Бонус можно получить только раз в 24 часа!");
      return;
    }
    totalCoins += 100;
    localStorage.setItem("totalCoins", totalCoins);
    localStorage.setItem("lastDailyBonusTime", now);
    document.getElementById("totalCoins").textContent = totalCoins;
    document.getElementById("dailyBonusBtn").textContent = "Бонус получен!";
    document.getElementById("dailyBonusBtn").disabled = true;
    setTimeout(updateDailyBonusButton, 60000);
    showNotification("🎉 Вы получили 100 монет! Возвращайтесь завтра!");
    showPurchaseAnimation(100);
  }
  
  function updateDailyBonusButton() {
    const now = Date.now();
    const lastBonusTime = localStorage.getItem("lastDailyBonusTime");
    const btn = document.getElementById("dailyBonusBtn");
    if (!btn) return;
    if (lastBonusTime && now - parseInt(lastBonusTime) < 86400000) {
      const hoursLeft = Math.ceil((86400000 - (now - parseInt(lastBonusTime))) / 3600000);
      btn.textContent = `Доступно через ${hoursLeft}ч`;
      btn.disabled = true;
    } else {
      btn.textContent = "Получить 100 монет";
      btn.disabled = false;
    }
  }
  
  // === РАНГ И ОПЫТ ===
  function calculateRequiredExp(level) {
    return 100 + (level - 1) * 50;
  }
  
  function addExp(amount) {
    currentExp += amount;
    while (currentExp >= requiredExp) {
      currentExp -= requiredExp;
      rankLevel++;
      requiredExp = calculateRequiredExp(rankLevel);
      showNotification(`🎉 Поздравляем! Вы достигли ${rankLevel} ранга!`);
      if (rankLevel % 5 === 0) {
        totalCoins += 50;
        document.getElementById("totalCoins").textContent = totalCoins;
        showNotification(`🎁 Бонус! Получено 50 монет за достижение ${rankLevel} ранга!`);
      }
      levelUpAudio.play().catch(() => {});
    }
    updateExpBar();
  }
  
  function updateExpBar() {
    const expPercentage = (currentExp / requiredExp) * 100;
    document.getElementById("expBar").style.width = expPercentage + "%";
    document.getElementById("rankLevel").textContent = rankLevel;
    document.getElementById("currentExp").textContent = currentExp;
    document.getElementById("requiredExp").textContent = requiredExp;
  
    if (document.getElementById("expBarStart")) {
      document.getElementById("expBarStart").style.width = expPercentage + "%";
      document.getElementById("rankLevelStart").textContent = rankLevel;
      document.getElementById("currentExpStart").textContent = currentExp;
      document.getElementById("requiredExpStart").textContent = requiredExp;
    }
    updateResetButton();
  }
  
  // === СБРОС ПРОГРЕССА ===
  function canResetProgress() {
    return rankLevel % 10 === 0 && rankLevel > 0;
  }
  
  function updateResetButton() {
    const btn = document.getElementById("resetButton");
    const badge = document.getElementById("resetBadge");
    const tooltip = document.getElementById("resetTooltip");
    if (canResetProgress()) {
      btn.classList.remove("reset-locked");
      btn.style.cursor = "pointer";
      tooltip.style.display = "none";
    } else {
      btn.classList.add("reset-locked");
      btn.style.cursor = "not-allowed";
      tooltip.style.display = "block";
    }
    badge.textContent = resetCount;
  }
  
  function showResetScreen() {
    if (!canResetProgress()) {
      showNotification("Сброс возможен только на 10, 20, 30... рангах!");
      return;
    }
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("resetScreen").style.display = "block";
  }
  
  function confirmReset() {
    resetCount++;
    localStorage.setItem("resetCount", resetCount);
    totalCoins = 0;
    unlockedLevels = 1;
    completedLevels = [];
    unlockedEpisodes = 1;
    lastAttemptedLevel = 1;
    upgrades = { wave: 0, magnet: 0, health: 0, speed: 0 };
    waveCooldown = 3000;
    magnetCooldown = 5000;
    maxLives = 10;
    player.speed = 3;
  
    // Удаляем данные
    ["unlockedLevels", "completedLevels", "unlockedEpisodes", "upgrades", "totalCoins", "lastAttemptedLevel", "lastDailyBonusTime"]
      .forEach(key => localStorage.removeItem(key));
  
    document.getElementById("totalCoins").textContent = totalCoins;
    document.getElementById("resetScreen").style.display = "none";
    document.getElementById("startScreen").style.display = "block";
    updateResetButton();
    showNotification(`🔄 Прогресс сброшен! Вы ${resetCount} раз(а) сбрасывали прогресс.`);
  }
  
  function cancelReset() {
    document.getElementById("resetScreen").style.display = "none";
    document.getElementById("startScreen").style.display = "block";
  }
  
  // === ДРУГИЕ ФУНКЦИИ ===
  function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.textContent = message;
    notif.classList.add("show");
    setTimeout(() => notif.classList.remove("show"), 3000);
  }
  
  function showPurchaseAnimation(amount) {
    const coin = document.createElement("div");
    coin.className = "purchase-animation";
    coin.textContent = "-" + amount;
    document.body.appendChild(coin);
    setTimeout(() => { if (coin.parentNode) coin.parentNode.removeChild(coin); }, 1500);
  }
  
  function saveProgress() {
    localStorage.setItem("unlockedLevels", unlockedLevels);
    localStorage.setItem("completedLevels", JSON.stringify(completedLevels));
    localStorage.setItem("unlockedEpisodes", unlockedEpisodes);
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
    localStorage.setItem("totalCoins", totalCoins);
    localStorage.setItem("lastAttemptedLevel", lastAttemptedLevel);
    localStorage.setItem("rankLevel", rankLevel);
    localStorage.setItem("currentExp", currentExp);
    localStorage.setItem("resetCount", resetCount);
  }
  
  function loadProgress() {
    unlockedLevels = parseInt(localStorage.getItem("unlockedLevels")) || 1;
    completedLevels = JSON.parse(localStorage.getItem("completedLevels")) || [];
    unlockedEpisodes = parseInt(localStorage.getItem("unlockedEpisodes")) || 1;
    const savedUpgrades = localStorage.getItem("upgrades");
    if (savedUpgrades) upgrades = JSON.parse(savedUpgrades);
    totalCoins = parseInt(localStorage.getItem("totalCoins")) || 0;
    lastAttemptedLevel = parseInt(localStorage.getItem("lastAttemptedLevel")) || 1;
    rankLevel = parseInt(localStorage.getItem("rankLevel")) || 1;
    currentExp = parseInt(localStorage.getItem("currentExp")) || 0;
    requiredExp = calculateRequiredExp(rankLevel);
    resetCount = parseInt(localStorage.getItem("resetCount")) || 0;
  
    Object.keys(upgradeConfig).forEach(type => {
      if (upgrades[type] > 0) applyUpgradeEffect(type);
    });
  
    if (document.getElementById("totalCoins")) {
      document.getElementById("totalCoins").textContent = totalCoins;
    }
    updateExpBar();
  }
  
  function showShop() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("shopScreen").style.display = "block";
    switchTab("abilities");
    updateDailyBonusButton();
  }
  
  function showGloryRoad() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gloryRoad").style.display = "block";
    renderGloryRoad();
  }
  
  function renderGloryRoad() {
    const c1 = document.getElementById("episode1Levels");
    const c2 = document.getElementById("episode2Levels");
    c1.innerHTML = "";
    c2.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const dot = document.createElement("div");
      dot.className = "level-dot";
      dot.textContent = i;
      if (completedLevels.includes(i)) dot.classList.add("completed");
      else if (i > unlockedLevels) dot.classList.add("locked");
      else dot.classList.add("current");
      if (i <= unlockedLevels) {
        dot.onclick = () => {
          if (confirm("Начать уровень " + i + "? Ваши монеты сохранятся.")) {
            currentLevel = i;
            startGame();
          }
        };
      }
      c1.appendChild(dot);
    }
    for (let i = 6; i <= 10; i++) {
      const dot = document.createElement("div");
      dot.className = "level-dot";
      dot.textContent = i;
      if (completedLevels.includes(i)) dot.classList.add("completed");
      else if (i > unlockedLevels) dot.classList.add("locked");
      else dot.classList.add("current");
      if (i <= unlockedLevels) {
        dot.onclick = () => {
          if (confirm("Начать уровень " + i + "? Ваши монеты сохранятся.")) {
            currentLevel = i;
            startGame();
          }
        };
      }
      c2.appendChild(dot);
    }
  }
  
  function setDifficulty(diff) {
    difficulty = diff;
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  }
  
  function showDifficultyScreen() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("difficultyScreen").style.display = "block";
  }
  
  function saveAndReturnToMain() {
    document.getElementById("difficultyScreen").style.display = "none";
    document.getElementById("startScreen").style.display = "block";
  }
  
  function togglePause() {
    if (gameRunning && !gamePaused) showPauseScreen();
    else if (gameRunning && gamePaused) hidePauseScreen();
  }
  
  function showPauseScreen() {
    if (gameRunning) {
      document.getElementById("pauseScreen").style.display = "block";
      gamePaused = true;
    }
  }
  
  function hidePauseScreen() {
    document.getElementById("pauseScreen").style.display = "none";
    gamePaused = false;
  }
  
  function restartGame() {
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("winScreen").style.display = "none";
    startGame();
  }