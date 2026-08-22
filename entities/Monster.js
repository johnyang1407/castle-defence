import { DEPTH } from '../config/constants.js';
import { calculateMonsterStats } from '../config/monsterData.js';

export default class Monster extends Phaser.GameObjects.Container {
    constructor(scene, x, y, team, grade = 'common', type = 'attacker') {
        super(scene, x, y);

        this.scene = scene;
        this.team = team;
        this.grade = grade;
        this.type = type;

        const stats = calculateMonsterStats(grade, type);
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;
        this.attackDamage = stats.attackDamage;
        this.attackRange = stats.attackRange;
        this.attackCooldown = stats.attackCooldown;
        this.width = stats.width;
        this.height = stats.height;
        this.color = stats.color;

        this.state = 'moving';
        this.canAttack = true;
        this.target = null;

        this.createVisuals();
        this.setDepth(DEPTH.MONSTER);

        scene.physics.world.enable(this);
        this.body.setSize(this.width, this.height);
    }

    createVisuals() {
        const teamColor = this.team === 'player' ? 0x3388ff : 0xff4444;
        const borderColor = this.team === 'player' ? 0x00ddff : 0xff6600;
        const glowColor = this.team === 'player' ? 0x88ddff : 0xff9944;

        this.createMonsterShape(teamColor, borderColor, glowColor);
        this.createGradeIndicator(glowColor);

        this.hpBarBg = this.scene.add.rectangle(0, -this.height - 8, this.width, 6, 0x333333);
        this.add(this.hpBarBg);

        this.hpBar = this.scene.add.rectangle(0, -this.height - 8, this.width, 6, 0x00ff00);
        this.add(this.hpBar);

        const teamIcon = this.team === 'player' ? 'P' : 'A';
        this.gradeText = this.scene.add.text(0, -this.height - 18, `${teamIcon}${this.grade[0].toUpperCase()}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(this.gradeText);
    }

    createMonsterShape(teamColor, borderColor, glowColor) {
        if (this.type === 'attacker') {
            this.createAttackerShape(teamColor, borderColor);
        } else if (this.type === 'defender') {
            this.createDefenderShape(teamColor, borderColor);
        } else {
            this.createSpeederShape(teamColor, borderColor);
        }

        const glowStrength = this.getGlowStrength();
        if (glowStrength > 0) {
            this.createGlowEffect();
        }
    }

    createAttackerShape(teamColor, borderColor) {
        const bodyCenterY = this.height * 0.15;
        const bodyWidth = this.width * 0.8;
        const bodyHeight = this.height * 0.7;
        const peakWidth = this.width * 0.3;
        const peakHeight = this.height * 0.4;
        const peakColor = this.team === 'player' ? 0x5aacff : 0xff7777;

        this.bodyRect = this.scene.add.rectangle(0, bodyCenterY, bodyWidth, bodyHeight, teamColor);
        this.add(this.bodyRect);

        this.peak1 = this.scene.add.rectangle(
            -this.width * 0.2,
            bodyCenterY - this.height * 0.5,
            peakWidth,
            peakHeight,
            peakColor
        );
        this.add(this.peak1);

        this.peak2 = this.scene.add.rectangle(
            this.width * 0.2,
            bodyCenterY - this.height * 0.5,
            peakWidth,
            peakHeight,
            peakColor
        );
        this.add(this.peak2);

        this.border = this.scene.add.rectangle(0, bodyCenterY, bodyWidth, bodyHeight)
            .setStrokeStyle(2, borderColor)
            .setFillStyle();
        this.add(this.border);
    }

    createDefenderShape(teamColor, borderColor) {
        const centerRadius = this.width * 0.35;
        const circleCenterY = this.height * 0.05;
        const shieldCenterY = this.height * 0.25;
        const shieldColor = this.team === 'player' ? 0x2266bb : 0xdd3333;

        this.bodyCircle = this.scene.add.circle(0, circleCenterY, centerRadius, teamColor);
        this.add(this.bodyCircle);

        this.shield = this.scene.add.rectangle(0, shieldCenterY, this.width * 0.7, this.height * 0.5, shieldColor);
        this.add(this.shield);

        this.border = this.scene.add.circle(0, circleCenterY, centerRadius)
            .setStrokeStyle(3, borderColor)
            .setFillStyle();
        this.add(this.border);

        this.shieldBorder = this.scene.add.rectangle(0, shieldCenterY, this.width * 0.7, this.height * 0.5)
            .setStrokeStyle(3, borderColor)
            .setFillStyle();
        this.add(this.shieldBorder);
    }

    createSpeederShape(teamColor, borderColor) {
        const bodyCenterY = this.height * 0.15;
        const points = [
            new Phaser.Geom.Point(0, -this.height * 0.35),
            new Phaser.Geom.Point(this.width * 0.35, 0),
            new Phaser.Geom.Point(0, this.height * 0.35),
            new Phaser.Geom.Point(-this.width * 0.35, 0)
        ];

        this.bodyDiamond = this.scene.add.polygon(0, bodyCenterY, points, teamColor);
        this.add(this.bodyDiamond);

        const lineColor = this.team === 'player' ? 0x88ddff : 0xff9944;
        this.speedLine1 = this.scene.add.rectangle(-this.width * 0.4, bodyCenterY - this.height * 0.15, this.width * 0.3, 2, lineColor);
        this.add(this.speedLine1);

        this.speedLine2 = this.scene.add.rectangle(-this.width * 0.4, bodyCenterY + this.height * 0.15, this.width * 0.3, 2, lineColor);
        this.add(this.speedLine2);

        this.border = this.scene.add.polygon(0, bodyCenterY, points)
            .setStrokeStyle(2, borderColor)
            .setFillStyle();
        this.add(this.border);
    }

    createGradeIndicator(glowColor) {
        const gradeStars = {
            common: 1,
            rare: 2,
            epic: 3,
            legend: 4
        };

        const starCount = gradeStars[this.grade] || 1;
        const starSize = 4;
        const starGap = 6;
        const totalWidth = starCount * starSize + (starCount - 1) * starGap;
        const startX = -totalWidth / 2;

        for (let i = 0; i < starCount; i++) {
            const starX = startX + i * (starSize + starGap) + starSize / 2;
            const star = this.scene.add.star(starX, -this.height * 0.55, 5, starSize / 2, starSize / 2.5, glowColor)
                .setOrigin(0.5);
            this.add(star);
        }
    }

    getGlowStrength() {
        const glowMap = { common: 0.3, rare: 0.5, epic: 0.7, legend: 1.0 };
        return glowMap[this.grade] || 0.3;
    }

    createGlowEffect() {
        const duration = this.type === 'speeder' ? 300 : this.type === 'defender' ? 1000 : 500;

        this.glowTween = this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    preUpdate(time, delta) {
        if (this.state === 'dead') return;

        if (this.state === 'moving') {
            const direction = this.team === 'player' ? 1 : -1;
            this.x += this.speed * direction * (delta / 1000);
        }

        this.findAndAttackEnemies();

        if (this.target && this.state === 'attacking') {
            this.attackTarget(this.target);
        }
    }

    findAndAttackEnemies() {
        const enemyGroup = this.team === 'player' ? this.scene.aiMonsters : this.scene.playerMonsters;
        const enemyCastle = this.team === 'player' ? this.scene.aiCastle : this.scene.playerCastle;

        let target = null;
        let closestDist = this.attackRange;

        enemyGroup.getChildren().forEach((enemy) => {
            if (enemy.hp <= 0) return;

            const dist = Math.abs(enemy.x - this.x);
            if (dist < closestDist) {
                closestDist = dist;
                target = enemy;
            }
        });

        const castleDist = Math.abs(enemyCastle.x + enemyCastle.width / 2 - this.x);
        if (castleDist < closestDist) {
            target = enemyCastle;
        }

        if (target) {
            this.state = 'attacking';
            this.target = target;
        } else {
            this.state = 'moving';
            this.target = null;
        }
    }

    attackTarget(target) {
        if (!this.canAttack || this.state === 'dead') return;

        if (target && typeof target.takeDamage === 'function') {
            target.takeDamage(this.attackDamage);
        }

        this.canAttack = false;
        this.scene.time.delayedCall(this.attackCooldown, () => {
            this.canAttack = true;
        });
    }

    takeDamage(amount) {
        if (this.state === 'dead') return;

        this.showDamageText(amount);
        this.hp -= amount;

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }

        this.updateHpBar();
    }

    showDamageText(amount) {
        if (!this.scene || !this.scene.add || amount <= 0) return;

        const textColor = this.team === 'player' ? '#ff8844' : '#66ddff';
        const startX = this.x + Phaser.Math.Between(-10, 10);
        const startY = this.y - this.height * 0.75;
        const damageText = this.scene.add.text(startX, startY, `-${Math.round(amount)}`, {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: textColor,
            fontStyle: 'bold',
            stroke: '#1a1020',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI + 5);

        this.scene.tweens.add({
            targets: damageText,
            y: startY - 36,
            x: startX + Phaser.Math.Between(-8, 8),
            alpha: 0,
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 650,
            ease: 'Cubic.easeOut',
            onComplete: () => damageText.destroy()
        });
    }

    updateHpBar() {
        const ratio = this.hp / this.maxHp;
        this.hpBar.setDisplaySize(this.width * ratio, 6);
        this.hpBar.setX(-(this.width * (1 - ratio)) / 2);

        let color;
        if (ratio > 0.5) {
            color = 0x00ff00;
        } else if (ratio > 0.2) {
            color = 0xffff00;
        } else {
            color = 0xff0000;
        }
        this.hpBar.setFillStyle(color);
    }

    die() {
        this.state = 'dead';

        if (this.scene && typeof this.scene.onMonsterDeath === 'function') {
            this.scene.onMonsterDeath(this.team);
        }

        if (this.type === 'attacker') {
            this.scene.tweens.add({
                targets: this,
                scale: 1.2,
                alpha: 0,
                duration: 200,
                ease: 'Power2.out',
                onComplete: () => this.destroy()
            });
        } else if (this.type === 'defender') {
            this.scene.tweens.add({
                targets: this,
                scale: 0.8,
                alpha: 0,
                duration: 400,
                ease: 'Sine.inOut',
                onComplete: () => this.destroy()
            });
        } else {
            this.scene.tweens.add({
                targets: this,
                scale: 0.5,
                alpha: 0,
                duration: 150,
                ease: 'Power3.in',
                onComplete: () => this.destroy()
            });
        }
    }
}


