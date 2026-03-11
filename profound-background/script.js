const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.querySelector('.canvas-wrapper');

// Inputs
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const sizeInput = document.getElementById('size');
const gapInput = document.getElementById('gap');
const maxOpacityInput = document.getElementById('max-opacity-num');
const maxOpacityRange = document.getElementById('max-opacity-range');
const colorsListEl = document.getElementById('colors-list');
const addInfoBtn = document.getElementById('addInfoBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Params
let config = {
    // width/height removed from config as they are now dynamic based on container
    size: 3,
    gap: 5,
    colors: ['#000000'],
    maxOpacity: 0.2
};

// State to track if user has manually modified dimensions
let isWidthModified = false;
let isHeightModified = false;

let grid = [];
let totalSize;
let columns, rows;
let width, height; // Dynamic dimensions

// --- Color Management ---
const trashSvg = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 9H4V8H5V9Z" fill="black"/>
<path d="M8 9H7V8H8V9Z" fill="black"/>
<path d="M7 6V8H5V6H7Z" fill="black"/>
<path d="M5 6H4V5H5V6Z" fill="black"/>
<path d="M8 6H7V5H8V6Z" fill="black"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 3H11V4H10V11H2V4H1V3H4V1H8V3ZM3 10H9V4H3V10ZM5 3H7V2H5V3Z" fill="black"/>
</svg>`;

function renderColors() {
    const rows = colorsListEl.querySelectorAll('.color-row');
    const isSingle = rows.length <= 1;

    rows.forEach((row, index) => {
        let deleteBtn = row.querySelector('.delete-btn');
        if (isSingle) {
            if (deleteBtn) deleteBtn.remove();
        } else {
            if (!deleteBtn) {
                deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = trashSvg;
                deleteBtn.onclick = () => removeColor(row);
                row.appendChild(deleteBtn);
            }
        }
    });
    updateConfig(); // Update colors in config
}

function addColor(initialValue = '000000') {
    const row = document.createElement('div');
    row.className = 'color-row';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-wrapper color-input-container';
    
    const prefix = document.createElement('span');
    prefix.textContent = '#';
    prefix.style.color = '#333';
    prefix.style.fontSize = '12px';
    prefix.style.marginRight = '2px';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = initialValue.replace('#', '');
    input.placeholder = 'XXXXXX';
    input.maxLength = 7;
    
    const previewBox = document.createElement('div');
    previewBox.className = 'color-preview-box';
    previewBox.style.backgroundColor = '#' + initialValue.replace('#', '');
    
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'color-picker-input';
    
    const hexVal = '#' + initialValue.replace('#', '');
    if (/^#[0-9A-F]{6}$/i.test(hexVal)) {
        colorPicker.value = hexVal;
    } else {
        colorPicker.value = '#000000';
    }
    
    previewBox.appendChild(colorPicker);

    const updateFromInput = () => {
        let val = input.value.replace('#', '');
        input.value = val;
        const fullHex = '#' + val;
        if (/^#[0-9A-F]{6}$/i.test(fullHex)) {
            previewBox.style.backgroundColor = fullHex;
            previewBox.style.display = 'block';
            colorPicker.value = fullHex;
        } else {
            previewBox.style.display = 'none';
        }
        updateConfig();
    };

    input.addEventListener('input', updateFromInput);
    
    colorPicker.addEventListener('input', (e) => {
        const hex = e.target.value.toUpperCase();
        input.value = hex.replace('#', '');
        previewBox.style.backgroundColor = hex;
        previewBox.style.display = 'block'; 
        updateConfig();
    });

    inputContainer.appendChild(prefix);
    inputContainer.appendChild(input);
    inputContainer.appendChild(previewBox);
    
    row.appendChild(inputContainer);
    
    if (colorsListEl.firstChild) {
        colorsListEl.insertBefore(row, colorsListEl.firstChild);
    } else {
        colorsListEl.appendChild(row);
    }
    
    renderColors();
}

function removeColor(row) {
    row.remove();
    renderColors();
}

// --- Logic ---

function updateConfig() {
    config.exportWidth = parseInt(widthInput.value) || 1920;
    config.exportHeight = parseInt(heightInput.value) || 1080;
    
    // Config width/height are NOT used for preview sizing anymore
    // We just trigger resize() which grabs the container size
    
    config.size = parseFloat(sizeInput.value) || 3;
    config.gap = parseFloat(gapInput.value) || 5;
    config.maxOpacity = parseInt(maxOpacityInput.value) / 100 || 0.2;

    const colorInputs = document.querySelectorAll('.color-input-container input[type="text"]');
    const colors = Array.from(colorInputs).map(i => '#' + i.value).filter(c => /^#[0-9A-F]{6}$/i.test(c));
    config.colors = colors.length > 0 ? colors : ['#000000'];

    totalSize = config.size + config.gap;
    
    resize();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function initGrid() {
    grid = [];
    columns = Math.ceil(width / totalSize);
    rows = Math.ceil(height / totalSize);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            
            const boundary = config.maxOpacity * 0.25;
            // Initial opacity
            const isLight = Math.random() < 0.7;
            const targetOp = isLight 
                ? Math.random() * boundary 
                : boundary + Math.random() * (config.maxOpacity - boundary);
            
            const startOp = Math.random() * targetOp;

            grid.push({
                x: x * totalSize,
                y: y * totalSize,
                opacity: startOp,
                targetOpacity: targetOp,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                changeTimer: Math.random() * 60
            });
        }
    }
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    
    // Use config width/height for the canvas size (Actual Size)
    width = config.exportWidth;
    height = config.exportHeight;
    
    // Set internal resolution
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Scale context
    ctx.scale(dpr, dpr);
    
    // Set display size to match export dimensions
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Ensure wrapper fills the container
    canvasWrapper.style.width = '100%';
    canvasWrapper.style.height = '100%';
    
    initGrid();
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const boundary = config.maxOpacity * 0.25;

    for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];
        
        // Update logic
        cell.changeTimer--;
        if (cell.changeTimer <= 0) {
             const isLight = Math.random() < 0.7;
             const newTarget = isLight 
                ? Math.random() * boundary
                : boundary + Math.random() * (config.maxOpacity - boundary);
                
             cell.targetOpacity = newTarget;
             cell.changeTimer = 30 + Math.random() * 90;
             cell.color = config.colors[Math.floor(Math.random() * config.colors.length)];
        }

        // Lerp opacity
        cell.opacity += (cell.targetOpacity - cell.opacity) * 0.05;
        
        if (cell.opacity > 0.005) {
            // Parse hex color to rgba
            const rgb = hexToRgb(cell.color);
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${cell.opacity})`;
            ctx.fillRect(cell.x, cell.y, config.size, config.size);
        }
    }
    
    requestAnimationFrame(draw);
}

function downloadSVG() {
    // Use export dimensions for download
    const exportW = config.exportWidth;
    const exportH = config.exportHeight;
    
    let svgContent = `<svg width="${exportW}" height="${exportH}" viewBox="0 0 ${exportW} ${exportH}" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    svgContent += `<rect width="${exportW}" height="${exportH}" fill="white"/>`;
    
    // Re-generate grid for export dimensions
    const expCols = Math.ceil(exportW / totalSize);
    const expRows = Math.ceil(exportH / totalSize);
    
    for (let y = 0; y < expRows; y++) {
        for (let x = 0; x < expCols; x++) {
            // Generate static snapshot based on same logic
            const boundary = config.maxOpacity * 0.25;
            const isLight = Math.random() < 0.7;
            const opacity = isLight 
                ? Math.random() * boundary 
                : boundary + Math.random() * (config.maxOpacity - boundary);
            
            if (opacity > 0.005) {
                const color = config.colors[Math.floor(Math.random() * config.colors.length)];
                const posX = x * totalSize;
                const posY = y * totalSize;
                svgContent += `<rect x="${posX}" y="${posY}" width="${config.size}" height="${config.size}" fill="${color}" fill-opacity="${opacity.toFixed(3)}"/>`;
            }
        }
    }
    
    svgContent += `</svg>`;
    
    const blob = new Blob([svgContent], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-background.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Event Listeners
['width', 'height', 'size', 'gap'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        if (id === 'width') isWidthModified = true;
        if (id === 'height') isHeightModified = true;
        updateConfig();
    });
});

addInfoBtn.onclick = () => addColor();

downloadBtn.onclick = downloadSVG;

// Opacity Slider Sync
function updateRangeBackground(val) {
    const percent = ((val - maxOpacityRange.min) / (maxOpacityRange.max - maxOpacityRange.min)) * 100;
    maxOpacityRange.style.background = `linear-gradient(to right, #000 0%, #000 ${percent}%, #E5E5E5 ${percent}%, #E5E5E5 100%)`;
}

maxOpacityRange.oninput = () => {
    maxOpacityInput.value = maxOpacityRange.value;
    updateRangeBackground(maxOpacityRange.value);
    updateConfig();
};
maxOpacityInput.oninput = () => {
    maxOpacityRange.value = maxOpacityInput.value;
    updateRangeBackground(maxOpacityInput.value);
    updateConfig();
};

function handleWindowResize() {
    // Get available space in the container (canvasWrapper is 100% of container)
    // We need to measure the container or wrapper. 
    // Since wrapper is 100% width/height of container, we can use wrapper.
    const newW = canvasWrapper.clientWidth;
    const newH = canvasWrapper.clientHeight;
    
    if (!isWidthModified) {
        widthInput.value = newW;
    }
    
    if (!isHeightModified) {
        heightInput.value = newH;
    }
    
    updateConfig();
}

window.addEventListener('resize', handleWindowResize);

// Init
addColor('000000');
updateRangeBackground(20);
// Initial setup: force update from container size
handleWindowResize();
draw();
