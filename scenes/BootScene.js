/**
 * BootScene - 리소스 로딩 씬
 * 게임 시작 전 필요한 에셋을 로드합니다.
 */
import dragonImage from '../docs/images/dragon-motion-sprites.png';
import commonImage from '../docs/images/common.png';
import golemWalkImage from '../docs/images/nature-golem-walk-8.png';
import golemAttackImage from '../docs/images/nature-golem-attack-4.png';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 로딩 화면 표시
        this.createLoadingScreen();
        this.load.spritesheet('legendary-dragon', dragonImage, { frameWidth: 362, frameHeight: 362 });
        this.load.image('common-source', commonImage);
        this.load.spritesheet('epic-golem-walk', golemWalkImage, { frameWidth: 443, frameHeight: 443 });
        this.load.spritesheet('epic-golem-attack', golemAttackImage, { frameWidth: 543, frameHeight: 724 });

        // 현재는 에셋 없이 시작 (나중에 추가)
        // this.load.image('castle', 'assets/images/castle.png');
        // this.load.audio('bgm', 'assets/audio/bgm.mp3');
    }

    create() {
        const source = this.textures.get('common-source').getSourceImage();
        const texture = this.textures.createCanvas('common-motion', source.width, source.height);
        const context = texture.getContext();
        context.drawImage(source, 0, 0);
        const pixels = context.getImageData(0, 0, source.width, source.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
            if (pixels.data[i] > 200 && pixels.data[i + 1] > 200 && pixels.data[i + 2] > 200) pixels.data[i + 3] = 0;
        }
        context.putImageData(pixels, 0, 0);
        for (let frame = 0; frame < 12; frame++) {
            texture.add(frame, 0, (frame % 4) * 362, Math.floor(frame / 4) * 362, 362, 362);
        }
        texture.refresh();
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get('legendary-dragon').setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get('epic-golem-walk').setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get('epic-golem-attack').setFilter(Phaser.Textures.FilterMode.NEAREST);
        console.log('BootScene: 리소스 로딩 완료');

        // 메뉴 씬으로 전환
        this.scene.start('MenuScene');
    }

    createLoadingScreen() {
        const { width, height } = this.scale;

        // 로딩 텍스트
        const loadingText = this.add.text(width / 2, height / 2 - 50, '🏰 Castle Defense', {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        });
        loadingText.setOrigin(0.5);

        // 로딩 바 배경
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);

        // 로딩 바
        const progressBar = this.add.graphics();

        // 로딩 진행률 표시
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x4caf50, 1);
            progressBar.fillRect(width / 2 - 155, height / 2 + 5, 310 * value, 20);
        });

        // 로딩 완료
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }
}
