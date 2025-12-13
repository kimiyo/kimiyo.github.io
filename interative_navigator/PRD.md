# 제품 요구사항서 (PRD)

## 인터랙티브 스토리 탐험 웹 애플리케이션

---

## 1. 제품 개요

### 1.1 목적
어린이를 위한 **인터랙티브 동화 탐험 웹 애플리케이션**을 HTML, CSS, JavaScript만으로 구현한다. 사용자는 이미지 위의 특정 영역을 클릭하여 에피소드를 탐험하고, 운영자는 저작 도구를 통해 새로운 스토리를 생성할 수 있다.

### 1.2 핵심 특징
- **순수 웹 기술**: HTML, CSS, JavaScript만 사용 (프레임워크 없음)
- **로컬 스토리지 기반**: 서버 없이 브라우저 localStorage로 데이터 관리
- **JSON 기반 스토리 구조**: 스토리 데이터를 JSON 파일로 관리
- **반응형 디자인**: 다양한 화면 크기에서 정상 동작

### 1.3 시스템 모드
1. **대시보드 (Dashboard)**: 스토리 목록 관리 및 진입점
2. **플레이 모드 (Play Mode)**: 사용자가 스토리를 탐험하는 모드
3. **저작 모드 (Authoring Mode)**: 운영자가 스토리를 생성/편집하는 모드

---

## 2. 파일 구조

```
project/
├── index.html          # 메인 HTML (모든 View 포함)
├── styles.css          # 전역 스타일 정의
├── common.js           # 공통 유틸리티 함수
├── main.js             # 대시보드 및 앱 초기화 로직
├── play.js             # 플레이 모드 로직
├── authoring.js        # 저작 모드 로직
├── static/
│   └── images/         # 이미지 리소스
└── story/
    └── *.json          # 스토리 JSON 파일들
```

---

## 3. JSON 스토리 스키마

### 3.1 스토리 JSON 구조

```json
{
  "storyId": "unique-story-id",
  "title": "스토리 제목",
  "mainImage": "static/images/main.png",
  "episodes": [
    {
      "id": "ep1",
      "name": "에피소드 이름",
      "episodeImage": "static/images/episode_1.png",
      "entryRegion": {
        "shape": "rect | circle | ellipse | polygon | path",
        "coords": { ... }
      }
    }
  ]
}
```

### 3.2 entryRegion.coords 형식 (shape 타입별)

| Shape | coords 구조 | 설명 |
|-------|-------------|------|
| **rect** | `{ x, y, width, height }` | 모두 0~1 정규화 비율 |
| **circle** | `{ cx, cy, r }` | cx, cy는 0~1, r은 (containerW+containerH)/2 기준 정규화 |
| **ellipse** | `{ cx, cy, rx, ry }` | 모두 0~1 정규화 비율 |
| **polygon** | `[{x, y}, ...]` 또는 `{ points: [[x,y], ...] }` | 점 배열 |
| **path** | `{ points: [{x, y}, ...], pathData: "M..." }` | 점 배열 + SVG path data |

---

## 4. 단계별 개발 가이드

개발은 아래 단계 순서로 진행하며, **각 단계 완료 후 테스트를 통해 기능을 검증**한 다음 단계로 진행한다.

---

### Phase 1: 기본 구조 및 대시보드 (Foundation)

#### 1.1 HTML 기본 구조 구현

**목표**: 애플리케이션의 기본 HTML 구조를 생성한다.

**구현 내용**:
- `index.html` 생성
- 4개의 주요 View 컨테이너 정의:
  - `#game-container`: 전체 앱 컨테이너
  - `#dashboard-view`: 대시보드 화면
  - `#main-view`: 플레이 모드 메인 화면
  - `#episode-view`: 에피소드 상세 화면
- `.hidden` 클래스를 사용한 View 전환 구조
- 스크립트 로드 순서: `common.js` → `play.js` → `authoring.js` → `main.js`

**테스트 방법**:
1. 브라우저에서 `index.html` 열기
2. 대시보드 View가 보이는지 확인
3. 개발자 도구 콘솔에 에러가 없는지 확인

---

#### 1.2 기본 CSS 스타일 구현

**목표**: 대시보드 및 공통 UI 스타일을 정의한다.

**구현 내용** (`styles.css`):

1. **리셋 및 기본 스타일**:
   ```css
   * { box-sizing: border-box; margin: 0; padding: 0; }
   body, html { width: 100%; height: 100%; overflow: hidden; }
   ```

2. **대시보드 스타일**:
   - `.dashboard-header`: 헤더 영역 (제목, Import/New 버튼)
   - `.story-grid`: 스토리 카드 목록 (스크롤 가능)
   - `.story-card`: 가로형 카드 레이아웃 (썸네일 + 정보 + 액션 버튼)
   - `.empty-state`: 빈 상태 메시지

3. **버튼 스타일**:
   - `.primary-button`: 주요 액션 버튼 (파란색)
   - `.secondary-button`: 보조 버튼 (회색)
   - `.danger-button`: 위험 액션 버튼 (빨간색)

4. **유틸리티**:
   - `.hidden`: `display: none !important`

**테스트 방법**:
1. 대시보드 헤더와 빈 상태 메시지가 올바르게 표시되는지 확인
2. Import 버튼에 hover 효과가 적용되는지 확인

---

#### 1.3 대시보드 JavaScript 구현

**목표**: 스토리 라이브러리 관리 및 대시보드 렌더링을 구현한다.

**구현 내용** (`main.js`):

1. **상태 관리**:
   ```javascript
   let storyLibrary = [];  // 스토리 배열
   let currentStory = null; // 현재 선택된 스토리
   ```

2. **localStorage 연동**:
   - `loadLibrary()`: localStorage에서 `storyLibrary` 로드
   - `saveLibrary()`: localStorage에 `storyLibrary` 저장

3. **Import 기능**:
   - 파일 input을 통한 JSON 파일 읽기
   - JSON 파싱 및 유효성 검사 (storyId, mainImage, episodes 필수)
   - 중복 storyId 확인 및 덮어쓰기 확인

4. **대시보드 렌더링** (`renderDashboard()`):
   - 빈 상태 또는 스토리 카드 목록 렌더링
   - 각 스토리 카드에 Play, Edit, Download, Delete 버튼 추가
   - 이벤트 리스너 바인딩

5. **스토리 관리 함수**:
   - `deleteStory(story)`: 확인 후 삭제
   - `downloadStory(story)`: JSON 파일 다운로드

**테스트 방법**:
1. Import 버튼으로 JSON 파일 가져오기
2. 새로고침 후 스토리가 유지되는지 확인 (localStorage)
3. Delete 버튼으로 삭제 후 목록에서 사라지는지 확인
4. Download 버튼으로 JSON 다운로드 확인

---

### Phase 2: 플레이 모드 구현 (Play Mode)

#### 2.1 플레이 모드 기본 구조

**목표**: 스토리 플레이의 기본 View 전환을 구현한다.

**구현 내용** (`play.js`):

1. **전역 요소 참조**:
   ```javascript
   let playMainView, playEpisodeView;
   let playMainImage, playMainImageContainer;
   let playEpisodeImage;
   let playBackButton, playExitButton;
   let playCurrentStory = null;
   ```

2. **초기화** (`initPlayer()`):
   - DOM 요소 참조 획득
   - 이벤트 리스너 등록 (Back, Exit 버튼)
   - window resize 이벤트 핸들링
   - 이미지 load 이벤트 핸들링

3. **View 전환 함수**:
   - `playStory(story)`: 대시보드 → 메인 View
   - `showMainView()`: 에피소드 → 메인 View
   - `showEpisodeView(episode)`: 메인 → 에피소드 View
   - `exitPlayMode()`: 플레이 → 대시보드

4. **전역 노출**: `window.initPlayer`, `window.playStory`

**HTML 구조** (`index.html` 내 main-view, episode-view):
```html
<!-- Main View -->
<div id="main-view" class="hidden">
    <button id="exit-button" class="utility-button">🚪 나가기</button>
    <div id="main-image-container">
        <img id="main-image" src="" alt="Main Scene">
    </div>
</div>

<!-- Episode View -->
<div id="episode-view" class="hidden">
    <button id="back-button">← 메인으로 돌아가기</button>
    <div id="episode-image-container">
        <img id="episode-image" src="" alt="Episode Scene">
    </div>
</div>
```

**테스트 방법**:
1. 대시보드에서 Play 버튼 클릭 → 메인 이미지 표시
2. 나가기 버튼 → 대시보드로 복귀
3. 화면 리사이즈 시 이미지가 적절히 조절되는지 확인

---

#### 2.2 클릭 영역 오버레이 렌더링

**목표**: 에피소드 진입 영역을 메인 이미지 위에 오버레이로 표시한다.

**구현 내용** (`play.js` - `renderOverlayRegions()`):

1. **기존 영역 제거**: `.click-region` 클래스 요소들 제거

2. **Shape별 영역 생성**:

   - **rect**:
     ```javascript
     region.style.left = `${coords.x * 100}%`;
     region.style.top = `${coords.y * 100}%`;
     region.style.width = `${coords.width * 100}%`;
     region.style.height = `${coords.height * 100}%`;
     ```

   - **circle** (정규화 반지름 처리):
     ```javascript
     // r은 avgSize 기준으로 정규화되어 있음
     region.style.borderRadius = '50%';
     // width와 height를 동일하게 설정
     ```

   - **ellipse**:
     ```javascript
     region.style.borderRadius = '50%';
     // rx, ry 기반 width, height 설정
     ```

   - **polygon / path**:
     ```javascript
     region.style.clipPath = `polygon(${pointsStr})`;
     // 점 배열을 "x% y%, ..." 형식으로 변환
     ```

3. **클릭 이벤트**: 영역 클릭 시 `showEpisodeView(ep)` 호출

**CSS 스타일** (`.click-region`):
```css
.click-region {
    position: absolute;
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.0);
    border: 2px solid rgba(255, 255, 255, 0.0);
    transition: all 0.3s ease;
    z-index: 10;
}
.click-region:hover {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
    transform: scale(1.05);
}
```

**테스트 방법**:
1. 각 shape 타입(rect, circle, ellipse, polygon, path)의 영역이 올바른 위치에 표시되는지 확인
2. 영역에 마우스 hover 시 강조 효과 확인
3. 영역 클릭 시 해당 에피소드 이미지로 전환 확인
4. 브라우저 리사이즈 후에도 영역 위치가 정확한지 확인

---

### Phase 3: 저작 모드 기본 구조 (Authoring Mode Foundation)

#### 3.1 저작 모드 HTML 및 CSS

**목표**: 저작 모드의 레이아웃을 구현한다.

**HTML 구조** (`#authoring-view`):
```
┌─────────────────────────────────────────────────────┐
│ Header: [←나가기] [스토리 제목 입력] [+New Episode] [💾저장] │
├─────────────────────────────────────────────────────┤
│ Toolbar │      Canvas Area          │ Properties   │
│  (Tools)│   (메인 이미지 + 영역들)    │   Panel     │
│   ⬜    │                           │ [에피소드속성]│
│   ⚪    │   [배경 이미지]            │  - 이름     │
│   🥚    │                           │  - ID       │
│   ✏️    │                           │  - 이미지   │
│   ...   │                           │  - 영역정보 │
│         │                           │ [Save/Del]  │
└─────────────────────────────────────────────────────┘
```

**CSS 레이아웃**:
- `.author-header`: 상단 헤더 (flex, space-between)
- `.author-body`: 본문 영역 (flex, overflow-hidden)
- `.toolbar`: 좌측 도구 바 (60px 너비, 세로 배열)
- `.canvas-area`: 중앙 캔버스 영역 (flex: 1, 그리드 배경)
- `.properties-panel`: 우측 속성 패널 (250px 너비)

**테스트 방법**:
1. 대시보드에서 Edit 버튼 → 저작 화면으로 전환 확인
2. 좌측 툴바, 중앙 캔버스, 우측 패널 레이아웃 확인
3. 나가기 버튼으로 대시보드 복귀 확인

---

#### 3.2 저작 모드 초기화 및 네비게이션

**목표**: 저작 모드의 기본 초기화와 화면 전환을 구현한다.

**구현 내용** (`authoring.js`):

1. **상태 변수**:
   ```javascript
   let editingStory = null;      // 현재 편집 중인 스토리
   let isEpisodeMode = false;    // 에피소드 편집 모드 여부
   let selectedEpId = null;      // 선택된 에피소드 ID
   let hasUnsavedChanges = false; // 변경사항 추적
   ```

2. **초기화** (`initAuthoring()`):
   - DOM 요소 참조 획득
   - 이벤트 리스너 등록

3. **네비게이션**:
   - `startAuthoring(story)`: 저작 모드 진입
     - story가 있으면 기존 스토리 편집 (Deep Copy)
     - story가 없으면 새 스토리 생성
   - `exitAuthoring()`: 저작 모드 종료
     - 변경사항 있으면 확인 메시지
     - 대시보드로 복귀

4. **UI 상태 관리**:
   - `resetUI()`: 모든 UI 상태 초기화
   - `showEmptyState()`: 이미지 없는 상태 표시
   - `setMainImage(src)`: 메인 이미지 설정

5. **전역 노출**: `window.initAuthoring`, `window.startAuthoring`

**테스트 방법**:
1. New 버튼 → 새 스토리로 저작 모드 진입
2. Edit 버튼 → 기존 스토리로 저작 모드 진입
3. 스토리 제목 수정 후 나가기 → 확인 메시지 표시
4. 저장 없이 나가기 후 다시 Edit → 변경사항이 반영되지 않음 확인

---

#### 3.3 메인 이미지 업로드 및 스토리 저장

**목표**: 메인 이미지 업로드와 스토리 저장 기능을 구현한다.

**구현 내용**:

1. **메인 이미지 업로드** (`handleMainImageUpload()`):
   - FileReader로 이미지 읽기
   - Data URL로 미리보기 표시
   - `editingStory.mainImage`에 파일 경로 저장 (`static/images/filename`)

2. **스토리 저장** (`saveStoryToStorage()`):
   - 제목 없으면 prompt로 입력 요청
   - localStorage의 storyLibrary에 저장/업데이트
   - 용량 초과 시 JSON 다운로드 제안

3. **JSON 다운로드** (`downloadStoryJSON(story)`):
   - JSON.stringify로 직렬화
   - Data URL로 a 태그 생성 후 클릭

**테스트 방법**:
1. 빈 캔버스 클릭 → 이미지 업로드 → 캔버스에 표시
2. 스토리 저장 버튼 → localStorage에 저장 확인
3. 새로고침 후 대시보드에서 스토리 확인
4. 용량 큰 이미지 여러 개 추가 → 용량 초과 시 다운로드 제안 확인

---

### Phase 4: 도형 그리기 도구 (Shape Drawing Tools)

#### 4.1 공통 유틸리티 함수

**목표**: 도형 그리기에 필요한 공통 함수를 구현한다.

**구현 내용** (`common.js`):

```javascript
// 픽셀 값 문자열 생성
function px(val) { return `${val}px`; }

// Path 데이터 생성 (0~1 정규화 좌표 → 0~100 SVG 좌표)
function generatePathData(points, closed = false) {
    if (points.length < 2) return '';
    let pathData = `M ${points[0].x * 100} ${points[0].y * 100}`;
    for (let i = 1; i < points.length; i++) {
        pathData += ` L ${points[i].x * 100} ${points[i].y * 100}`;
    }
    if (closed) pathData += ' Z';
    return pathData;
}

// 점에서 선분까지의 거리 계산
function distanceToLineSegment(point, lineStart, lineEnd) { ... }
```

**테스트 방법**:
1. 콘솔에서 `px(100)` → "100px" 반환 확인
2. `generatePathData([{x:0.1, y:0.2}, {x:0.3, y:0.4}], true)` 테스트

---

#### 4.2 사각형 (Rect) 그리기

**목표**: 사각형 영역 그리기 도구를 구현한다.

**구현 내용**:

1. **도구 선택** (`selectTool(tool)`):
   - currentTool 변경
   - 툴바 버튼 active 상태 업데이트

2. **그리기 상태**:
   ```javascript
   let isDrawing = false;
   let dragStartCoords = { x: 0, y: 0 };
   let currentRegionData = null;
   ```

3. **마우스 이벤트**:
   - `onMouseDown`: 그리기 시작, rubber-band 표시
   - `onMouseMove`: rubber-band 크기 업데이트
   - `onMouseUp`: 그리기 완료, 좌표 정규화

4. **Rubber Band** (`#rubber-band`):
   ```css
   #rubber-band {
       position: absolute;
       border: 2px solid #007bff;
       background-color: rgba(0, 123, 255, 0.2);
       pointer-events: none;
       z-index: 50;
   }
   ```

5. **좌표 정규화**:
   ```javascript
   currentRegionData = {
       shape: 'rect',
       coords: {
           x: Number((left / containerW).toFixed(3)),
           y: Number((top / containerH).toFixed(3)),
           width: Number((w / containerW).toFixed(3)),
           height: Number((h / containerH).toFixed(3))
       }
   };
   ```

**테스트 방법**:
1. rect 도구 선택 → 캔버스에서 드래그로 사각형 그리기
2. 속성 패널에 좌표가 표시되는지 확인
3. 에피소드 저장 후 다시 Edit → 사각형 영역 표시 확인

---

#### 4.3 원 (Circle) 및 타원 (Ellipse) 그리기

**목표**: 원과 타원 영역 그리기 도구를 구현한다.

**구현 내용**:

1. **원 그리기 로직**:
   - 시작점에서 현재 마우스까지의 거리 = 반지름
   - rubber-band를 정사각형으로 유지 (borderRadius: 50%)
   - 반지름 정규화: `(containerW + containerH) / 2` 기준

2. **타원 그리기 로직**:
   - rect와 유사하게 bounding box 그리기
   - rx = width/2, ry = height/2

3. **Circle 좌표 저장**:
   ```javascript
   const avgSize = (containerW + containerH) / 2;
   currentRegionData = {
       shape: 'circle',
       coords: {
           cx: Number((cx / containerW).toFixed(3)),
           cy: Number((cy / containerH).toFixed(3)),
           r: Number((r / avgSize).toFixed(3))
       }
   };
   ```

**테스트 방법**:
1. circle 도구 → 드래그로 원 그리기 (정원 유지 확인)
2. ellipse 도구 → 드래그로 타원 그리기
3. 플레이 모드에서 원/타원 영역 클릭 가능 확인
4. 브라우저 리사이즈 후 원이 타원으로 변형되지 않는지 확인

---

#### 4.4 Path (자유 영역) 그리기

**목표**: 점을 연결하여 자유로운 형태의 영역을 그리는 도구를 구현한다.

**구현 내용**:

1. **상태 변수**:
   ```javascript
   let pathPoints = [];      // 클릭한 점들
   let isPathDrawing = false;
   ```

2. **점 추가 로직** (`handlePathClick()`):
   - 클릭할 때마다 pathPoints에 정규화 좌표 추가
   - 첫 번째 점과 가까우면 (15px 이내) 자동 완성

3. **미리보기** (`renderPathPreviewWithMouse()`):
   - SVG polyline으로 현재까지의 점들 표시
   - 마우스 위치까지 임시 선 표시

4. **Path 완성** (`finalizePath()`):
   - 최소 2개 점 필요
   - 폐곡선으로 저장 (Z command)
   - pathData와 points 모두 저장

5. **완성 방법**:
   - 첫 번째 점 클릭 (자동)
   - 또는 더블클릭

**테스트 방법**:
1. path 도구 선택 → 여러 점 클릭으로 다각형 그리기
2. 첫 점 근처 클릭 → 자동 완성 확인
3. 더블클릭으로 완성 확인
4. 복잡한 형태의 영역이 플레이 모드에서 정상 동작하는지 확인

---

### Phase 5: 에피소드 관리 (Episode Management)

#### 5.1 에피소드 선택 및 표시

**목표**: 기존 에피소드를 선택하고 정보를 표시하는 기능을 구현한다.

**구현 내용**:

1. **기존 영역 렌더링** (`renderExistingRegions()`):
   - SVG 레이어에 각 에피소드의 entryRegion 렌더링
   - 선택된 에피소드 강조 (색상 변경)
   - region-group에 data-epId 속성 추가

2. **영역 클릭 감지**:
   - `onMouseDown`에서 region-group 클릭 감지
   - `onEpisodeSelected(epId)` 호출

3. **폼 채우기** (`populateForm(ep)`):
   - 에피소드 이름, ID, 좌표 표시
   - 에피소드 이미지 미리보기

4. **속성 패널 표시**:
   - 선택 시 자동으로 편집 모드 진입
   - Delete, Cancel 버튼 표시

**테스트 방법**:
1. 기존 스토리 Edit → 에피소드 영역들이 표시되는지 확인
2. 영역 클릭 → 속성 패널에 정보 표시
3. 다른 영역 클릭 → 선택 전환 확인

---

#### 5.2 에피소드 생성 및 저장

**목표**: 새 에피소드를 생성하고 저장하는 기능을 구현한다.

**구현 내용**:

1. **새 에피소드 플로우** (`startNewEpisodeFlow()`):
   - isEpisodeMode = true
   - 툴바, 속성 패널 표시
   - 폼 초기화, 자동 ID 생성 (ep1, ep2, ...)

2. **에피소드 이미지 업로드** (`handleEpisodeImageUpload()`):
   - FileReader로 읽기
   - 미리보기 표시
   - 파일명 저장

3. **에피소드 저장** (`saveEpisode()`):
   - Validation:
     - 이름 필수
     - 이미지 필수
     - 영역 필수 (currentRegionData 확인)
   - 새 에피소드 객체 생성
   - `editingStory.episodes`에 추가
   - hasUnsavedChanges = true

4. **에피소드 삭제** (`deleteEpisode()`):
   - 확인 메시지 후 삭제
   - episodes 배열에서 제거

**테스트 방법**:
1. New Episode → 이름 입력, 이미지 업로드, 영역 그리기 → Save
2. 저장 후 영역이 표시되는지 확인
3. 필수 항목 누락 시 에러 메시지 확인
4. Delete 버튼으로 에피소드 삭제 확인

---

#### 5.3 자동 저장 및 에피소드 전환

**목표**: 에피소드 간 전환 시 변경사항을 자동으로 저장한다.

**구현 내용**:

1. **자동 저장** (`autoSaveCurrentEpisode()`):
   - 이름 변경 시 자동 반영
   - 이미지 변경 시 자동 반영
   - 영역 변경 시 자동 반영

2. **에피소드 전환 시 처리**:
   - 다른 에피소드 클릭 시 현재 에피소드 자동 저장
   - 새 에피소드로 선택 전환

3. **취소 처리** (`cancelEpisodeFlow()`):
   - isEpisodeMode = false
   - 툴바, 속성 패널 숨김
   - 선택 해제

**테스트 방법**:
1. 에피소드 선택 → 이름 수정 → 다른 에피소드 클릭 → 이름 변경 유지 확인
2. Cancel 버튼 → 편집 모드 종료 확인
3. 영역 수정 후 다른 에피소드 선택 → 변경사항 유지 확인

---

### Phase 6: 영역 드래그 및 리사이즈 (Drag & Resize)

#### 6.1 영역 드래그 이동

**목표**: 선택된 에피소드 영역을 드래그하여 이동할 수 있게 한다.

**구현 내용**:

1. **상태 변수**:
   ```javascript
   let isDragging = false;
   let initialShapeData = null;
   ```

2. **드래그 시작** (`startDrag()`):
   - 편집 모드에서 선택된 영역 클릭 시
   - 초기 좌표 및 shape 데이터 저장

3. **드래그 처리** (`handleDrag()`):
   - shape 타입별 좌표 업데이트:
     - rect: x, y 변경
     - circle/ellipse: cx, cy 변경
     - polygon/path: 모든 점에 동일한 delta 적용
   - 실시간 `renderExistingRegions()` 호출

4. **드래그 종료**:
   - isDragging = false
   - hasUnsavedChanges = true

**테스트 방법**:
1. 에피소드 선택 → 영역 드래그 → 위치 변경 확인
2. 각 shape 타입별 드래그 테스트
3. 스토리 저장 후 다시 Edit → 위치 유지 확인

---

#### 6.2 영역 리사이즈

**목표**: 선택된 영역의 크기를 조절할 수 있는 핸들을 제공한다.

**구현 내용**:

1. **리사이즈 핸들 렌더링** (`renderResizeHandles()`):
   - 8방향 핸들: nw, n, ne, e, se, s, sw, w
   - SVG rect 요소로 핸들 생성
   - bounding box 기준 위치 설정

2. **리사이즈 시작** (`startResize()`):
   - 핸들 클릭 감지
   - activeHandle 저장 (방향)

3. **리사이즈 처리** (`handleResize()`):
   - 핸들 방향에 따른 새 bounding box 계산
   - shape 타입별 좌표 업데이트:
     - rect: 직접 bounding box 적용
     - circle: 작은 축 기준 원 유지
     - ellipse: rx, ry 업데이트
     - polygon/path: scale 변환 적용

4. **커서 스타일** (`getCursorForHandle()`):
   - 방향별 적절한 resize 커서

**Circle 리사이즈 특수 처리**:
- Circle은 픽셀 단위 div로 렌더링 (SVG preserveAspectRatio 문제 해결)
- `renderCircleResizeHandles()`: 별도 div 핸들 생성

**테스트 방법**:
1. 각 shape 선택 → 핸들 표시 확인
2. 핸들 드래그로 크기 조절
3. circle 리사이즈 시 원형 유지 확인
4. polygon/path 리사이즈 시 비율 유지 확인

---

### Phase 7: Path 점 편집 (붓/지우개 모드)

#### 7.1 점 핸들 렌더링 및 도구 전환

**목표**: Path 타입 영역의 점을 편집할 수 있는 붓/지우개 도구를 구현한다.

**구현 내용**:

1. **도구 버튼 표시 조건** (`updateToolbarButtonVisibility()`):
   - 선택된 에피소드가 path 타입일 때만 붓/지우개 버튼 표시
   - CSS로 기본 숨김: `.tool-btn[data-tool="brush/eraser"] { display: none; }`

2. **점 핸들 렌더링** (`renderPathPointHandles()`):
   - brush/eraser 모드일 때 각 점에 SVG circle 핸들 생성
   - 붓 모드: 파란색 핸들, move 커서
   - 지우개 모드: 빨간색 핸들, pointer 커서

3. **점 추가 힌트** (붓 모드):
   - 각 선분의 중간점에 점선 원 표시
   - 클릭 시 해당 위치에 새 점 추가

**CSS 스타일**:
```css
.path-point-handle { pointer-events: auto; }
.path-point-handle:hover { filter: brightness(1.2); }
.path-add-point-handle { opacity: 0.5; }
.path-add-point-handle:hover { opacity: 1; }
```

**테스트 방법**:
1. path 타입 에피소드 선택 → 붓/지우개 버튼 표시 확인
2. 다른 타입 선택 → 버튼 숨김 확인
3. 붓 모드 → 점 핸들이 파란색으로 표시
4. 지우개 모드 → 점 핸들이 빨간색으로 표시

---

#### 7.2 점 드래그 이동 (붓 모드)

**목표**: 붓 모드에서 점을 드래그하여 위치를 변경할 수 있게 한다.

**구현 내용**:

1. **상태 변수**:
   ```javascript
   let isDraggingPoint = false;
   let draggingPointIndex = -1;
   let pointDragStartCoords = { x: 0, y: 0 };
   ```

2. **점 드래그 시작** (`startPointDrag()`):
   - 붓 모드에서 점 핸들 mousedown
   - 점 인덱스 저장

3. **점 드래그 처리** (`handlePointDrag()`):
   - 새 정규화 좌표 계산
   - points 배열 업데이트
   - pathData 재생성

4. **점 드래그 종료** (`endPointDrag()`):
   - hasUnsavedChanges = true

**테스트 방법**:
1. 붓 모드 → 점 핸들 드래그 → 점 위치 변경
2. 드래그 중 실시간 영역 업데이트 확인
3. 스토리 저장 후 변경사항 유지 확인

---

#### 7.3 점 추가/삭제

**목표**: 붓 모드에서 점 추가, 지우개 모드에서 점 삭제 기능을 구현한다.

**구현 내용**:

1. **점 추가** (`handleAddPointClick()`):
   - 선분 중간점 클릭
   - points 배열에 새 점 삽입
   - pathData 재생성

2. **점 삭제** (`handlePointHandleClick()` - eraser):
   - 지우개 모드에서 점 핸들 클릭
   - 최소 3개 점 유지 (미만이면 경고)
   - points 배열에서 제거
   - pathData 재생성

3. **Path 데이터 재생성** (`generatePathDataFromPoints()`):
   - 변경된 points로 새 pathData 생성

**테스트 방법**:
1. 붓 모드 → 중간점 클릭 → 새 점 추가 확인
2. 지우개 모드 → 점 클릭 → 점 삭제 확인
3. 3개 미만으로 삭제 시도 → 경고 메시지 확인
4. 복잡한 path에서 점 추가/삭제/이동 조합 테스트

---

## 5. 비기능 요구사항

### 5.1 성능
- JSON 로딩 및 렌더링: 300ms 이내
- 에피소드 전환 애니메이션: 300ms 페이드 효과
- 도형 그리기 시 60fps 유지

### 5.2 접근성
- 모든 이미지에 alt 속성 제공
- 클릭 가능한 영역은 hover 시 시각적 피드백 제공
- 버튼에 title 속성으로 설명 제공

### 5.3 브라우저 호환성
- Chrome, Firefox, Safari, Edge 최신 버전 지원
- ES6+ JavaScript 문법 사용

### 5.4 오류 처리
- JSON 파싱 실패 시 사용자 알림
- 이미지 로드 실패 시 대체 처리
- localStorage 용량 초과 시 JSON 다운로드 제안

---

## 6. 개발 완료 체크리스트

### Phase 1: 기본 구조 및 대시보드
- [ ] HTML 기본 구조 구현
- [ ] CSS 스타일 구현
- [ ] 대시보드 JavaScript 구현
- [ ] Import/Delete/Download 기능 테스트

### Phase 2: 플레이 모드
- [ ] 플레이 모드 View 전환
- [ ] 클릭 영역 오버레이 렌더링 (모든 shape)
- [ ] 반응형 렌더링 테스트

### Phase 3: 저작 모드 기본 구조
- [ ] 저작 모드 HTML/CSS
- [ ] 초기화 및 네비게이션
- [ ] 메인 이미지 업로드
- [ ] 스토리 저장

### Phase 4: 도형 그리기 도구
- [ ] 공통 유틸리티 함수
- [ ] Rect 그리기
- [ ] Circle/Ellipse 그리기
- [ ] Path 그리기

### Phase 5: 에피소드 관리
- [ ] 에피소드 선택 및 표시
- [ ] 에피소드 생성 및 저장
- [ ] 자동 저장

### Phase 6: 드래그 및 리사이즈
- [ ] 영역 드래그 이동
- [ ] 영역 리사이즈

### Phase 7: Path 점 편집
- [ ] 점 핸들 렌더링
- [ ] 점 드래그 이동
- [ ] 점 추가/삭제

---

## 7. 향후 확장 고려사항

1. **다국어 지원**: i18n 프레임워크 없이 JSON 기반 번역
2. **에피소드 내 인터랙션**: 애니메이션, 사운드 효과
3. **서버 연동**: JSON 파일 클라우드 저장/불러오기
4. **TTS 내레이션**: Web Speech API 활용
5. **히스토리/되돌리기**: 편집 히스토리 관리

---

# END OF DOCUMENT
