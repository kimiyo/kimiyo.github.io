# 한지(Hanji) 배경 모듈 사용 가이드

이 가이드는 `scriptHanji.js` 모듈을 사용하여 웹 프로젝트에 **프랙탈 한지 배경** 효과를 적용하는 방법을 설명합니다.

**특징**:
1.  **프랙탈 노이즈(FBM)**: 한지의 구름 같은 닥나무 펄프 질감을 코드로 생성합니다.
2.  **벡터 섬유**: 지푸라기 같은 섬유질을 매번 다르게 그려내어 선명한 해상도를 유지합니다.
3.  **조명 효과**: 다크 모드 시 촛불 효과와 빛 투과(Backlight) 효과를 지원합니다.

---

## 1. 설치 방법

`scriptHanji.js` 파일을 프로젝트 폴더에 복사하세요.

## 2. 기본 사용법

이 모듈은 배경, 촛불, 캔버스 레이어를 스스로 생성하고 관리합니다. 단순히 모듈을 불러와서 `body`에 연결하면 됩니다.

```html
<script type="module">
    import { Hanji } from './scriptHanji.js';

    // body 태그에 배경 생성
    const hanji = new Hanji(document.body, {
        baseColor: { r: 245, g: 240, b: 230 }, // 기본 종이 색상 (아이보리)
        fiberColor: { r: 140, g: 120, b: 100 }  // 섬유 색상 (갈색)
    });

    hanji.start(); // 애니메이션 시작
</script>
```

---

## 3. 테마 설정 (라이트/다크 모드)

`updateConfig()` 메서드를 사용하면 "맑은 한지(Light)"와 "은은한 촛불(Dark)" 모드를 쉽게 전환할 수 있습니다.

### A. 라이트 모드 (맑은 한지)
깨끗하고 선명한 한지 질감을 표현합니다.

```javascript
const lightConfig = {
    // 1. 시각적 설정
    baseColor: { r: 245, g: 240, b: 230 }, // 밝은 미색
    fiberColor: { r: 140, g: 120, b: 100 }, // 자연스러운 지푸라기 색
    paperRoughness: 25, // 종이의 거친 정도 (높을수록 거침)
    fiberDensity: 1.2,  // 섬유 밀도 (높을수록 촘촘함)

    // 2. 다크 모드 효과 끄기
    backgroundGradient: null,
    candle: null,
    backlight: null
};
```

### B. 다크 모드 (촛불 효과)
어두운 방 안에서 촛불이 한지를 비추는 은은한 분위기를 연출합니다.

```javascript
const darkConfig = {
    // 1. 시각적 설정 (어두운 배경)
    baseColor: { r: 35, g: 30, b: 25 },
    fiberColor: { r: 180, g: 150, b: 120 }, // 어둠 속에서 빛나는 섬유
    paperRoughness: 15,

    // 2. 배경 비네팅 (CSS 그라디언트)
    // 촛불 주변은 밝고 가장자리는 어둡게 처리
    backgroundGradient: 'radial-gradient(circle at 25% 50%, #8e562a 0%, #442a0e 60%, #1a1510 100%)',

    // 3. 촛불 이미지 레이어
    // 촛불 아이콘(SVG/PNG)을 특정 위치에 표시
    candle: {
        src: 'assets/candle.svg',
        x: 0.25, // 왼쪽에서 25% 위치
        y: 0.5,  // 위에서 50% 위치
        width: '200px',
        blur: 4, // 촛불 흐림 효과
        opacity: 1.0
    },

    // 4. 빛 투과 효과 (Backlight Simulation)
    // 종이 뒤에서 빛이 비치는 느낌 구현 (중심부는 밝고 투명하게)
    backlight: {
        x: 0.25, // 촛불 위치와 일치시켜야 함
        y: 0.5,
        radius: 1600, // 빛이 퍼지는 반경
        minAlpha: 0.1 // 중심부 투명도 (0.0 = 완전 투명/가장 밝음)
    }
};
```

---

## 4. 주요 API

### `new Hanji(target, options)`
*   **target**: `HTMLElement` (예: `document.body`).
*   **options**: 초기 설정 객체.

### `instance.updateConfig(newApperance)`
새로운 설정값으로 배경을 즉시 업데이트합니다. 테마 변경 버튼 등에 연결하여 사용합니다.

```javascript
// 예: 테마 토글 버튼
let isDark = false;
button.addEventListener('click', () => {
    isDark = !isDark;
    hanji.updateConfig(isDark ? darkConfig : lightConfig);
});
```

### `instance.start() / .stop()`
애니메이션 루프를 제어합니다. (주로 미세한 빛 떨림 효과에 사용됩니다)

---

## 5. 필요 파일
*   `scriptHanji.js`: 핵심 로직 파일.
*   `assets/candle.svg`: 촛불 기능을 사용할 경우 필요.
