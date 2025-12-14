/*
  퍼즐 조각 생성 로직 요약:
  1. 이미지를 4x4 그리드로 분할.
  2. 가로/세로 구분선 생성:
     - 직선 대신 랜덤한 곡선을 사용.
     - 각 세그먼트마다 3-5개의 제어점을 무작위로 생성 (계층화된 샘플링으로 쏠림 방지).
     - 제어점들을 잇는 부드러운 2차 베지에 곡선(Quadratic Curve) 적용.
  3. 생성된 형상(점들의 좌표)을 저장하여 그리기와 자르기에 동일하게 사용.
  4. 원본 캔버스에 그리드 표시.
  5. 개별 조각 추출:
     - 저장된 경계선 좌표를 이용해 클리핑 경로(Clipping Path) 설정.
     - 원본 이미지를 해당 경로로 잘라내어 별도의 캔버스에 그리기.
     - 생성된 조각들을 하단 컨테이너에 배치.
*/

window.onload = function () {
    const canvas = document.getElementById('puzzleCanvas');
    const ctx = canvas.getContext('2d');
    const piecesContainer = document.getElementById('piecesContainer');
    const img = new Image();

    img.src = 'images/Main_Yard_Scene.png';

    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const cols = 4;
        const rows = 4;
        const colWidth = canvas.width / cols;
        const rowHeight = canvas.height / rows;

        // Structured storage
        // verticalSegments[col][row] -> array of points for that specific border
        let verticalSegments = [];
        let horizontalSegments = [];

        function generateSegment(start, end, isVertical, isBorder) {
            let points = [];
            points.push(start);
            if (!isBorder) {
                const length = isVertical ? (end.y - start.y) : (end.x - start.x);
                const numPoints = Math.floor(Math.random() * 3) + 3;
                const slotSize = length / numPoints;

                for (let k = 0; k < numPoints; k++) {
                    let min = slotSize * k + (slotSize * 0.1);
                    let max = slotSize * (k + 1) - (slotSize * 0.1);
                    let mainVal = min + Math.random() * (max - min);
                    // Random X offset - reduced to +/- 15%
                    let crossOffset = (Math.random() - 0.5) * (isVertical ? colWidth : rowHeight) * 0.3;

                    if (isVertical) points.push({ x: start.x + crossOffset, y: start.y + mainVal });
                    else points.push({ x: start.x + mainVal, y: start.y + crossOffset });
                }
            }
            points.push(end);
            return points;
        }

        // Generate Verticals
        for (let i = 0; i <= cols; i++) {
            verticalSegments[i] = [];
            for (let j = 0; j < rows; j++) {
                let start = { x: i * colWidth, y: j * rowHeight };
                let end = { x: i * colWidth, y: (j + 1) * rowHeight };
                let isBorder = (i === 0 || i === cols);
                verticalSegments[i][j] = generateSegment(start, end, true, isBorder);
            }
        }

        // Generate Horizontals
        for (let j = 0; j <= rows; j++) {
            horizontalSegments[j] = [];
            for (let i = 0; i < cols; i++) {
                let start = { x: i * colWidth, y: j * rowHeight };
                let end = { x: (i + 1) * colWidth, y: j * rowHeight };
                let isBorder = (j === 0 || j === rows);
                horizontalSegments[j][i] = generateSegment(start, end, false, isBorder);
            }
        }

        // Draw Grid on Main Canvas
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;

        // Helper to draw a curve
        function drawCurve(context, points) {
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            if (points.length === 2) {
                context.lineTo(points[1].x, points[1].y);
            } else {
                for (let k = 1; k < points.length - 2; k++) {
                    let xc = (points[k].x + points[k + 1].x) / 2;
                    let yc = (points[k].y + points[k + 1].y) / 2;
                    context.quadraticCurveTo(points[k].x, points[k].y, xc, yc);
                }
                context.quadraticCurveTo(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y);
            }
            context.stroke();
        }

        // Verticals
        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j < rows; j++) {
                drawCurve(ctx, verticalSegments[i][j]);
            }
        }
        // Horizontals
        for (let j = 0; j <= rows; j++) {
            for (let i = 0; i < cols; i++) {
                drawCurve(ctx, horizontalSegments[j][i]);
            }
        }


        // --- Create Pieces ---
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                createPieceCanvas(i, j);
            }
        }

        function createPieceCanvas(col, row) {
            // Get path points
            let topPoints = horizontalSegments[row][col];
            let rightPoints = verticalSegments[col + 1][row];
            // Reverse order for bottom and left to maintain cyclic path
            let bottomPoints = [...horizontalSegments[row + 1][col]].reverse();
            let leftPoints = [...verticalSegments[col][row]].reverse();

            // Determine bounding box of the piece to set canvas size
            let allPiecePoints = [...topPoints, ...rightPoints, ...bottomPoints, ...leftPoints];
            let minX = Math.min(...allPiecePoints.map(p => p.x));
            let maxX = Math.max(...allPiecePoints.map(p => p.x));
            let minY = Math.min(...allPiecePoints.map(p => p.y));
            let maxY = Math.max(...allPiecePoints.map(p => p.y));

            // Add some padding to canvas to avoid cutting off stroke
            let padding = 2;
            let pWidth = (maxX - minX) + padding * 2;
            let pHeight = (maxY - minY) + padding * 2;

            let pCanvas = document.createElement('canvas');
            pCanvas.width = pWidth;
            pCanvas.height = pHeight;
            pCanvas.className = 'puzzle-piece';
            let pCtx = pCanvas.getContext('2d');

            // Save context, translate to local coordinates
            pCtx.save();
            pCtx.translate(-minX + padding, -minY + padding);

            // Create Path
            pCtx.beginPath();

            // Helper to trace path without beginPath/stroke
            function trace(pts) {
                if (pts.length === 2) {
                    pCtx.lineTo(pts[1].x, pts[1].y);
                } else {
                    // For segments (which started at pts[0]), we need to be carefully linking.
                    // The first point of 'pts' should match the current pen position if we just finished Previous segment.
                    // topPoints[0] is Top-Left.
                    // rightPoints[0] is Top-Right (which is topPoints[last]).

                    // Optimization: Use standard curve loop
                    // Note: We need to handle the START of the trace carefully.
                    // If we are already at pts[0], we process from index 1.

                    for (let k = 1; k < pts.length - 2; k++) {
                        let xc = (pts[k].x + pts[k + 1].x) / 2;
                        let yc = (pts[k].y + pts[k + 1].y) / 2;
                        pCtx.quadraticCurveTo(pts[k].x, pts[k].y, xc, yc);
                    }
                    pCtx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
                }
            }

            // Move to Start
            pCtx.moveTo(topPoints[0].x, topPoints[0].y);
            trace(topPoints);
            trace(rightPoints);
            trace(bottomPoints);
            trace(leftPoints);
            pCtx.closePath();

            // Clip
            pCtx.clip();

            // Draw Image
            // We need to draw the chunk of image corresponding to these coordinates.
            pCtx.drawImage(img, 0, 0);

            // Draw stroke border around piece
            pCtx.strokeStyle = '#333';
            pCtx.lineWidth = 2;
            pCtx.stroke();

            pCtx.restore();

            piecesContainer.appendChild(pCanvas);
        }
    };

    img.onerror = function () {
        console.error('Failed to load image at ' + img.src);
    };
};
