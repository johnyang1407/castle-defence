/**
 * 게임 상수 정의
 */
export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,
  MIN_WIDTH: 320,
  MIN_HEIGHT: 180,
};

export const CASTLE = {
  MAX_HP: 1000,
  ATTACK_RANGE: 500,
  ATTACK_DAMAGE: 20,
  ATTACK_COOLDOWN: 1500, // ms (Phaser 타이머는 ms 단위)
  WIDTH: 80,
  HEIGHT: 120,
};

export const CRITICAL = {
  CHANCE: 0.1,
  MULTIPLIER: 1.5,
  COLOR: "#9c27b0",
  SUPER_CHANCE: 0.05,
  SUPER_MULTIPLIER: 2,
  SUPER_COLOR: "#000000",
};

export const ENERGY = {
  INIT: 10,
  MAX: 100,
  REGEN_RATE: 1, // 초당
  BOOST_RATE: 2, // 마지막 30초
  BOOST_TIME: 30, // 부스트 시작 시간 (초)
};

export const TIMER = {
  TOTAL_TIME: 180, // 3분 (초)
};

export const COLORS = {
  PLAYER: 0x4a90d9,
  AI: 0xd94a4a,
  BACKGROUND: 0x9cff7a,
  GROUND: 0x2f9e44,
  PROJECTILE_PLAYER: 0x00bfff,
  PROJECTILE_AI: 0xff6600,
};

export const DEPTH = {
  BACKGROUND: 0,
  GROUND: 1,
  CASTLE: 10,
  MONSTER: 20,
  PROJECTILE: 30,
  UI: 100,
};
