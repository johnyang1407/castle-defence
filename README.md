# Castle Defense

성을 지키는 전투 게임 프로젝트입니다.

플레이어는 몬스터를 소환해서 상대 성을 공격하고, 자기 성은 지켜야 합니다.

## 바로 해보기

게임 주소:

- `https://johnyang1407.github.io/castle-defence/`

## 이 프로젝트는 어떤 게임인가요?

- 왼쪽에는 플레이어 성이 있습니다.
- 오른쪽에는 AI 성이 있습니다.
- 몬스터를 소환해서 상대 성을 먼저 부수면 이깁니다.

## 로컬에서 실행하기

### 1. 프로젝트 받기

```bash
git clone https://github.com/gabrielwithappy/castle-depense.git
cd castle-depense
```

### 2. 로컬 서버 실행하기

```bash
python -m http.server 8080
```

### 3. 브라우저에서 열기

```text
http://localhost:8080
```

## 프로젝트 문서는 어디에 있나요?

모든 설명 문서는 `docs` 폴더에 있습니다.

- [문서 안내서](D:/01_PRJ/castle-depense/docs/README.md)
- [게임 설명](D:/01_PRJ/castle-depense/docs/game/game.md)
- [설계 설명](D:/01_PRJ/castle-depense/docs/design/design.md)
- [작업 안내](D:/01_PRJ/castle-depense/docs/work/work.md)
- [배포 안내](D:/01_PRJ/castle-depense/docs/deploy/deploy.md)

## 무엇을 수정할 때 어디를 보면 되나요?

- 게임 규칙을 바꿀 때: `docs/game/game.md`
- 화면이나 UI를 바꿀 때: `docs/game/game.md`
- 코드 구조를 바꿀 때: `docs/design/design.md`
- 지금 해야 할 일을 볼 때: `docs/work/work.md`
- 배포 방법을 볼 때: `docs/deploy/deploy.md`

## 프로젝트 구조

```text
castle-depense/
├── index.html
├── style.css
├── js/
├── test/
└── docs/
```

## 한 줄 정리

게임 내용은 `docs/game`,
코드 구조는 `docs/design`,
할 일은 `docs/work`,
배포는 `docs/deploy`를 보면 됩니다.
