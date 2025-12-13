// Common Utility Functions

// --------------------------------------------------------
// Geometry & Path Helpers
// --------------------------------------------------------

function generatePathData(points, closed = false) {
    // Note: Depends on container dimensions being available or passed. 
    // In authoring.js it used global 'authorCanvasContainer'.
    // To be truly common, we should probably pass dimensions or work with normalized coords?
    // Looking at authoring.js, it multiplies by container W/H.
    // Let's check how it's used. 
    // It seems authoring.js stores NORMALIZED 0-1 coordinates in data.
    // So generating path data for SVG usually requires denormalizing to pixel or % values.
    // IF we use vector-effect="non-scaling-stroke" and viewbox 0 0 100 100, we can just use 0-100 values.

    // For now, let's keep the signature but expect normalized points and return 0-100 based string 
    // effectively making it independent of container pixel size if viewBox is used.
    // HOWEVER, authoring.js logic uses containerW/H for pixel specific operations.
    // Let's stick to the extracted logic but make it independent if possible.

    // Actually, the original function used `authorCanvasContainer`. 
    // To make this pure, we should pass width/height OR assume 100x100 coord system.
    // Let's refactor to use 100x100 coordinate system which matches the SVG viewBox assumption in authoring.

    if (points.length < 2) return '';

    const firstPoint = points[0];
    let pathData = `M ${firstPoint.x * 100} ${firstPoint.y * 100}`;

    for (let i = 1; i < points.length; i++) {
        const p = points[i];
        pathData += ` L ${p.x * 100} ${p.y * 100}`;
    }

    if (closed) {
        pathData += ' Z';
    }

    return pathData;
}

function generatePathDataFromPoints(points, closed = false) {
    // This seems identical to generatePathData but handling the structure potentially differently?
    // In authoring.js both seem to handle [{x,y}] arrays.
    return generatePathData(points, closed);
}

function distanceToLineSegment(point, lineStart, lineEnd) {
    // point, lineStart, lineEnd are {x, y}
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function px(val) { return `${val}px`; }
