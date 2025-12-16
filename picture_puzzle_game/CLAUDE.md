# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vanilla JavaScript jigsaw puzzle game with Korean language interface. Players can select images (from a preset list or upload their own), choose puzzle dimensions (2x2 to 10x10), and solve puzzles with curved interlocking pieces. Game completion times are tracked and stored locally.

## Development

This is a static HTML/CSS/JavaScript project with no build system or dependencies.

**Running the game:**
- Open [picture_puzzle_game.html](picture_puzzle_game.html) directly in a browser
- OR use a local server: `python -m http.server 8000` and navigate to http://localhost:8000/picture_puzzle_game.html

**Testing changes:**
- Refresh the browser after editing files
- Use browser DevTools console for debugging
- Enable debug visualization via "경계 검증 보기" button to inspect puzzle boundaries

## Architecture

### Core Algorithm: Puzzle Piece Generation

The puzzle piece generation is the most complex part of the codebase, located in [script.js](script.js).

**Three-phase process:**

1. **Boundary Generation** ([script.js:264-309](script.js#L264-L309))
   - `generatePuzzleBoundaries(tileSize)` creates curved boundary lines
   - Horizontal and vertical segments stored in `horizontalSegments[row][col]` and `verticalSegments[col][row]`
   - Each segment is an array of control points for Catmull-Rom splines
   - Border segments are straight lines; internal segments have 3-5 randomized control points

2. **Path Sampling** ([script.js:334-400](script.js#L334-L400))
   - `samplePathSegment(controlPoints, step=3)` converts Bézier control points into dense pixel coordinates
   - Uses Catmull-Rom interpolation for smooth curves
   - 3px sampling interval for precise edge detection
   - Results cached in `sampledPaths` object

3. **Intersection Detection** ([script.js:405-462](script.js#L405-L462))
   - `findCurveIntersections(path1, path2)` finds exact intersections between sampled paths
   - Line segment intersection algorithm with duplicate removal
   - Used to determine precise corner points of each puzzle piece

**Piece Creation** ([script.js:1233+](script.js#L1233))
- `createPieces(imagePath)` generates SVG clipPath for each piece using boundary intersections
- Each piece is a `<div>` with background-image and SVG mask
- Pieces positioned absolutely in `#game-area` for drag-and-drop

### Game Mechanics

**Drag and Drop** ([script.js:1513-1596](script.js#L1513-L1596))
- Unified mouse/touch event handlers
- `makeDraggable(el, piece)` attaches listeners
- Snap-to-grid logic checks piece center against drop zones
- Visual feedback with z-index changes and transformations

**Drop Zones** ([script.js:1188-1220](script.js#L1188-L1220))
- Grid of empty slots created by `createBoard()`
- Each zone has `data-index` matching expected piece position
- Collision detection uses center-point-in-rectangle test

**Completion Detection** ([script.js:1669+](script.js#L1669))
- Checks if all pieces are in correct zones (matches `data-piece-id` with zone `data-index`)
- Triggers celebration popup with SVG animations
- Records completion time

### State Management

**Global Variables** ([script.js:1-86](script.js#L1-L86))
- `ROWS`, `COLS`: Current puzzle dimensions (dynamic)
- `pieces[]`: Array of piece data objects with position and correctness
- `dropZones[]`: Array of DOM elements representing grid slots
- `verticalSegments[][]`, `horizontalSegments[][]`: Boundary control points
- `sampledPaths{}`, `intersections{}`: Cached computation results

**LocalStorage** ([script.js:2076+](script.js#L2076))
- Key: `puzzleGameHistory`
- Structure: Array of `{playerName, imageName, completionTime, date, rows, cols, imageSource}`
- No expiration; grows indefinitely

### UI Structure

**Popup System**
- Three modal popups: image selection, game completion, save result
- All use `.completion-popup` class with `.hidden` toggle
- Event delegation with click-outside-to-close pattern

**Timer** ([script.js:89-119](script.js#L89-L119))
- Starts when pieces are scattered
- Updates every 100ms
- Stops on completion or reset

**Debug Visualization** ([script.js:1866+](script.js#L1866))
- Canvas overlay showing boundary curves and piece paths
- Checkbox controls for toggling individual horizontal/vertical lines
- Useful for debugging boundary generation algorithm

## File Structure

- [picture_puzzle_game.html](picture_puzzle_game.html) - Main game interface with popup templates
- [script.js](script.js) - All game logic (~2170 lines)
- [style.css](style.css) - Responsive styles with CSS custom properties
- [script_making_puzzle_piece.js](script_making_puzzle_piece.js) - Original standalone demo of piece generation algorithm (reference only, not used in game)
- `images/` - Preset puzzle images

## Key Implementation Details

**Responsive Design**
- Board size: CSS custom property `--board-size` with media queries
- Touch events use `{ passive: false }` to prevent scroll-during-drag
- Mobile-optimized with minimum padding and viewport constraints

**Performance Considerations**
- Path sampling cached to avoid redundant Bézier calculations
- Intersection detection runs once per piece generation
- SVG clipPath more performant than canvas masking for this use case

**Coordinate Systems**
- All boundaries generated in tile-space (0 to `boardSize`)
- Piece backgrounds use `background-size: <boardSize>px` with offset positioning
- Drop zones use CSS Grid with `grid-template-columns: repeat(COLS, 1fr)`

## Common Modifications

**Adding new preset images:**
1. Place image in `images/` folder
2. Add path to `availableImages` array in [script.js:77-82](script.js#L77-L82)

**Changing puzzle size limits:**
- Modify `min`/`max` attributes on `#puzzle-rows` and `#puzzle-cols` inputs in [picture_puzzle_game.html:169-174](picture_puzzle_game.html#L169-L174)

**Adjusting curve complexity:**
- Edit `numPoints` range in `generateSegment()` at [script.js:241](script.js#L241)
- Modify `crossOffset` multiplier for gentler/sharper curves at [script.js:249](script.js#L249)

**Modifying snap tolerance:**
- Collision detection threshold at piece center-in-zone check (currently uses zone boundaries exactly)
- Add buffer by expanding `zoneRect` in snap logic

## Known Behaviors

- Piece generation is non-deterministic (randomized control points each game)
- History grows unbounded in localStorage
- 2x2 puzzles log boundary control points to console for debugging
- Upload images persist only for current session (not saved to localStorage)
- Korean text hardcoded in HTML; no i18n system
