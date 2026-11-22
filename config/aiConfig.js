/**
 * AI 난이도별 설정
 */
export const AI_CONFIG = {
    easy: {
        name: '초급',
        spawnCooldown: 5200, // ms, 기존 4000ms에서 30% 증가
        availableGrades: ['common', 'rare', 'epic', 'super_epic'],
        decisionDelay: 500,  // AI 반응 속도
        maxEnergy: 30,  // 에너지 최대값
        monsterDamageMultiplier: 0.9,
        energyRegenMultiplier: 0.7
    },
    normal: {
        name: '중급',
        spawnCooldown: 3000,
        availableGrades: ['common', 'rare', 'epic', 'super_epic', 'mystic', 'legendary'],
        decisionDelay: 300,
        maxEnergy: 40,
        energyRegenMultiplier: 0.8
    },
    hard: {
        name: '고급',
        spawnCooldown: 2500,
        availableGrades: ['common', 'rare', 'epic', 'super_epic', 'mystic', 'legendary', 'hero'],
        decisionDelay: 100,
        maxEnergy: 50,
        energyRegenMultiplier: 1.2
    }
};

/**
 * 플레이어 기본 덱 구성
 */
export const PLAYER_DECK = [
    { grade: 'common', type: 'attacker' },
    { grade: 'common', type: 'defender' },
    { grade: 'rare', type: 'attacker' },
    { grade: 'rare', type: 'speeder' },
    { grade: 'epic', type: 'attacker' },
    { grade: 'epic', type: 'defender' },
    { grade: 'legend', type: 'attacker' }
];
