import { CASTLE, COLORS, DEPTH } from '../config/constants.js';

/**
 * Castle 클래스 - Phaser.GameObjects.Container 기반
 */
export default class Castle extends Phaser.GameObjects.Container {
    constructor(scene, x, y, team) {
        super(scene, x, y);

        this.scene = scene;
        this.team = team;

        // 스탯
        this.hp = CASTLE.MAX_HP;
        this.maxHp = CASTLE.MAX_HP;

        // 크기
        this.width = CASTLE.WIDTH;
        this.height = CASTLE.HEIGHT;

        // 시각적 요소 생성
        this.createVisuals();

        // 깊이 설정
        this.setDepth(DEPTH.CASTLE);
    }

    createVisuals() {
        const color = this.team === 'player' ? COLORS.PLAYER : COLORS.AI;

        // 성 본체
        this.body = this.scene.add.rectangle(
            this.width / 2,
            this.height / 2,
            this.width,
            this.height,
            color
        );
        this.add(this.body);

        // 성벽 상단 장식 (톱니)
        const battlementCount = 4;
        const battlementWidth = this.width / (battlementCount * 2);
        const battlementHeight = 15;

        for (let i = 0; i < battlementCount; i++) {
            const bx = i * battlementWidth * 2 + battlementWidth / 2;
            const by = -battlementHeight / 2;
            const battlement = this.scene.add.rectangle(bx, by, battlementWidth, battlementHeight, color);
            this.add(battlement);
        }

        // 성문 (어두운 사각형으로 대체)
        const doorWidth = this.width * 0.4;
        const doorHeight = this.height * 0.4;
        const door = this.scene.add.rectangle(
            this.width / 2,
            this.height - doorHeight / 2,
            doorWidth,
            doorHeight,
            0x2d1b0e
        );
        this.add(door);

        // 체력 바 배경
        const hpBarWidth = this.width;
        const hpBarHeight = 8;
        this.hpBarBg = this.scene.add.rectangle(
            this.width / 2,
            -20,
            hpBarWidth,
            hpBarHeight,
            0x333333
        );
        this.add(this.hpBarBg);

        // 체력 바
        this.hpBar = this.scene.add.rectangle(
            this.width / 2,
            -20,
            hpBarWidth,
            hpBarHeight,
            0x4caf50
        );
        this.add(this.hpBar);

        // 팀 표시 테두리
        const borderColor = this.team === 'player' ? 0x2196f3 : 0xf44336;
        this.border = this.scene.add.rectangle(
            this.width / 2,
            this.height / 2,
            this.width,
            this.height
        ).setStrokeStyle(3, borderColor).setFillStyle();
        this.add(this.border);
    }

    takeDamage(amount, hitInfo = {}) {
        this.showDamageText(amount, hitInfo);
        this.hp -= amount;

        if (this.hp <= 0) {
            this.hp = 0;
        }

        this.updateHpBar();
        return this.hp <= 0;
    }

    showDamageText(amount, hitInfo = {}) {
        if (!this.scene || !this.scene.add || amount <= 0) return;

        this.scene.damageTextCount = (this.scene.damageTextCount || 0) + 1;
        const stackIndex = this.scene.damageTextCount % 5;
        const sourceDirection = hitInfo.sourceX === undefined
            ? Phaser.Math.Between(-1, 1)
            : Math.sign((this.x + this.width / 2) - hitInfo.sourceX) || Phaser.Math.Between(-1, 1);
        const sideOffset = sourceDirection * (18 + stackIndex * 8);
        const heightOffset = (stackIndex % 3) * 12;
        const textColor = this.team === 'player' ? '#ff8844' : '#66ddff';
        const startX = this.x + this.width / 2 + sideOffset + Phaser.Math.Between(-5, 5);
        const startY = this.y - 30 - heightOffset;
        const damageText = this.scene.add.text(startX, startY, `-${Math.round(amount)}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: textColor,
            fontStyle: 'bold',
            stroke: '#1a1020',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI + 5);

        this.scene.tweens.add({
            targets: damageText,
            y: startY - 42,
            x: startX + sourceDirection * 14,
            alpha: 0,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 700,
            ease: 'Cubic.easeOut',
            onComplete: () => damageText.destroy()
        });
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
        this.updateHpBar();
    }

    updateHpBar() {
        const ratio = this.hp / this.maxHp;
        const fullWidth = this.width;

        // 체력 바 폭 조절
        this.hpBar.setDisplaySize(fullWidth * ratio, 8);
        this.hpBar.setX(this.width / 2 - (fullWidth * (1 - ratio)) / 2);

        // 색상 변경
        let color;
        if (ratio > 0.5) {
            color = 0x4caf50; // 초록
        } else if (ratio > 0.25) {
            color = 0xff9800; // 주황
        } else {
            color = 0xf44336; // 빨강
        }
        this.hpBar.setFillStyle(color);
    }

    getHpRatio() {
        return this.hp / this.maxHp;
    }
}
