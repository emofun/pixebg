// Show UI
figma.showUI(__html__, { width: 300, height: 520 }); // Increased height to prevent scrolling

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-background') {
    const { width, height, size, gap, colors, maxOpacity } = msg;
    const totalSize = size + gap;
    const columns = Math.ceil(width / totalSize);
    const rows = Math.ceil(height / totalSize);

    // SVG Header
    let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;

    // Background rect (white)
    svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;

    // Generate grid
    let rects = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const posX = x * totalSize;
        const posY = y * totalSize;

        // Opacity Logic
        // Scale opacity based on user-defined maxOpacity
        // Boundary (light/dark) is at 25% of maxOpacity (previously 0.05/0.2 = 0.25)
        const boundary = maxOpacity * 0.25;
        const isLight = Math.random() < 0.7;
        const opacity = isLight 
            ? Math.random() * boundary
            : boundary + Math.random() * (maxOpacity - boundary);

        // Pick random color
        const color = colors && colors.length > 0 
            ? colors[Math.floor(Math.random() * colors.length)] 
            : '#000000';

        // Only draw if visible enough (similar to script.js logic > 0.005)
        if (opacity > 0.005) {
            // SVG uses fill-opacity
            rects += `<rect x="${posX}" y="${posY}" width="${size}" height="${size}" fill="${color}" fill-opacity="${opacity.toFixed(3)}"/>`;
        }
      }
    }

    svgContent += rects + `</svg>`;

    // Create node from SVG
    const node = figma.createNodeFromSvg(svgContent);
    node.name = "Pixel Background";
    
    // Center in viewport
    node.x = figma.viewport.center.x - width / 2;
    node.y = figma.viewport.center.y - height / 2;
    
    // Select and focus
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);

    // Close plugin (optional, kept open for regeneration)
    // figma.closePlugin();
  }
};
