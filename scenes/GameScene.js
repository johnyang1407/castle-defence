import {
  GAME,
  CASTLE,
  CRITICAL,
  ENERGY,
  TIMER,
  COLORS,
  DEPTH,
} from "../config/constants.js";
import { AI_CONFIG, PLAYER_DECK } from "../config/aiConfig.js";
import {
  getMonsterCost,
  getMonsterRespawnCooldown,
  calculateMonsterStats,
} from "../config/monsterData.js";
import Castle from "../entities/Castle.js";
import Monster from "../entities/Monster.js";
import Projectile from "../entities/Projectile.js";

/**
 * GameScene - 메인 게임 플레이 씬
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  init(data) {
    // MenuScene에서 전달받은 AI 레벨
    this.aiLevel = data.aiLevel || "normal";
    this.aiConfig = AI_CONFIG[this.aiLevel];
  }

  create() {
    const { width, height } = this.scale;

    // 레이아웃 상수 정의
    this.UI_PANEL_HEIGHT = 120; // 하단 카드 UI 영역 높이
    this.GAME_FIELD_HEIGHT = height - this.UI_PANEL_HEIGHT; // 게임 필드 높이
    this.GROUND_HEIGHT = 50; // 바닥 높이
    this.GROUND_Y = this.GAME_FIELD_HEIGHT - this.GROUND_HEIGHT; // 바닥 Y 위치 (550)

    // 게임 상태 초기화
    this.initGameState();

    // 배경 및 바닥 생성
    this.createBackground(width, height);

    // 성 생성
    this.createCastles(width, height);

    // 몬스터/투사체 그룹 생성
    this.createGroups();

    // UI 생성
    this.createUI(width, height);

    // 타이머 및 이벤트 설정
    this.setupTimers();

    // 충돌 감지 설정
    this.setupCollisions();

    // 덱 UI 생성 (하단 패널)
    this.createDeckUI(width, height);

    console.log(`GameScene: 게임 시작 (AI: ${this.aiLevel})`);
  }

  initGameState() {
    this.gameOver = false;
    this.winner = null;

    // 에너지 (난이도별 최대값 적용)
    this.playerEnergy = ENERGY.INIT;
    this.aiEnergy = ENERGY.INIT;
    this.maxEnergy = this.aiConfig.maxEnergy || ENERGY.MAX;

    // 타이머
    this.remainingTime = TIMER.TOTAL_TIME;

    // 플레이어 덱 (10개 몬스터, common~super_epic 랜덤)
    this.playerDeck = this.generatePlayerDeck();
    this.deckCooldownUntil = this.playerDeck.map(() => 0);

    // 배틀필드 몬스터 수 추적 (요구사항: 동시에 7개까지만 존재 가능)
    this.playerMonstersOnField = 0;
    this.maxPlayerMonsters = 7;

    // AI 배틀필드 몬스터 수 추적
    this.aiMonstersOnField = 0;
    this.maxAiMonsters = 7;
  }

  generatePlayerDeck() {
    // AI와 동일한 등급 사용 (난이도별 사용 가능한 모든 등급)
    const gradeOrder = this.aiConfig.availableGrades;
    const types = ["attacker", "defender", "speeder"];
    const deck = [];

    // 등급별 2장씩 생성, 등급 순서대로 정렬
    gradeOrder.forEach((grade) => {
      for (let i = 0; i < 2; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        deck.push({ grade, type });
      }
    });

    return deck;
  }

  createBackground(width, height) {
    // 게임 필드 배경 (상단)
    this.add
      .rectangle(
        width / 2,
        this.GAME_FIELD_HEIGHT / 2,
        width,
        this.GAME_FIELD_HEIGHT,
        COLORS.BACKGROUND,
      )
      .setDepth(DEPTH.BACKGROUND);

    // 바닥 (게임 필드 하단)
    this.add
      .rectangle(
        width / 2,
        this.GROUND_Y + this.GROUND_HEIGHT / 2,
        width,
        this.GROUND_HEIGHT,
        COLORS.GROUND,
      )
      .setDepth(DEPTH.GROUND);

    // 카드 UI 패널 배경 (하단)
    this.add
      .rectangle(
        width / 2,
        this.GAME_FIELD_HEIGHT + this.UI_PANEL_HEIGHT / 2,
        width,
        this.UI_PANEL_HEIGHT,
        0x0d0d1a,
      )
      .setDepth(DEPTH.UI - 1);

    // 패널 상단 구분선
    this.add
      .rectangle(width / 2, this.GAME_FIELD_HEIGHT, width, 3, 0x444466)
      .setDepth(DEPTH.UI);
  }

  createCastles(width, height) {
    // 성은 게임 필드 바닥에 배치
    const castleY = this.GROUND_Y - CASTLE.HEIGHT;

    // 플레이어 성 (왼쪽)
    this.playerCastle = new Castle(this, 60, castleY, "player");
    this.add.existing(this.playerCastle);

    // AI 성 (오른쪽)
    this.aiCastle = new Castle(this, width - 60 - CASTLE.WIDTH, castleY, "ai");
    this.add.existing(this.aiCastle);
  }

  createGroups() {
    // 몬스터 그룹 (물리 적용)
    this.playerMonsters = this.physics.add.group({
      classType: Monster,
      runChildUpdate: true,
    });

    this.aiMonsters = this.physics.add.group({
      classType: Monster,
      runChildUpdate: true,
    });

    // 투사체 그룹
    this.projectiles = this.physics.add.group({
      runChildUpdate: true,
    });
  }

  createUI(width, height) {
    // 반응형 패딩 및 폰트 크기
    const padding = Math.max(10, Math.min(20, width * 0.015));
    const baseFontSize = Math.max(16, Math.min(24, width * 0.019));
    const timerFontSize = Math.max(20, Math.min(32, width * 0.025));

    const fontStyle = {
      fontSize: `${baseFontSize}px`,
      fontFamily: "Arial",
      color: "#ffffff",
    };

    // 플레이어 HP
    this.playerHpText = this.add
      .text(padding, padding, `HP: ${this.playerCastle.hp}`, fontStyle)
      .setDepth(DEPTH.UI);

    // 플레이어 에너지
    this.energyText = this.add
      .text(
        padding,
        padding + baseFontSize + 10,
        `⚡ ${Math.floor(this.playerEnergy)}`,
        fontStyle,
      )
      .setDepth(DEPTH.UI);

    // 배틀필드 몬스터 수 (플레이어)
    this.monsterCountText = this.add
      .text(
        padding,
        padding + (baseFontSize + 10) * 2,
        `👾 ${this.playerMonstersOnField}/${this.maxPlayerMonsters}`,
        {
          fontSize: `${baseFontSize}px`,
          fontFamily: "Arial",
          color: "#00ff88",
        },
      )
      .setDepth(DEPTH.UI);

    // 타이머 (중앙)
    this.timerText = this.add
      .text(width / 2, padding, this.formatTime(this.remainingTime), {
        fontSize: `${timerFontSize}px`,
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.UI);

    // AI HP
    this.aiHpText = this.add
      .text(width - padding, padding, `HP: ${this.aiCastle.hp}`, fontStyle)
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI);
  }

  createDeckUI(width, height) {
    // 카드 UI는 하단 패널 중앙에 배치
    const deckY = this.GAME_FIELD_HEIGHT + this.UI_PANEL_HEIGHT / 2;

    // 반응형 카드 크기 계산 (모바일 터치 영역 고려)
    const cardWidth = Math.max(60, Math.min(80, width * 0.055));
    const cardHeight = Math.max(80, Math.min(100, cardWidth * 1.3));
    const gap = Math.max(5, Math.min(15, width * 0.008));

    const totalWidth = this.playerDeck.length * (cardWidth + gap) - gap;
    const startX = (width - totalWidth) / 2;

    // 반응형 폰트 크기
    const gradeFontSize = Math.max(8, Math.min(12, cardWidth * 0.15));
    const emojiFontSize = Math.max(20, Math.min(32, cardWidth * 0.4));
    const costFontSize = Math.max(12, Math.min(18, cardWidth * 0.23));

    this.deckButtons = [];

    const gradeEmojis = {
      common: "👻",
      rare: "👽",
      epic: "🤖",
      super_epic: "⚔️",
      mystic: "🔮",
      legendary: "🐲",
      hero: "👑",
    };

    const typeSymbols = {
      attacker: "⚔️",
      defender: "🛡️",
      speeder: "⚡",
    };

    // 등급 색상 정의
    const gradeColors = {
      common: "#9e9e9e",
      rare: "#4fc3f7",
      epic: "#9c27b0",
      super_epic: "#ff1493",
      mystic: "#00ced1",
      legendary: "#ffd700",
      hero: "#ff4500",
    };

    this.playerDeck.forEach((slot, index) => {
      const x = startX + index * (cardWidth + gap) + cardWidth / 2;
      const cost = getMonsterCost(slot.grade);

      // 카드 배경 (팀 색상 테마)
      const card = this.add
        .rectangle(x, deckY, cardWidth, cardHeight, 0x2a3a5a)
        .setStrokeStyle(2, 0x00ddff)
        .setInteractive({ useHandCursor: true })
        .setDepth(DEPTH.UI);

      // 등급 텍스트 (상단)
      const gradeText = this.add
        .text(x, deckY - cardHeight * 0.38, slot.grade.toUpperCase(), {
          fontSize: `${gradeFontSize}px`,
          fontFamily: "Arial",
          color: gradeColors[slot.grade] || "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.UI);

      // 이모지 (중앙)
      const emoji = this.add
        .text(x, deckY - cardHeight * 0.05, gradeEmojis[slot.grade] || "❓", {
          fontSize: `${emojiFontSize}px`,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.UI);

      // 타입 심볼 (중앙 아래)
      const typeSymbol = this.add
        .text(x, deckY + cardHeight * 0.08, typeSymbols[slot.type] || "❓", {
          fontSize: `${costFontSize * 0.8}px`,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.UI);

      // 비용 (하단)
      const costText = this.add
        .text(x, deckY + cardHeight * 0.32, `${cost}⚡`, {
          fontSize: `${costFontSize}px`,
          fontFamily: "Arial",
          color: "#88DDFF",
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.UI);

      // 재소환 대기시간 표시
      const cooldownOverlay = this.add
        .rectangle(x, deckY, cardWidth, cardHeight, 0x000000)
        .setAlpha(0)
        .setDepth(DEPTH.UI + 1);

      const cooldownText = this.add
        .text(x, deckY, "", {
          fontSize: `${Math.max(18, Math.min(28, cardWidth * 0.35))}px`,
          fontFamily: "Arial",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(DEPTH.UI + 2);

      // 클릭 이벤트
      card.on("pointerdown", () => {
        console.log(
          `[createDeckUI] 카드 클릭: 슬롯 ${index}, 등급: ${slot.grade}, 타입: ${slot.type}`,
        );
        this.spawnPlayerMonster(index);
      });

      // 호버 효과 강화
      card.on("pointerover", () => {
        card.setFillStyle(0x3a4a7a);
        card.setStrokeStyle(3, 0x00ffff);
      });
      card.on("pointerout", () => {
        card.setFillStyle(0x2a3a5a);
        card.setStrokeStyle(2, 0x00ddff);
      });

      this.deckButtons.push({
        card,
        gradeText,
        emoji,
        typeSymbol,
        costText,
        cooldownOverlay,
        cooldownText,
        slot,
      });
    });
  }

  setupTimers() {
    // 1초마다 타이머 업데이트
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // 에너지 재생 (100ms마다)
    this.time.addEvent({
      delay: 100,
      callback: this.updateEnergy,
      callbackScope: this,
      loop: true,
    });

    // AI 자동 소환
    this.time.addEvent({
      delay: this.aiConfig.spawnCooldown,
      callback: this.spawnAIMonster,
      callbackScope: this,
      loop: true,
    });

    // 성 크리스탈 공격
    this.time.addEvent({
      delay: CASTLE.ATTACK_COOLDOWN,
      callback: this.castleAttacks,
      callbackScope: this,
      loop: true,
    });
  }

  setupCollisions() {
    // 플레이어 몬스터 vs AI 몬스터
    this.physics.add.overlap(
      this.playerMonsters,
      this.aiMonsters,
      this.onMonsterCollision,
      null,
      this,
    );
  }

  update(time, delta) {
    if (this.gameOver) return;

    // UI 업데이트
    this.updateUI();

    // 덱 UI 업데이트 (비용 체크)
    this.updateDeckUI();

    // 승리 조건 체크
    this.checkWinCondition();
  }

  updateTimer() {
    if (this.gameOver) return;

    this.remainingTime--;

    if (this.remainingTime <= 0) {
      // 시간 종료: HP 비교로 승자 결정
      const playerHp = Math.max(0, this.playerCastle.hp);
      const aiHp = Math.max(0, this.aiCastle.hp);

      let winner;
      if (playerHp > aiHp) {
        winner = "player";
      } else if (aiHp > playerHp) {
        winner = "ai";
      } else {
        winner = "draw";
      }

      console.log(
        `시간 종료! 플레이어 HP: ${playerHp}, AI HP: ${aiHp} → 승자: ${winner}`,
      );
      this.endGame(winner);
    }
  }

  updateEnergy() {
    if (this.gameOver) return;

    const isBoostTime = this.remainingTime <= ENERGY.BOOST_TIME;
    const rate = isBoostTime ? ENERGY.BOOST_RATE : ENERGY.REGEN_RATE;

    // 0.1초마다 호출되므로 rate / 10
    this.playerEnergy = Math.min(this.playerEnergy + rate / 10, this.maxEnergy);
    this.aiEnergy = Math.min(
      this.aiEnergy + (rate * (this.aiConfig.energyRegenMultiplier || 1)) / 10,
      this.maxEnergy,
    );
  }

  updateUI() {
    this.playerHpText.setText(`HP: ${Math.max(0, this.playerCastle.hp)}`);
    this.aiHpText.setText(`HP: ${Math.max(0, this.aiCastle.hp)}`);
    this.energyText.setText(`⚡ ${Math.floor(this.playerEnergy)}`);
    this.monsterCountText.setText(
      `👾 ${this.playerMonstersOnField}/${this.maxPlayerMonsters}`,
    );
    this.timerText.setText(this.formatTime(this.remainingTime));

    // 몬스터 수에 따라 색상 변경
    if (this.playerMonstersOnField >= this.maxPlayerMonsters) {
      this.monsterCountText.setColor("#ff4444"); // 빨강 (가득 참)
    } else if (this.playerMonstersOnField >= this.maxPlayerMonsters - 2) {
      this.monsterCountText.setColor("#ffaa00"); // 주황 (거의 가득)
    } else {
      this.monsterCountText.setColor("#00ff88"); // 초록 (여유 있음)
    }

    // 부스트 타임에 타이머 색상 변경
    if (this.remainingTime <= ENERGY.BOOST_TIME) {
      this.timerText.setColor("#ff6600");
    }
  }

  updateDeckUI() {
    const now = this.time.now;

    this.deckButtons.forEach(
      (
        {
          card,
          gradeText,
          emoji,
          typeSymbol,
          costText,
          cooldownOverlay,
          cooldownText,
          slot,
        },
        index,
      ) => {
        const cost = getMonsterCost(slot.grade);
        const affordable = this.playerEnergy >= cost;
        const canSpawn = this.playerMonstersOnField < this.maxPlayerMonsters;
        const remainingCooldown = Math.max(
          0,
          this.deckCooldownUntil[index] - now,
        );
        const cooldownReady = remainingCooldown <= 0;

        // 비용 부족 또는 배틀필드 가득 찰을 때 투명도 감소
        const alpha = affordable && canSpawn && cooldownReady ? 1 : 0.5;
        card.setAlpha(alpha);
        if (gradeText) gradeText.setAlpha(alpha);
        if (emoji) emoji.setAlpha(alpha);
        if (typeSymbol) typeSymbol.setAlpha(alpha);
        if (costText) costText.setAlpha(alpha);

        if (cooldownReady) {
          cooldownOverlay.setAlpha(0);
          cooldownText.setAlpha(0);
          cooldownText.setText("");
        } else {
          cooldownOverlay.setAlpha(0.55);
          cooldownText.setAlpha(1);
          cooldownText.setText(`${Math.ceil(remainingCooldown / 1000)}s`);
        }
      },
    );
  }

  formatTime(seconds) {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  spawnPlayerMonster(slotIndex) {
    console.log(`[spawnPlayerMonster] 호출됨: slotIndex=${slotIndex}`);

    if (this.gameOver) {
      console.log(`[spawnPlayerMonster] 게임 오버 - 스킵`);
      return;
    }

    const slot = this.playerDeck[slotIndex];
    if (!slot) {
      console.log(`[spawnPlayerMonster] 슬롯이 없음: ${slotIndex}`);
      return;
    }

    console.log(`[spawnPlayerMonster] 슬롯 찾음: ${slot.grade} ${slot.type}`);

    const now = this.time.now;
    const remainingCooldown = Math.max(
      0,
      this.deckCooldownUntil[slotIndex] - now,
    );
    if (remainingCooldown > 0) {
      console.log(
        `[spawnPlayerMonster] 재소환 대기 중: ${Math.ceil(remainingCooldown / 1000)}초 남음`,
      );
      return;
    }

    // 배틀필드 몬스터 수 확인 (요구사항: 동시에 7개까지만 존재 가능)
    if (this.playerMonstersOnField >= this.maxPlayerMonsters) {
      console.log(
        `[spawnPlayerMonster] 배틀필드 가득! (${this.playerMonstersOnField}/${this.maxPlayerMonsters})`,
      );
      return;
    }

    const cost = getMonsterCost(slot.grade);
    console.log(
      `[spawnPlayerMonster] 비용: ${cost}, 현재 에너지: ${this.playerEnergy}`,
    );

    if (this.playerEnergy < cost) {
      console.log(
        `[spawnPlayerMonster] 에너지 부족! (${this.playerEnergy} < ${cost})`,
      );
      return;
    }

    this.playerEnergy -= cost;
    this.playerMonstersOnField++;
    this.deckCooldownUntil[slotIndex] =
      now + getMonsterRespawnCooldown(slot.grade);

    // 몬스터는 게임 필드 바닥에 소환 (몬스터 높이의 절반만큼 위로)
    const x = this.playerCastle.x + CASTLE.WIDTH + 20;
    const monsterHeight = calculateMonsterStats(slot.grade, slot.type).height;
    const y = this.GROUND_Y - monsterHeight / 2;

    console.log(
      `[spawnPlayerMonster] 위치 계산: x=${x}, y=${y}, monsterHeight=${monsterHeight}`,
    );

    const monster = new Monster(this, x, y, "player", slot.grade, slot.type);
    console.log(`[spawnPlayerMonster] Monster 인스턴스 생성 완료`);

    this.playerMonsters.add(monster);
    console.log(`[spawnPlayerMonster] 그룹에 추가 완료`);

    this.add.existing(monster);
    console.log(`[spawnPlayerMonster] 씬에 추가 완료`);

    console.log(
      `플레이어 몬스터 소환: ${slot.grade} ${slot.type} at (${x}, ${y}) (필드: ${this.playerMonstersOnField}/${this.maxPlayerMonsters})`,
    );
  }

  onMonsterDeath(team) {
    // 몬스터 사망 시 배틀필드 카운트 감소
    if (team === "player") {
      const before = this.playerMonstersOnField;
      this.playerMonstersOnField = Math.max(0, this.playerMonstersOnField - 1);
      console.log(
        `[GameScene] 플레이어 몬스터 사망 - 필드: ${before} → ${this.playerMonstersOnField} (최대: ${this.maxPlayerMonsters})`,
      );
    } else if (team === "ai") {
      const before = this.aiMonstersOnField;
      this.aiMonstersOnField = Math.max(0, this.aiMonstersOnField - 1);
      console.log(
        `[GameScene] AI 몬스터 사망 - 필드: ${before} → ${this.aiMonstersOnField} (최대: ${this.maxAiMonsters})`,
      );
    }
  }

  spawnAIMonster() {
    if (this.gameOver) return;

    // 배틀필드 몬스터 수 제한 체크
    if (this.aiMonstersOnField >= this.maxAiMonsters) {
      console.log(`AI 배틀필드 가득! (${this.maxAiMonsters}개) - 소환 스킵`);
      return;
    }

    const availableGrades = this.aiConfig.availableGrades;

    // 비용 지불 가능한 등급 필터
    const affordable = availableGrades.filter((grade) => {
      return this.aiEnergy >= getMonsterCost(grade);
    });

    if (affordable.length === 0) return;

    // 랜덤 등급 선택
    const grade = affordable[Math.floor(Math.random() * affordable.length)];

    // AI 전략: 등급에 따라 타입 선택
    // - common/rare: 공격형 주력 (70% 확률)
    // - epic: 방어형으로 탱킹 (50% 확률)
    // - legend: 빠른 타입으로 스피드 플레이
    let type;
    if (grade === "legend") {
      type = "speeder";
    } else if (grade === "epic") {
      type = Math.random() > 0.5 ? "defender" : "attacker";
    } else {
      type = Math.random() > 0.3 ? "attacker" : "defender";
    }

    const cost = getMonsterCost(grade);
    this.aiEnergy -= cost;
    this.aiMonstersOnField++;

    // AI 몬스터도 게임 필드 바닥에 소환 (몬스터 높이의 절반만큼 위로)
    const x = this.aiCastle.x - 20;
    const monsterHeight = calculateMonsterStats(grade, type).height;
    const y = this.GROUND_Y - monsterHeight / 2;

    const monster = new Monster(this, x, y, "ai", grade, type);
    monster.attackDamage = Math.floor(
      monster.attackDamage * (this.aiConfig.monsterDamageMultiplier || 1),
    );
    this.aiMonsters.add(monster);
    this.add.existing(monster);

    console.log(
      `AI 몬스터 소환: ${grade} ${type} at (${x}, ${y}) (필드: ${this.aiMonstersOnField}/${this.maxAiMonsters})`,
    );
  }

  castleAttacks() {
    if (this.gameOver) return;

    // 플레이어 성 → AI 몬스터 공격
    this.castleAttack(this.playerCastle, this.aiMonsters);

    // AI 성 → 플레이어 몬스터 공격
    this.castleAttack(this.aiCastle, this.playerMonsters);
  }

  castleAttack(castle, enemies) {
    if (castle.hp <= 0) return;

    const children = enemies.getChildren();
    if (children.length === 0) return;

    // 가장 가까운 적 찾기
    let closest = null;
    let closestDist = CASTLE.ATTACK_RANGE;

    children.forEach((enemy) => {
      if (enemy.hp <= 0) return;

      const dist = Math.abs(enemy.x - castle.x);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    });

    if (closest) {
      const hit = this.rollCriticalDamage(CASTLE.ATTACK_DAMAGE);
      // 투사체 발사 위치 (성 상단 중앙)
      const startX = castle.x + castle.width / 2;
      const startY = castle.y - 10;

      // 타격 위치 (적 중앙)
      const targetX = closest.x;
      const targetY = closest.y - closest.height / 2;

      // 투사체 생성
      const projectile = new Projectile(
        this,
        startX,
        startY,
        targetX,
        targetY,
        castle.team,
        hit.damage,
      );
      this.add.existing(projectile);
      this.projectiles.add(projectile);

      // 데미지는 투사체 도달 시 적용 (지연 시간 계산)
      const dist = Math.sqrt(
        Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2),
      );
      const travelTime = (dist / 350) * 1000 + projectile.chargeDuration; // 350 = projectile speed

      this.time.delayedCall(travelTime, () => {
        if (closest && closest.hp > 0 && closest.state !== "dead") {
          console.log(
            `[Castle] ${castle.team} 크리스탈이 ${closest.team} 몬스터 공격 (HP: ${closest.hp})`,
          );
          closest.takeDamage(hit.damage, {
            sourceX: startX,
            sourceY: startY,
            criticalType: hit.type,
          });
        }
      });

      console.log(`${castle.team} 성이 크리스탈 발사!`);
    }
  }

  rollCriticalDamage(baseDamage) {
    const hit = {
      damage: baseDamage,
      type: null,
    };

    const roll = Math.random();
    if (roll < CRITICAL.SUPER_CHANCE) {
      hit.damage = baseDamage * CRITICAL.SUPER_MULTIPLIER;
      hit.type = "super";
    } else if (roll < CRITICAL.SUPER_CHANCE + CRITICAL.CHANCE) {
      hit.damage = baseDamage * CRITICAL.MULTIPLIER;
      hit.type = "critical";
    }

    return hit;
  }

  onMonsterCollision(playerMonster, aiMonster) {
    // 서로 공격
    playerMonster.attackTarget(aiMonster);
    aiMonster.attackTarget(playerMonster);
  }

  checkWinCondition() {
    if (this.aiCastle.hp <= 0) {
      this.endGame("player");
    } else if (this.playerCastle.hp <= 0) {
      this.endGame("ai");
    }
  }

  endGame(winner) {
    if (this.gameOver) return;

    this.gameOver = true;
    this.winner = winner;

    console.log(`게임 종료: ${winner} 승리!`);

    // 잠시 후 GameOverScene으로 전환
    this.time.delayedCall(1000, () => {
      this.scene.start("GameOverScene", {
        winner: this.winner,
        playerHp: Math.max(0, this.playerCastle.hp),
        aiHp: Math.max(0, this.aiCastle.hp),
        timeRemaining: this.remainingTime,
      });
    });
  }
}
