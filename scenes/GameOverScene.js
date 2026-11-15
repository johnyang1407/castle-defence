/**
 * GameOverScene - 게임 종료 화면
 */
export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        // GameScene에서 전달받은 데이터
        this.winner = data.winner || 'player';
        this.playerHp = data.playerHp || 0;
        this.aiHp = data.aiHp || 0;
        this.timeRemaining = data.timeRemaining || 0;
    }

    create() {
        const { width, height } = this.scale;

        // 반투명 배경
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

        // 반응형 폰트 크기
        const titleFontSize = Math.max(32, Math.min(64, width * 0.05));
        const statsFontSize = Math.max(16, Math.min(24, width * 0.019));

        // 결과 텍스트
        let resultText, resultColor;

        if (this.winner === 'player') {
            resultText = '🎉 VICTORY! 🎉';
            resultColor = '#4caf50';
        } else if (this.winner === 'ai') {
            resultText = '☠️ DEFEAT ☠️';
            resultColor = '#f44336';
        } else if (this.winner === 'draw') {
            resultText = '⏰ DRAW ⏰';
            resultColor = '#ff9800';
        } else {
            resultText = '⏰ TIME OUT ⏰';
            resultColor = '#ff9800';
        }

        const title = this.add.text(width / 2, height / 3, resultText, {
            fontSize: `${titleFontSize}px`,
            fontFamily: 'Arial, sans-serif',
            color: resultColor,
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // 통계 표시
        const stats = this.add.text(width / 2, height / 2,
            `플레이어 HP: ${this.playerHp}\nAI HP: ${this.aiHp}`, {
            fontSize: `${statsFontSize}px`,
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            align: 'center'
        });
        stats.setOrigin(0.5);

        // 재시작 버튼
        this.createRestartButton(width, height);
    }

    createRestartButton(width, height) {
        // 반응형 버튼 크기
        const buttonWidth = Math.max(180, Math.min(250, width * 0.2));
        const buttonHeight = Math.max(50, Math.min(70, height * 0.1));
        const fontSize = Math.max(20, Math.min(28, buttonHeight * 0.4));

        const x = width / 2;
        const y = height * 0.7;

        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x333333)
            .setStrokeStyle(3, 0x4caf50)
            .setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(x, y, '다시 시작', {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        });
        buttonText.setOrigin(0.5);

        button.on('pointerover', () => button.setFillStyle(0x4caf50));
        button.on('pointerout', () => button.setFillStyle(0x333333));

        button.on('pointerdown', () => button.setScale(0.95));
        button.on('pointerup', () => {
            button.setScale(1);
            this.scene.start('MenuScene');
        });
    }
}
