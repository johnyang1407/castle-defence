/**
 * BootScene - 리소스 로딩 씬
 * 게임 시작 전 필요한 에셋을 로드합니다.
 */
import dragonImage from '../docs/images/dragon-motion-sprites.png';
import commonImage from '../docs/images/common.png';
import golemWalkImage from '../docs/images/nature-golem-walk-8.png';
import golemAttackImage from '../docs/images/nature-golem-attack-4.png';
import knightRunImage from '../docs/images/super-epic-run.png';
import knightAttackImage from '../docs/images/super-epic-attack.png';
import alienImage from '../docs/images/rare-alien.png';

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
        this.load.image('super-epic-run-source', knightRunImage);
        this.load.image('super-epic-attack-source', knightAttackImage);
        this.load.image('rare-alien-source', alienImage);

        // 현재는 에셋 없이 시작 (나중에 추가)
        // this.load.image('castle', 'assets/images/castle.png');
        // this.load.audio('bgm', 'assets/audio/bgm.mp3');
    }

    create() {
        this.createCharacterTexture();
        this.createCharacterTexture(true);
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

    createCharacterTexture(alien = false) {
        const texture = this.textures.createCanvas(alien ? 'rare-alien-motion' : 'super-epic-motion', 384 * 12, 400);
        const context = texture.getContext();
        const run = this.textures.get(alien ? 'rare-alien-source' : 'super-epic-run-source').getSourceImage();
        const attack = this.textures.get(alien ? 'rare-alien-source' : 'super-epic-attack-source').getSourceImage();
        for (let frame = 0; frame < 12; frame++) {
            const scratch = document.createElement('canvas');
            scratch.width = 384;
            scratch.height = 400;
            const ctx = scratch.getContext('2d');
            if (alien && frame < 8) {
                const edges = [0, 210, 397, 577, 766, 954, 1142, 1324, 1536];
                const width = edges[frame + 1] - edges[frame];
                ctx.drawImage(run, edges[frame], 120, width, 315,
                    (384 - width * 0.8) / 2, 108, width * 0.8, 252);
            } else if (alien) {
                const bounds = [[0, 384], [384, 336], [720, 480], [1200, 336]][frame - 8];
                ctx.drawImage(attack, bounds[0], 590, bounds[1], 344,
                    frame === 10 ? 24 : 75, 102, bounds[1] * 0.75, 258);
            } else if (frame < 8) {
                ctx.drawImage(run, (frame % 4) * 384, frame < 4 ? 85 : 575, 384, 365, 0, 10, 384, 365);
                // The fourth label extends into the left edge of its cell.
                ctx.clearRect(0, 10, frame === 3 ? 123 : 140, 42);
            } else {
                ctx.drawImage(attack, (frame - 8) * 443.5, 190, 443.5, 480, 0, 0, 384, 400);
            }
            // Remove only background connected to the frame edge, retaining enclosed white details.
            const pixels = ctx.getImageData(0, 0, 384, 400);
            const data = pixels.data;
            const queue = new Int32Array(384 * 400);
            const visited = new Uint8Array(384 * 400);
            let head = 0, tail = 0;
            const enqueue = (index) => {
                if (visited[index]) return;
                visited[index] = 1;
                const p = index * 4;
                if (data[p + 3] === 0 || (data[p] >= 240 && data[p + 1] >= 240 && data[p + 2] >= 240)) queue[tail++] = index;
            };
            for (let x = 0; x < 384; x++) { enqueue(x); enqueue(399 * 384 + x); }
            for (let y = 0; y < 400; y++) { enqueue(y * 384); enqueue(y * 384 + 383); }
            while (head < tail) {
                const index = queue[head++], x = index % 384, y = Math.floor(index / 384);
                data[index * 4 + 3] = 0;
                if (x > 0) enqueue(index - 1);
                if (x < 383) enqueue(index + 1);
                if (y > 0) enqueue(index - 384);
                if (y < 399) enqueue(index + 384);
            }
            ctx.putImageData(pixels, 0, 0);
            context.drawImage(scratch, frame * 384, 0);
            texture.add(frame, 0, frame * 384, 0, 384, 400);
        }
        texture.refresh();
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
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
