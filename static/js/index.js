// 이미지 미리보기 로직
const originalImageInput = document.getElementById('original_image');
const maskImageInput = document.getElementById('mask_image');
const originalImagePreview = document.getElementById('originalImagePreview');
// const maskImagePreview = document.getElementById('maskImagePreview'); // Removed
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const drawingTools = document.getElementById('drawingTools');
const maskCanvas = document.getElementById('maskCanvas');
const ctx = maskCanvas.getContext('2d');

// Drawing tool buttons
const brushBtn = document.getElementById('brushBtn');
const eraserBtn = document.getElementById('eraserBtn');
const clearCanvasBtn = document.getElementById('clearCanvasBtn');
const boxBtn = document.getElementById('boxBtn');
const brushThicknessSlider = document.getElementById('brushThickness');
const currentThicknessSpan = document.getElementById('currentThickness');
const toOriginalBtn = document.getElementById('toOriginalBtn');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'brush'; // 'brush' or 'eraser' or 'box'

let startX = 0;
let startY = 0;
let savedImageData = null;

// Drawing properties
ctx.lineWidth = brushThicknessSlider.value; // Initialize with slider value
ctx.lineCap = 'round';
ctx.strokeStyle = 'white'; // Default brush color changed to white

// Update thickness display
currentThicknessSpan.textContent = brushThicknessSlider.value;

brushThicknessSlider.addEventListener('input', () => {
    ctx.lineWidth = brushThicknessSlider.value;
    currentThicknessSpan.textContent = brushThicknessSlider.value;
});

// 캔버스 리사이즈 시 초기화되는 컨텍스트 설정을 복구
function resetDrawingContext() {
    ctx.lineWidth = brushThicknessSlider.value;
    ctx.lineCap = 'round';
    if (currentTool === 'brush' || currentTool === 'box') {
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'white';
    } else {
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    }
}

function resizeCanvasToImage() {
    if (originalImagePreview.style.display !== 'none') {
        // Create a temporary canvas to hold the existing drawing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = maskCanvas.width;
        tempCanvas.height = maskCanvas.height;
        tempCtx.drawImage(maskCanvas, 0, 0);

        // Resize the main maskCanvas
        maskCanvas.width = originalImagePreview.offsetWidth;
        maskCanvas.height = originalImagePreview.offsetHeight;
        maskCanvas.style.width = originalImagePreview.offsetWidth + 'px';
        maskCanvas.style.height = originalImagePreview.offsetHeight + 'px';
        
        // Redraw the saved image onto the resized canvas, scaling it
        ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height); // Clear before drawing
        ctx.drawImage(tempCanvas, 0, 0, maskCanvas.width, maskCanvas.height);
        resetDrawingContext();
    }
}

function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (input === originalImageInput) {
                originalImagePreview.src = e.target.result;
                originalImagePreview.style.display = 'block';
                drawingTools.style.display = 'block';

                // Clear and resize maskCanvas to match the original image
                maskCanvas.style.display = 'block';
                maskCanvas.style.zIndex = 2;
                originalImagePreview.style.zIndex = 1;
            } else if (input === maskImageInput) {
                // Draw the uploaded mask image onto the maskCanvas
                const maskImg = new Image();
                maskImg.onload = () => {
                    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height); // Clear existing mask
                    ctx.drawImage(maskImg, 0, 0, maskCanvas.width, maskCanvas.height);
                    resetDrawingContext();
                };
                maskImg.src = e.target.result;
                // Ensure maskCanvas is visible
                maskCanvas.style.display = 'block';
            }
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        if (input === originalImageInput) {
            originalImagePreview.src = '';
            originalImagePreview.style.display = 'none';
            drawingTools.style.display = 'none';
            maskCanvas.style.display = 'none';
            ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        } else if (input === maskImageInput) {
            ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            // Do not hide maskCanvas if original image is still present
        }
    }
}

originalImageInput.addEventListener('change', function() {
    previewImage(this);
    // 원본 이미지가 로드되면 마스크 캔버스의 위치를 조정
    originalImagePreview.onload = () => {
        resizeCanvasToImage(); // Call the unified resize function
        // 이미지가 로드되고 캔버스 크기가 조정된 후에 캔버스를 흰색으로 채움
        ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        // ctx.fillStyle = 'white';
        // ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        resetDrawingContext();
    };
});

maskImageInput.addEventListener('change', function() {
    previewImage(this);
});

// Window resize event listener
window.addEventListener('resize', () => {
    // Only resize if original image is visible
    resizeCanvasToImage(); // Call the unified resize function
});

function draw(e) {
    if (!isDrawing) return;

    if (currentTool === 'brush' || currentTool === 'eraser') {
        ctx.globalCompositeOperation = (currentTool === 'brush') ? 'source-over' : 'destination-out';
        ctx.strokeStyle = (currentTool === 'brush') ? 'white' : 'rgba(0,0,0,1)'; // Eraser uses transparent color

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    } else if (currentTool === 'box') {
        // Restore the saved image data first
        if (savedImageData) {
            ctx.putImageData(savedImageData, 0, 0);
        }
        
        // Draw preview rectangle outline
        const width = e.offsetX - startX;
        const height = e.offsetY - startY;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line for preview
        ctx.strokeRect(startX, startY, width, height);
        ctx.setLineDash([]); // Reset line dash
        ctx.lineWidth = brushThicknessSlider.value; // Reset line width
    }
}

maskCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    if (currentTool === 'box') {
        [startX, startY] = [e.offsetX, e.offsetY];
        // Save the current canvas state before drawing preview
        savedImageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    }
});

maskCanvas.addEventListener('mousemove', draw);

maskCanvas.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    
    if (currentTool === 'box') {
        // Restore the saved image data first to remove preview
        if (savedImageData) {
            ctx.putImageData(savedImageData, 0, 0);
        }
        
        // Draw the final filled rectangle
        const width = e.offsetX - startX;
        const height = e.offsetY - startY;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'white'; // Box color is white
        ctx.fillRect(startX, startY, width, height);
        
        // Clear saved image data
        savedImageData = null;
    }
    
    isDrawing = false;
});

maskCanvas.addEventListener('mouseout', () => isDrawing = false);

brushBtn.addEventListener('click', () => {
    currentTool = 'brush';
    ctx.strokeStyle = 'white'; // Brush color set to white
    ctx.globalCompositeOperation = 'source-over';
    maskCanvas.classList.remove('eraser-cursor');
    maskCanvas.classList.add('brush-cursor');
});

eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    ctx.strokeStyle = 'rgba(0,0,0,1)'; // For destination-out, color doesn't matter much but can be black
    ctx.globalCompositeOperation = 'destination-out';
    maskCanvas.classList.remove('brush-cursor');
    maskCanvas.classList.add('eraser-cursor');
});

boxBtn.addEventListener('click', () => {
    currentTool = 'box';
    ctx.globalCompositeOperation = 'source-over';
    maskCanvas.classList.remove('brush-cursor', 'eraser-cursor');
    maskCanvas.classList.add('crosshair-cursor');
});

clearCanvasBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskImageInput.value = ''; // Clear the file input as well
    resetDrawingContext();
    maskCanvas.classList.remove('brush-cursor', 'eraser-cursor');
    maskCanvas.classList.add('crosshair-cursor');
});

// Function to convert canvas to Base64
function getCanvasBase64(canvasElement) {
    return canvasElement.toDataURL('image/png').split(',')[1];
}

// Function to convert image src to Base64
async function getImageBase64(imgElement) {
    if (!imgElement.src || imgElement.src.startsWith('data:')) {
        return imgElement.src ? imgElement.src.split(',')[1] : '';
    }
    const response = await fetch(imgElement.src);
    const blob = await response.blob();
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    });
}

document.getElementById('submitEditBtn').addEventListener('click', async function(event) {
    event.preventDefault();
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const editedImage = document.getElementById('editedImage');
    const editPrompt = document.getElementById('edit_prompt').value;
    const editMode = document.getElementById('edit_mode').value; // Get the selected edit mode

    loadingSpinner.style.display = 'block'; // 로딩 스피너 표시
    errorMessage.textContent = ''; // 에러 메시지 초기화
    editedImage.src = ''; // 이전 이미지 제거
    editedImage.alt = '편집된 이미지가 여기에 표시됩니다.';
    toOriginalBtn.style.display = 'none'; // 초기에는 버튼 숨김

    // Base64 인코딩된 이미지 데이터 가져오기
    const originalImageBase64 = await getImageBase64(originalImagePreview);
    const maskImageBase64 = getCanvasBase64(maskCanvas);

    if (!originalImageBase64) {
        errorMessage.textContent = '원본 이미지를 업로드해주세요.';
        loadingSpinner.style.display = 'none';
        return;
    }
    if (!maskImageBase64 || maskImageBase64.length < 100) { // Some heuristic for non-empty mask
        errorMessage.textContent = '마스크 이미지를 그리거나 업로드해주세요.';
        loadingSpinner.style.display = 'none';
        return;
    }

    const payload = {
        original_image: originalImageBase64,
        mask_image: maskImageBase64,
        edit_prompt: editPrompt,
        edit_mode: editMode // Add the edit mode to the payload
    };

    try {
        const response = await fetch('/edit_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        if (result.edited_image_base64) {
            editedImage.src = `data:image/png;base64,${result.edited_image_base64}`;
            editedImage.alt = "편집된 이미지";
            toOriginalBtn.style.display = 'block'; // 편집된 이미지가 있을 때 버튼 표시
        } else {
            throw new Error("서버로부터 편집된 이미지 데이터를 받지 못했습니다.");
        }

    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = `이미지 편집 중 오류 발생: ${error.message}`;
    } finally {
        loadingSpinner.style.display = 'none'; // 로딩 스피너 숨김
    }
});

toOriginalBtn.addEventListener('click', () => {
    if (editedImage.src) {
        originalImagePreview.src = editedImage.src;
        originalImagePreview.style.display = 'block';
        drawingTools.style.display = 'block';

        // 마스크 캔버스 초기화
        ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCanvas.style.display = 'block';
        resizeCanvasToImage(); // 이미지 크기에 맞춰 캔버스 리사이즈 및 컨텍스트 복구

        // 커서 초기화
        maskCanvas.classList.remove('brush-cursor', 'eraser-cursor');
        maskCanvas.classList.add('crosshair-cursor');
        currentTool = 'brush'; // 툴을 브러시로 초기화
        resetDrawingContext(); // 드로잉 컨텍스트 재설정 (색상, 두께 등)
    }
});

