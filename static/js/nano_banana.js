document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generateBtn');
    
    const imageUpload = document.getElementById('imageUpload');
    const uploadedImage = document.getElementById('uploadedImage');
    const placeholderText = document.getElementById('placeholderText');
    const imageDisplayArea = document.querySelector('.image-display-area');
    const sidebar = document.querySelector('.sidebar');
    const maskCanvas = document.getElementById('maskCanvas');
    const ctx = maskCanvas.getContext('2d');
    const textResponseArea = document.getElementById('textResponseArea'); // Add this line
    const checkAllBtn = document.getElementById('checkAllBtn'); // Add this line
    const uncheckAllBtn = document.getElementById('uncheckAllBtn'); // Add this line
    const coworkingCheckbox = document.getElementById('coworkingCheckbox'); // Add this line
    const guideCanvas = document.getElementById('guideCanvas'); // Add this line
    const guideCtx = guideCanvas.getContext('2d'); // Add this line

    // Drawing tool buttons
    const brushBtn = document.getElementById('brushBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    const boxBtn = document.getElementById('boxBtn');
    const newImageBtn = document.getElementById('newImageBtn'); // Added for new image button
    const deleteImagesBtn = document.getElementById('deleteImagesBtn'); // Added for delete images button
    const saveBtn = document.getElementById('saveBtn'); // Added for save button
    const downloadBtn = document.getElementById('downloadBtn'); // Added for download button
    const brushThicknessSlider = document.getElementById('brushThickness');
    const currentThicknessSpan = document.getElementById('currentThickness');
    const imageWidthInput = document.getElementById('imageWidth');
    const imageHeightInput = document.getElementById('imageHeight');
    const brushColorInput = document.getElementById('brushColor'); // Add this line
    const fixedPromptHeaderInput = document.getElementById('fixedPromptHeader'); // Add this line
    const sketchCheckbox = document.getElementById('sketchCheckbox'); // Add this line

    const sizeLargeLink = document.getElementById('sizeLarge');
    const sizeMediumLink = document.getElementById('sizeMedium');
    const sizeSmallLink = document.getElementById('sizeSmall');
    const saveDemoBtn = document.getElementById('saveDemoBtn'); // Add this line
    const loadDemoBtn = document.getElementById('loadDemoBtn'); // Add this line
    const pasteFromClipboardBtn = document.getElementById('pasteFromClipboardBtn'); // Add this line
    const loadDemoModal = document.getElementById('loadDemoModal'); // Add this line
    const closeButton = document.querySelector('.close-button'); // Add this line
    const demoList = document.getElementById('demoList'); // Add this line
    const demoSearchInput = document.getElementById('demoSearchInput'); // Add this line

    let currentFixedSize = parseInt(imageWidthInput.value); // Initialize with current input value

    const promptHistoryModal = document.getElementById('promptHistoryModal');
    const closePromptHistoryButton = document.getElementById('closePromptHistoryButton');
    const promptHistoryList = document.getElementById('promptHistoryList');
    const promptHistorySearchInput = document.getElementById('promptHistorySearchInput');

    // Function to set canvas size and disable inputs
    function setCanvasSize(size, clickedLink) {
        const width = size;
        const height = size;
        currentFixedSize = size; // Update the global fixed size

        imageWidthInput.value = width;
        imageHeightInput.value = height;

        uploadedImage.width = width;  
        uploadedImage.height = height;
        uploadedImage.style.width = width + 'px';
        uploadedImage.style.height = height + 'px';

        maskCanvas.width = width;
        maskCanvas.height = height;
        maskCanvas.style.width = width + 'px';
        maskCanvas.style.height = height + 'px';

        guideCanvas.width = width; // Set guideCanvas size
        guideCanvas.height = height; // Set guideCanvas size
        guideCanvas.style.width = width + 'px'; // Set guideCanvas style size
        guideCanvas.style.height = height + 'px'; // Set guideCanvas style size
        guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height); // Clear guideCanvas

        ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        resetDrawingContext();

        imageWidthInput.disabled = true;
        imageHeightInput.disabled = true;

        // Hide placeholder and show image/canvas if not already visible
        placeholderText.style.display = 'none';
        uploadedImage.style.display = 'block';
        maskCanvas.style.display = 'block';
        guideCanvas.style.display = 'block'; // Show guideCanvas

        // Update bold style for size links
        [sizeLargeLink, sizeMediumLink, sizeSmallLink].forEach(link => {
            link.style.fontWeight = 'normal';
        });
        if (clickedLink) {
            clickedLink.style.fontWeight = 'bold';
        }

        // If an image is already loaded, redraw it on the new canvas size
        if (uploadedImage.src && uploadedImage.src !== '#' && uploadedImage.style.display !== 'none') {
            const tempImage = new Image();
            tempImage.onload = () => {
                ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
                // Calculate dimensions to fit the existing image into the new square canvas, maintaining aspect ratio
                const { width: scaledWidth, height: scaledHeight } = calculateAspectFitDimensions(tempImage.naturalWidth, tempImage.naturalHeight, width, height);
                
                // Center the image within the square canvas
                const offsetX = (width - scaledWidth) / 2;
                const offsetY = (height - scaledHeight) / 2;

                ctx.drawImage(tempImage, offsetX, offsetY, scaledWidth, scaledHeight);
                // Update uploadedImage dimensions as well
                uploadedImage.width = scaledWidth;
                uploadedImage.height = scaledHeight;
                uploadedImage.style.width = scaledWidth + 'px';
                uploadedImage.style.height = scaledHeight + 'px';

                resetDrawingContext();
            };
            tempImage.src = uploadedImage.src;
        } else {
            // If no image is loaded, just clear the canvas
            ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            resetDrawingContext();
            // Show placeholder text if there is no image loaded
            placeholderText.style.display = 'block';
            placeholderText.textContent = '새로운 캔버스 크기로 설정되었습니다. 이미지를 여기에 드롭하거나 업로드하세요.';
            uploadedImage.style.display = 'none';
            maskCanvas.style.display = 'none';
            guideCanvas.style.display = 'none'; // Hide guideCanvas
        }
    }

    // Event listeners for size links
    sizeLargeLink.addEventListener('click', (event) => {
        event.preventDefault();
        setCanvasSize(1000, sizeLargeLink);
    });

    sizeMediumLink.addEventListener('click', (event) => {
        event.preventDefault();
        setCanvasSize(800, sizeMediumLink);
    });

    sizeSmallLink.addEventListener('click', (event) => {
        event.preventDefault();
        setCanvasSize(600, sizeSmallLink);
    });

    // Initialize the bold state for the default size (e.g., Medium if initial value is 800)
    if (currentFixedSize === 1000) {
        sizeLargeLink.style.fontWeight = 'bold';
    } else if (currentFixedSize === 800) {
        sizeMediumLink.style.fontWeight = 'bold';
    } else if (currentFixedSize === 600) {
        sizeSmallLink.style.fontWeight = 'bold';
    }

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'brush'; // 'brush' or 'eraser' or 'box'

    let startX = 0;
    let startY = 0;
    let savedImageData = null;

    let pastedImageContainer = document.getElementById('pastedImageContainer');
    let pastedImage = document.getElementById('pastedImage');
    let isResizing = false;
    let isDragging = false;
    let initialX, initialY;
    let initialWidth, initialHeight;
    let initialLeft, initialTop; // Add these variables

    // Drawing properties
    ctx.lineWidth = brushThicknessSlider.value; // Initialize with slider value
    ctx.lineCap = 'round';
    ctx.strokeStyle = brushColorInput.value; // Default brush color changed to red

    guideCtx.lineWidth = 2; // Initialize guideCtx line width
    guideCtx.lineCap = 'round';
    guideCtx.strokeStyle = brushColorInput.value; // Initialize guideCtx stroke color
    guideCtx.setLineDash([5, 5]); // Set dashed line for guideCtx

    // Function to update cursor based on brush thickness
    function updateCursor() {
        const thickness = parseInt(brushThicknessSlider.value); // Ensure thickness is an integer
        // Cursor size should match thickness, so radius is thickness / 2
        const radius = thickness / 2;
        const brushSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${thickness}' height='${thickness}' viewport='0 0 ${thickness} ${thickness}' version='1.1'><circle cx='${radius}' cy='${radius}' r='${radius - 0.5}' stroke='black' stroke-width='1' fill='white' /></svg>`;
        const eraserSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${thickness}' height='${thickness}' viewport='0 0 ${thickness} ${thickness}' version='1.1'><circle cx='${radius}' cy='${radius}' r='${radius - 0.5}' stroke='black' stroke-width='1' fill='none' /></svg>`;

        const brushCursorUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(brushSvg)}") ${radius} ${radius}, auto`;
        const eraserCursorUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(eraserSvg)}") ${radius} ${radius}, auto`;
        
        if (currentTool === 'brush') {
            maskCanvas.style.cursor = brushCursorUrl;
        } else if (currentTool === 'eraser') {
            maskCanvas.style.cursor = eraserCursorUrl;
        } else {
            maskCanvas.style.cursor = 'crosshair'; // Default for other tools
        }
    }

    // Update thickness display
    currentThicknessSpan.textContent = brushThicknessSlider.value;

    brushThicknessSlider.addEventListener('input', () => {
        ctx.lineWidth = brushThicknessSlider.value;
        currentThicknessSpan.textContent = brushThicknessSlider.value;
        updateCursor(); // Update cursor size when thickness changes
    });

    brushColorInput.addEventListener('change', () => {
        ctx.strokeStyle = brushColorInput.value; // Update strokeStyle here
        ctx.fillStyle = brushColorInput.value; // Also update fillStyle for box tool
    });

    function updatePrompt() {
        if (!coworkingCheckbox.checked) {
            fixedPromptHeaderInput.value = "Create an image that is,";
        } else { // Coworking is checked
            if (sketchCheckbox.checked) {
                fixedPromptHeaderInput.value = "Keep the same minimal line drawing style. That is,";
            } else {
                fixedPromptHeaderInput.value = "Turn the sketched part of this image into a drawing in a similar style of the picture. That is,";
            }
        }
    }

    // 캔버스 리사이즈 시 초기화되는 컨텍스트 설정을 복구
    function resetDrawingContext() {
        ctx.lineWidth = brushThicknessSlider.value;
        ctx.lineCap = 'round';
        if (currentTool === 'brush' || currentTool === 'box') {
            ctx.strokeStyle = brushColorInput.value;
            ctx.fillStyle = brushColorInput.value;
        } else {
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.fillStyle = 'rgba(0,0,0,0)'; // Ensure fillStyle is transparent for eraser
        }
    }

    function updateImageNumbering() {
        const imagePlaceholders = sidebar.querySelectorAll('.image-placeholder');
        let checkedImageCount = 0;
        imagePlaceholders.forEach(imgContainer => {
            const checkbox = imgContainer.querySelector('.image-checkbox');
            const imageNumberSpan = imgContainer.querySelector('.image-number');
            if (checkbox && imageNumberSpan) {
                if (checkbox.checked) {
                    checkedImageCount++;
                    imageNumberSpan.textContent = checkedImageCount;
                    imageNumberSpan.style.display = 'block'; // Show the number
                } else {
                    imageNumberSpan.textContent = ''; // Clear the number
                    imageNumberSpan.style.display = 'none'; // Hide the number
                }
            }
        });
    }

    function resizeCanvasToImage() {
        if (uploadedImage.style.display !== 'none') {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = maskCanvas.width;
            tempCanvas.height = maskCanvas.height;
            tempCtx.drawImage(maskCanvas, 0, 0);

            // Calculate the dimensions of the image display area
            const displayAreaWidth = imageDisplayArea.offsetWidth;
            const displayAreaHeight = imageDisplayArea.offsetHeight;

            // Get natural dimensions of the uploaded image
            const naturalWidth = uploadedImage.naturalWidth;
            const naturalHeight = uploadedImage.naturalHeight;

            // Calculate new image dimensions to fit within the display area, maintaining aspect ratio
            let newWidth = naturalWidth;
            let newHeight = naturalHeight;

            if (newWidth > displayAreaWidth || newHeight > displayAreaHeight) {
                const aspectRatio = newWidth / newHeight;
                if (newWidth / displayAreaWidth > newHeight / displayAreaHeight) {
                    newWidth = displayAreaWidth;
                    newHeight = displayAreaWidth / aspectRatio;
                } else {
                    newHeight = displayAreaHeight;
                    newWidth = displayAreaHeight * aspectRatio;
                }
            }

            // Set the displayed image and canvas dimensions
            uploadedImage.style.width = newWidth + 'px';
            uploadedImage.style.height = newHeight + 'px';
            uploadedImage.width = newWidth; // Also update element attributes for consistency
            uploadedImage.height = newHeight;

            maskCanvas.width = newWidth;
            maskCanvas.height = newHeight;
            maskCanvas.style.width = newWidth + 'px';
            maskCanvas.style.height = newHeight + 'px';
            
            ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            // Scale the existing drawing to fit the new canvas size
            // Ensure tempCanvas drawing is scaled correctly to the new dimensions
            if (tempCanvas.width > 0 && tempCanvas.height > 0) {
                ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
            }
            resetDrawingContext();
            updateImageSizeInputs(); // Update image size inputs after resizing

            // Set the scroll position to 0,0 after resizing
            imageDisplayArea.scrollLeft = 0;
            imageDisplayArea.scrollTop = 0;
        }
    }
    
    let imageCount = 0; // Track the number of images added

    function handleImageFileAndReturnContainer(file) {
        return new Promise(resolve => {
            if (file) {
                // Ensure the file has a proper image MIME type
                let processedFile = file;
                if (!file.type.startsWith('image/') && file.type !== 'application/octet-stream') {
                    console.warn(`Unexpected file type: ${file.type}. Attempting to force to image/png.`);
                    processedFile = new File([file], file.name, { type: 'image/png' });
                } else if (file.type === 'application/octet-stream') {
                     // If it's octet-stream, try to guess or default to image/png
                    console.warn(`File type is application/octet-stream. Attempting to force to image/png.`);
                    processedFile = new File([file], file.name, { type: 'image/png' });
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadedImage.src = e.target.result;
                    uploadedImage.style.display = 'block';
                    placeholderText.style.display = 'none';
                    maskCanvas.style.display = 'block';

                    uploadedImage.onload = () => {
                        let finalWidth;
                        let finalHeight;

                        if (currentFixedSize > 0) {
                            // If a fixed size is set (e.g., by clicking Large, Medium, Small)
                            // Fit the image within the fixed square size while maintaining aspect ratio
                            const { width, height } = calculateAspectFitDimensions(uploadedImage.naturalWidth, uploadedImage.naturalHeight, currentFixedSize, currentFixedSize);
                            finalWidth = width;
                            finalHeight = height;
                        } else {
                            // If no fixed size is set, use the natural dimensions
                            finalWidth = uploadedImage.naturalWidth;
                            finalHeight = uploadedImage.naturalHeight;
                        }

                        uploadedImage.width = finalWidth;
                        uploadedImage.height = finalHeight;
                        uploadedImage.style.width = finalWidth + 'px';
                        uploadedImage.style.height = finalHeight + 'px';

                        maskCanvas.width = finalWidth;
                        maskCanvas.height = finalHeight;
                        maskCanvas.style.width = finalWidth + 'px';
                        maskCanvas.style.height = finalHeight + 'px';
                        
                        ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
                        // Draw the original image onto the canvas, scaled to fit the new canvas size
                        ctx.drawImage(uploadedImage, 0, 0, finalWidth, finalHeight);
                        resetDrawingContext();
                        // updateImageSizeInputs(); // No longer needed as inputs are disabled if fixed size is set
                        uploadedImage.style.display = 'block'; // Ensure image is visible
                        maskCanvas.style.display = 'block'; // Ensure canvas is visible
                        placeholderText.style.display = 'none'; // Hide placeholder
                    };
                    
                    // Add image to sidebar, up to a maximum of 5
                    if (imageCount < 20) {
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'image-placeholder';
                        imgContainer.style = "width: 100%; height: 100px; background-color: #ddd; display: flex; align-items: center; justify-content: center; border-radius: 5px; color: #555; overflow: hidden; position: relative;";
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style = "max-width: 100%; max-height: 100%; object-fit: contain;";
                        imgContainer.appendChild(img);

                        // Add image number
                        const imageNumberSpan = document.createElement('span');
                        imageNumberSpan.className = 'image-number';
                        // imageNumberSpan.textContent = imageCount + 1; // 1-based numbering
                        imgContainer.appendChild(imageNumberSpan);

                        // Add checkbox
                        const imageCheckbox = document.createElement('input');
                        imageCheckbox.type = 'checkbox';
                        imageCheckbox.className = 'image-checkbox';
                        imageCheckbox.id = `imageCheckbox_${imageCount + 1}`;
                        imgContainer.appendChild(imageCheckbox);

                        // Stop event propagation when checkbox is clicked
                        imageCheckbox.addEventListener('click', function(event) {
                            event.stopPropagation();
                        });

                        // Add change event listener to update numbering
                        imageCheckbox.addEventListener('change', updateImageNumbering);

                        sidebar.appendChild(imgContainer);
                        imgContainer.style.display = 'flex'; // Show the image placeholder
                        imageCount++;

                        // Add click event to sidebar image
                        imgContainer.addEventListener('click', function() {
                            // Remove active class from previous selection
                            const currentActive = document.querySelector('.image-placeholder.active');
                            if (currentActive) {
                                currentActive.classList.remove('active');
                            }
                            // Add active class to clicked image
                            imgContainer.classList.add('active');

                            uploadedImage.src = img.src;
                            uploadedImage.style.display = 'block';
                            placeholderText.style.display = 'none';
                            maskCanvas.style.display = 'block';
                            guideCanvas.style.opacity = '0'; // Hide guideCanvas when an image is selected with opacity
                            uploadedImage.onload = function() { // Use function() to access 'this'
                                let finalWidth;
                                let finalHeight;

                                if (currentFixedSize > 0) {
                                    const { width: scaledWidth, height: scaledHeight } = calculateAspectFitDimensions(this.naturalWidth, this.naturalHeight, currentFixedSize, currentFixedSize);
                                    finalWidth = scaledWidth;
                                    finalHeight = scaledHeight;
                                } else {
                                    finalWidth = this.naturalWidth;
                                    finalHeight = this.naturalHeight;
                                }

                                maskCanvas.width = finalWidth;
                                maskCanvas.height = finalHeight;
                                maskCanvas.style.width = finalWidth + 'px';
                                maskCanvas.style.height = finalHeight + 'px';

                                uploadedImage.style.width = finalWidth + 'px';
                                uploadedImage.style.height = finalHeight + 'px';
                                uploadedImage.width = finalWidth; // Also update element attributes for consistency
                                uploadedImage.height = finalHeight;

                                ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
                                // Draw the newly loaded image onto the canvas, scaled to fit
                                const offsetX = (finalWidth - finalWidth) / 2;
                                const offsetY = (finalHeight - finalHeight) / 2;
                                ctx.drawImage(uploadedImage, offsetX, offsetY, finalWidth, finalHeight); // Use uploadedImage here

                                resetDrawingContext();
                                // updateImageSizeInputs(); // No longer needed as inputs are disabled if fixed size is set
                            };
                            updateImageNumbering(); // Add this line to update numbering after image is selected
                        });
                        resolve(imgContainer); // Resolve the promise with the imgContainer
                    } else {
                        resolve(null); // If imageCount >= 20, resolve with null
                    }
                };
                reader.readAsDataURL(processedFile); // Use processedFile here
            } else {
                resolve(null); // If file is not provided, resolve with null
            }
        });
    }

    function updateImageSizeInputs() {
        if (uploadedImage.style.display !== 'none') {
            imageWidthInput.value = uploadedImage.naturalWidth;
            imageHeightInput.value = uploadedImage.naturalHeight;
        } else {
            imageWidthInput.value = 0;
            imageHeightInput.value = 0;
        }
    }

    imageUpload.addEventListener('change', function(event) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            handleImageFileAndReturnContainer(files[i]);
        }
    });
    
    window.addEventListener('resize', () => {
        // resizeCanvasToImage(); // No longer needed as we set canvas size directly
    });

    newImageBtn.addEventListener('click', () => {
        // Create a new black image (e.g., 1024x1024) - adjust to fit imageDisplayArea
        const displayAreaWidth = imageDisplayArea.offsetWidth;
        const displayAreaHeight = imageDisplayArea.offsetHeight;

        const width = parseInt(imageWidthInput.value) > 0 ? parseInt(imageWidthInput.value) : 1024;
        const height = parseInt(imageHeightInput.value) > 0 ? parseInt(imageHeightInput.value) : 1024;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCtx.fillStyle = 'black'; // Set fill style to black
        tempCtx.fillRect(0, 0, width, height);

        const imageDataUrl = tempCanvas.toDataURL('image/png');

        // Pass the new image through handleImageFileAndReturnContainer to ensure consistent MIME type handling
        handleImageFileAndReturnContainer(dataURLtoFile(imageDataUrl, `new_image_${Date.now()}.png`));
        guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height); // Clear guideCanvas
        guideCanvas.style.display = 'none'; // Hide guideCanvas
        guideCanvas.style.opacity = '0'; // Hide guideCanvas
    });

    coworkingCheckbox.addEventListener('change', () => {
        updatePrompt(); // Update prompt when Coworking checkbox changes
        if (coworkingCheckbox.checked) {
            // resizeCanvasToImage(); // No longer needed here
            // sketchCheckbox.checked = true; // Make Sketch also checked when Coworking is checked
        } else {
            // sketchCheckbox.checked = false; // Uncheck Sketch when Coworking is unchecked
        }
    });

    sketchCheckbox.addEventListener('change', () => {
        updatePrompt(); // Update prompt when Sketch checkbox changes
    });

    function draw(e) {
        if (!isDrawing) return;

        let currentDrawingCtx = ctx;

        // Check if the event is a pointer event (pen or mouse)
        if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
            // Update brush thickness based on pressure for pen, or use default for mouse
            let currentThickness = parseInt(brushThicknessSlider.value);
            if (e.pointerType === 'pen' && e.pressure > 0) {
                currentDrawingCtx.lineWidth = currentThickness * e.pressure * 2; // Scale thickness with pressure, adjust multiplier as needed
            } else {
                currentDrawingCtx.lineWidth = currentThickness; // Use default thickness for mouse or no pressure
            }
        }

        if (currentTool === 'brush' || currentTool === 'eraser') {
            currentDrawingCtx.globalCompositeOperation = (currentTool === 'brush') ? 'source-over' : 'destination-out';
            currentDrawingCtx.strokeStyle = (currentTool === 'brush') ? brushColorInput.value : 'rgba(0,0,0,1)';

            currentDrawingCtx.beginPath();
            currentDrawingCtx.moveTo(lastX, lastY);
            const { x: currentX, y: currentY } = getCanvasMouseCoords(e);
            currentDrawingCtx.lineTo(currentX, currentY);
            currentDrawingCtx.stroke();
            [lastX, lastY] = [currentX, currentY];
        } else if (currentTool === 'box') {
            guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height); // Clear previous guideline

            const { x: currentX, y: currentY } = getCanvasMouseCoords(e); // 현재 마우스 좌표
            const width = currentX - startX;
            const height = currentY - startY;

            guideCtx.strokeStyle = brushColorInput.value; // Use brush color (white/black as requested)
            guideCtx.lineWidth = 2; // Fixed guideline thickness
            guideCtx.beginPath();
            guideCtx.setLineDash([5, 5]);
            guideCtx.strokeRect(startX, startY, width, height);
            guideCtx.closePath();
            [lastX, lastY] = [currentX, currentY]; // Update for next move
        } else if (currentTool === 'text') {
            // Logic for text tool will go here
        }
    }

    function getCanvasMouseCoords(e) {
        const rect = maskCanvas.getBoundingClientRect();
        const scaleX = maskCanvas.width / rect.width;
        const scaleY = maskCanvas.height / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX + imageDisplayArea.scrollLeft;
        const mouseY = (e.clientY - rect.top) * scaleY + imageDisplayArea.scrollTop;
        return { x: mouseX, y: mouseY };
    }

    maskCanvas.addEventListener('pointerdown', (e) => {
        console.log('pointerdown'); // Add this alert
        isDrawing = true;
        const { x: mouseX, y: mouseY } = getCanvasMouseCoords(e);
        [lastX, lastY] = [mouseX, mouseY];
        if (currentTool === 'box') {
            [startX, startY] = [mouseX, mouseY];
            guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height); // Clear guideCanvas at start of drag
            guideCanvas.style.display = 'block'; // Show guideCanvas for box tool
            guideCanvas.style.opacity = '1'; // Show guideCanvas with opacity for box tool
        } else {
            // For brush/eraser, ensure guideCanvas is hidden
            guideCanvas.style.display = 'none';
            guideCanvas.style.opacity = '0';
        }
        // Prevent scrolling when drawing on touch devices
        e.preventDefault();
    });

    maskCanvas.addEventListener('pointermove', draw);
    
    maskCanvas.addEventListener('pointerup', (e) => {
        if (!isDrawing) return;
        
        if (currentTool === 'box') {
            if (savedImageData) {
                ctx.putImageData(savedImageData, 0, 0);
            }
            const { x: currentX, y: currentY } = getCanvasMouseCoords(e);
            const width = currentX - startX;
            const height = currentY - startY;
            ctx.globalCompositeOperation = 'source-over';
            
            if (e.shiftKey) { // Draw filled box if Shift is pressed
                ctx.fillStyle = brushColorInput.value;
                ctx.fillRect(startX, startY, width, height);
            } else { // Draw empty rectangle with brush thickness
                ctx.strokeStyle = brushColorInput.value;
                ctx.lineWidth = brushThicknessSlider.value; // Use brush thickness
                ctx.beginPath(); // Start a new path for the rectangle
                ctx.rect(startX, startY, width, height); // Define the rectangle path
                ctx.stroke(); // Draw the stroke
                ctx.closePath(); // Close the path
            }
            
            savedImageData = null;
            ctx.setLineDash([]); // Reset line dash
            ctx.lineWidth = brushThicknessSlider.value; // Reset line width
            guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height); // Clear guideCanvas after drawing box
            guideCanvas.style.display = 'none'; // Hide guideCanvas for box tool
            guideCanvas.style.opacity = '0'; // Hide guideCanvas with opacity for box tool
        }
        
        isDrawing = false;
    });

    maskCanvas.addEventListener('pointerleave', () => {
        isDrawing = false;
        if (currentTool === 'box') { // Add this condition
            guideCanvas.style.display = 'none';
            guideCanvas.style.opacity = '0';
        }
    });

    brushBtn.addEventListener('click', () => {
        currentTool = 'brush';
        ctx.strokeStyle = brushColorInput.value; // Set stroke style to current brush color
        ctx.globalCompositeOperation = 'source-over';
        maskCanvas.classList.remove('eraser-cursor', 'crosshair-cursor');
        maskCanvas.classList.add('brush-cursor');
        updateCursor(); // Update cursor when brush tool is selected
    });

    eraserBtn.addEventListener('click', () => {
        currentTool = 'eraser';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.globalCompositeOperation = 'destination-out';
        maskCanvas.classList.remove('brush-cursor', 'crosshair-cursor');
        maskCanvas.classList.add('eraser-cursor');
        updateCursor(); // Update cursor when eraser tool is selected
        guideCanvas.style.display = 'none'; // Hide guideCanvas for other tools
        guideCanvas.style.opacity = '0'; // Reset opacity for guideCanvas
    });

    boxBtn.addEventListener('click', () => {
        currentTool = 'box';
        ctx.globalCompositeOperation = 'source-over';
        maskCanvas.classList.remove('brush-cursor', 'eraser-cursor');
        maskCanvas.classList.add('crosshair-cursor');
        updateCursor(); // Update cursor for box tool
    });

    clearCanvasBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        resetDrawingContext();
        maskCanvas.classList.remove('brush-cursor', 'eraser-cursor');
        maskCanvas.classList.add('crosshair-cursor');
        updateCursor(); // Update cursor after clearing canvas
        guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
        guideCanvas.style.display = 'none'; // Hide guideCanvas
        guideCanvas.style.opacity = '0'; // Hide guideCanvas
    });

    // Initial cursor update
    updateCursor();

    deleteImagesBtn.addEventListener('click', () => {
        const imagePlaceholders = sidebar.querySelectorAll('.image-placeholder');
        let deletedCount = 0;
        imagePlaceholders.forEach(imgContainer => {
            const checkbox = imgContainer.querySelector('.image-checkbox');
            if (checkbox && checkbox.checked) {
                imgContainer.remove();
                deletedCount++;
            }
        });
        imageCount -= deletedCount; // Decrement imageCount by the number of deleted images
        // Optionally, re-number the remaining images if desired
        const remainingImagePlaceholders = sidebar.querySelectorAll('.image-placeholder');
        remainingImagePlaceholders.forEach((imgContainer, index) => {
            const imageNumberSpan = imgContainer.querySelector('.image-number');
            if (imageNumberSpan) {
                imageNumberSpan.textContent = index + 1; // Re-number from 1
                const checkbox = imgContainer.querySelector('.image-checkbox');
                if (checkbox) {
                    checkbox.id = `imageCheckbox_${index + 1}`;
                }
            }
        });
        updateImageNumbering(); // Add this line to update numbering after deletion

        // You might also want to clear the main display if the active image was deleted
        const currentActive = document.querySelector('.image-placeholder.active');
        if (currentActive && !document.body.contains(currentActive)) { // If active image was deleted
            uploadedImage.style.display = 'none';
            maskCanvas.style.display = 'none';
            guideCanvas.style.display = 'none'; // Hide guideCanvas
            guideCanvas.style.opacity = '0'; // Hide guideCanvas
            placeholderText.style.display = 'block';
            placeholderText.textContent = '이미지를 여기에 드롭하거나 업로드하세요';
        }
    });

    checkAllBtn.addEventListener('click', () => {
        const imageCheckboxes = sidebar.querySelectorAll('.image-checkbox');
        imageCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        updateImageNumbering();
    });

    uncheckAllBtn.addEventListener('click', () => {
        const imageCheckboxes = sidebar.querySelectorAll('.image-checkbox');
        imageCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateImageNumbering();
    });

    saveBtn.addEventListener('click', async () => {
        if (uploadedImage.style.display === 'none' || !uploadedImage.src) {
            alert('저장할 이미지가 없습니다. 먼저 이미지를 업로드하세요.');
            return;
        }

        if (imageCount >= 20) {
            alert('이미지는 최대 20개까지 저장할 수 있습니다. 기존 이미지를 삭제해주세요.');
            return;
        }

        console.log("--- Save Button Clicked ---");
        console.log("Mask Canvas Data URL:", maskCanvas.toDataURL());
        console.log("Uploaded Image Data URL:", uploadedImage.src.substring(0, 100) + "..."); // Truncate for console output

        const mergedCanvas = document.createElement('canvas');
        const mergedCtx = mergedCanvas.getContext('2d');

        mergedCanvas.width = uploadedImage.naturalWidth; // Use naturalWidth/Height for original size
        mergedCanvas.height = uploadedImage.naturalHeight;

        // Draw the original image
        mergedCtx.drawImage(uploadedImage, 0, 0, mergedCanvas.width, mergedCanvas.height);

        // Draw the mask canvas on top, ensuring it's scaled correctly
        // Calculate scaling factors to match maskCanvas to the original image dimensions
        const scaleX = uploadedImage.naturalWidth / maskCanvas.width;
        const scaleY = uploadedImage.naturalHeight / maskCanvas.height;

        // Adjust the drawing position of maskCanvas based on imageDisplayArea's scroll offset
        const drawX = -imageDisplayArea.scrollLeft * scaleX;
        const drawY = -imageDisplayArea.scrollTop * scaleY;

        mergedCtx.drawImage(maskCanvas, drawX, drawY, maskCanvas.width * scaleX, maskCanvas.height * scaleY);

        const mergedImageDataUrl = mergedCanvas.toDataURL('image/png');
        console.log("Merged Image Data URL (snippet):", mergedImageDataUrl.substring(0, 100) + "...");

        // Add the merged image to the sidebar
        handleImageFileAndReturnContainer(dataURLtoFile(mergedImageDataUrl, `merged_image_${imageCount + 1}.png`));
        updateImageNumbering(); // Add this line to update numbering after saving
        console.log("--- Save Process Finished ---");
    });

    downloadBtn.addEventListener('click', async () => {
        const imagePlaceholders = sidebar.querySelectorAll('.image-placeholder');
        let checkedImages = 0;
        for (const imgContainer of imagePlaceholders) {
            const checkbox = imgContainer.querySelector('.image-checkbox');
            if (checkbox && checkbox.checked) {
                checkedImages++;
                const img = imgContainer.querySelector('img');
                if (img) {
                    const imageUrl = img.src;
                    const a = document.createElement('a');
                    a.href = imageUrl;
                    a.download = `downloaded_image_${Date.now()}.png`; // Unique filename
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
        }
        if (checkedImages === 0) {
            alert('다운로드할 이미지를 선택해주세요.');
        }
    });

    saveDemoBtn.addEventListener('click', async () => {
        const demoTitle = prompt("저장할 데모의 제목을 입력하세요:");
        if (!demoTitle) {
            alert("데모 제목이 필요합니다.");
            return;
        }

        const promptText = document.getElementById('fixedPromptHeader').value + document.getElementById('promptTextarea').value;
        const imagePlaceholders = sidebar.querySelectorAll('.image-placeholder');
        const selectedImagesData = [];

        for (const imgContainer of imagePlaceholders) {
            const checkbox = imgContainer.querySelector('.image-checkbox');
            if (checkbox && checkbox.checked) {
                const img = imgContainer.querySelector('img');
                if (img) {
                    const base64Image = await getImageBase64(img);
                    selectedImagesData.push(base64Image);
                }
            }
        }

        if (selectedImagesData.length === 0) {
            alert("데모에 저장할 이미지를 하나 이상 선택해주세요.");
            return;
        }

        textResponseArea.textContent = 'Saving demo...';

        try {
            const response = await fetch('/save_nano_banana_demo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: demoTitle,
                    fixed_prompt_header: document.getElementById('fixedPromptHeader').value, // Send separately
                    main_prompt: document.getElementById('promptTextarea').value, // Send separately
                    images: selectedImagesData
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            textResponseArea.textContent = `Demo saved successfully: ${result.message}`;
            alert('데모가 성공적으로 저장되었습니다!');

        } catch (error) {
            console.error('Save Demo API failed:', error);
            textResponseArea.textContent = `Error saving demo: ${error.message}`;
            alert(`데모 저장 중 오류 발생: ${error.message}`);
        }
    });

    function dataURLtoFile(dataurl, filename) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    }

    // Function to load a demo
    async function loadDemo(demo) {
        // Clear existing images in the sidebar
        sidebar.querySelectorAll('.image-placeholder').forEach(img => img.remove());
        imageCount = 0; // Reset image count
        
        // Set the prompt
        const fixedPromptHeaderInput = document.getElementById('fixedPromptHeader');
        const promptTextarea = document.getElementById('promptTextarea');

        if (demo.fixed_prompt_header !== undefined && demo.main_prompt !== undefined) {
            fixedPromptHeaderInput.value = demo.fixed_prompt_header;
            promptTextarea.value = demo.main_prompt;
        } else if (demo.prompt !== undefined) {
            // Fallback for old demo format where prompt was combined
            fixedPromptHeaderInput.value = ""; // Clear header for old format
            promptTextarea.value = demo.prompt; // Put entire prompt into main textarea
        } else {
            fixedPromptHeaderInput.value = "Create an image that is, "; // Default if no prompt data
            promptTextarea.value = "";
        }

        // Load images into the image panel and check them
        for (const imageUrl of demo.images) {
            try {
                const response = await fetch(`/get_gcs_image?gcs_path=${encodeURIComponent(imageUrl)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }
                const imageBlob = await response.blob();
                const file = new File([imageBlob], 'demo_image.png', { type: imageBlob.type });
                const imgContainer = await handleImageFileAndReturnContainer(file);
                if (imgContainer) {
                    const checkbox = imgContainer.querySelector('.image-checkbox');
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                    imgContainer.classList.add('active'); // Set the loaded image as active
                }
            } catch (error) {
                console.error(`Error loading image ${imageUrl}:`, error);
            }
        }
        updateImageNumbering();
    }

    // Helper function to calculate dimensions to fit within a max size while maintaining aspect ratio
    function calculateAspectFitDimensions(naturalWidth, naturalHeight, maxWidth, maxHeight) {
        let newWidth = naturalWidth;
        let newHeight = naturalHeight;

        if (naturalWidth > maxWidth) {
            newHeight = (maxWidth / naturalWidth) * naturalHeight;
            newWidth = maxWidth;
        }

        if (newHeight > maxHeight) {
            newWidth = (maxHeight / newHeight) * newWidth;
            newHeight = maxHeight;
        }
        return { width: newWidth, height: newHeight };
    }

    // Function to convert image src to Base64
    async function getImageBase64(imgElement) {
        if (!imgElement.src || imgElement.src.startsWith('data:')) {
            return imgElement.src ? imgElement.src : '';
        }
        const response = await fetch(imgElement.src);
        const blob = await response.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result;
                resolve(`data:${blob.type};base64,${dataUrl.split(',' )[1]}`);
            };
            reader.readAsDataURL(blob);
        });
    }

    imageDisplayArea.addEventListener('dragover', function(event) {
        event.preventDefault();
        imageDisplayArea.style.borderColor = '#007bff';
    });

    imageDisplayArea.addEventListener('dragleave', function(event) {
        event.preventDefault();
        imageDisplayArea.style.borderColor = '#ccc';
    });

    imageDisplayArea.addEventListener('drop', function(event) {
        event.preventDefault();
        imageDisplayArea.style.borderColor = '#ccc';
        const files = event.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
            handleImageFileAndReturnContainer(files[i]);
        }
    });

    placeholderText.addEventListener('click', function() {
        imageUpload.click();
    });

    generateBtn.addEventListener('click', async () => {
        const fixedPromptHeader = document.getElementById('fixedPromptHeader').value;
        const userPromptText = document.getElementById('promptTextarea').value;
        const promptText = fixedPromptHeader + userPromptText; // Combine fixed header with user input

        // Save prompt to local storage
        if (promptText.trim()) {
            const MAX_PROMPT_HISTORY = 20;
            let promptHistory = JSON.parse(localStorage.getItem('promptHistory') || '[]');
            promptHistory.push({ timestamp: new Date().toISOString(), header: fixedPromptHeader, prompt: userPromptText });
            if (promptHistory.length > MAX_PROMPT_HISTORY) {
                promptHistory = promptHistory.slice(promptHistory.length - MAX_PROMPT_HISTORY);
            }
            localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
        }

        const imagePlaceholders = sidebar.querySelectorAll('.image-placeholder');
        
        updateImageNumbering(); // Ensure numbering is updated before collecting images

        const selectedImagesData = [];

        // Add this new condition for non-coworking mode without selected images
        if (!coworkingCheckbox.checked) {
            const anyImageSelected = sidebar.querySelectorAll('.image-placeholder .image-checkbox:checked').length > 0;
            if (!anyImageSelected) {
                const confirmGenerate = confirm('선택된 이미지가 없습니다. 이미지를 선택하지 않고 생성을 계속하시겠습니까?');
                if (!confirmGenerate) {
                    textResponseArea.textContent = '이미지 생성이 취소되었습니다.';
                    return; // Stop generation if user cancels
                }
            }
        }

        if (coworkingCheckbox.checked) {
            if (imageCount >= 20) { // Check image limit before generating a new image
                alert('이미지는 최대 20개까지 저장할 수 있습니다. 기존 이미지를 삭제해주세요.');
                placeholderText.style.display = 'block';
                placeholderText.textContent = '이미지를 여기에 드롭하거나 업로드하세요';
                uploadedImage.style.display = 'none';
                maskCanvas.style.display = 'none';
                guideCanvas.style.opacity = '0'; // Hide guideCanvas with opacity
                return; // Stop generation
            }
            if (uploadedImage.style.display !== 'none' && uploadedImage.src) {
                const mergedCanvas = document.createElement('canvas');
                const mergedCtx = mergedCanvas.getContext('2d');

                mergedCanvas.width = uploadedImage.naturalWidth;
                mergedCanvas.height = uploadedImage.naturalHeight;

                mergedCtx.drawImage(uploadedImage, 0, 0, mergedCanvas.width, mergedCanvas.height);

                // Draw the mask canvas on top, ensuring it's scaled correctly
                const scaleX = mergedCanvas.width / maskCanvas.width;
                const scaleY = mergedCanvas.height / maskCanvas.height;

                const drawX = -imageDisplayArea.scrollLeft * scaleX;
                const drawY = -imageDisplayArea.scrollTop * scaleY;

                mergedCtx.drawImage(maskCanvas, drawX, drawY, maskCanvas.width * scaleX, maskCanvas.height * scaleY);

                const mergedImageDataUrl = mergedCanvas.toDataURL('image/png');

                // Add the merged image to the sidebar and get the new image container
                const newImgContainer = await handleImageFileAndReturnContainer(dataURLtoFile(mergedImageDataUrl, `coworking_image_${imageCount + 1}.png`));
                
                if (newImgContainer) { // Check if newImgContainer is not null
                    // Uncheck all other images and check only the newly added one
                    const allCheckboxes = sidebar.querySelectorAll('.image-checkbox');
                    allCheckboxes.forEach(cb => {
                        if (cb !== newImgContainer.querySelector('.image-checkbox')) {
                            cb.checked = false;
                        }
                    });
                    newImgContainer.querySelector('.image-checkbox').checked = true;
                    updateImageNumbering(); // Update numbering after changing checkboxes

                    // Use the newly added image as the only selected image for generation
                    selectedImagesData.push(mergedImageDataUrl);
                } else {
                    alert('이미지는 최대 20개까지 저장할 수 있습니다. 기존 이미지를 삭제해주세요.');
                    placeholderText.style.display = 'block';
                    placeholderText.textContent = '이미지를 여기에 드롭하거나 업로드하세요';
                    uploadedImage.style.display = 'none';
                    maskCanvas.style.display = 'none';
                    guideCanvas.style.opacity = '0'; // Hide guideCanvas with opacity
                    return; // Stop generation if image cannot be saved
                }
            }
        } else {
            for (const imgContainer of imagePlaceholders) {
                const checkbox = imgContainer.querySelector('.image-checkbox');
                if (checkbox && checkbox.checked) {
                    const img = imgContainer.querySelector('img');
                    if (img) {
                        const base64Image = await getImageBase64(img);
                        selectedImagesData.push(base64Image);
                    }
                }
            }
        }
        
        if (!promptText.trim()) {
            alert('프롬프트를 입력해주세요.');
            textResponseArea.textContent = '프롬프트가 비어있습니다.';
            return; // Stop generation if prompt is empty
        }

        console.log("Selected images data sent to server:", selectedImagesData.length, "images");
        if (selectedImagesData.length > 0) {
            console.log("First image data (snippet):", selectedImagesData[0].substring(0, 100));
        }

        textResponseArea.textContent = 'Generating...'; // Show generating message in text response area

        try {
            const response = await fetch('/generate_nano_banana', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: promptText,
                    images: selectedImagesData
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response error:', response.status, errorText);
                
                // If it's an authentication error, provide a helpful message
                if (response.status === 401) {
                    throw new Error(`인증 오류 (401): 이 기능을 사용하려면 인증이 필요합니다.\n\n가능한 원인:\n1. Cloud Run 서비스가 인증을 요구하도록 설정되어 있습니다.\n2. IAP(Identity-Aware Proxy)가 활성화되어 있습니다.\n\n해결 방법:\n- Cloud Run 콘솔에서 "Allow unauthenticated invocations" 설정을 활성화하세요.\n- 또는 관리자에게 문의하세요.\n\n상세 오류: ${errorText}`);
                }
                
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let result = '';
            let firstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                result += chunk;

                // SSE 형식 데이터 파싱 및 처리
                const lines = result.split('\n\n');
                result = lines.pop(); // 마지막 불완전한 라인은 다음 청크를 위해 남겨둡니다.

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        try {
                            const data = JSON.parse(jsonStr);
                            if (firstChunk) {
                                placeholderText.style.display = 'none';
                                firstChunk = false;
                            }

                            if (data.type === 'image_url') {
                                // Directly add the generated image to the sidebar
                                if (imageCount < 20) { // Check image limit before adding
                                    fetch(data.url)
                                        .then(res => res.blob())
                                        .then(blob => {
                                            const file = new File([blob], `generated_image_${imageCount + 1}.png`, { type: 'image/png' });
                                            handleImageFileAndReturnContainer(file);
                                        })
                                        .catch(error => console.error('Error fetching generated image:', error));
                                } else {
                                    alert('이미지는 최대 20개까지 저장할 수 있습니다. 기존 이미지를 삭제해주세요.');
                                }
                                guideCanvas.style.opacity = '0'; // Hide guideCanvas after image generation with opacity
                            } else if (data.type === 'text') {
                                console.log("Generated Text: ", data.data);
                                textResponseArea.textContent += data.data;
                            } else if (data.type === 'error') {
                                textResponseArea.textContent = `Error: ${data.data}`;
                                reader.cancel();
                                return;
                            } else if (data.type === 'stream_end') {
                                console.log("Stream End Message: ", data.data);
                                textResponseArea.textContent += `\n${data.data}`;
                                console.log("Stream end message displayed.");
                            }
                        } catch (parseError) {
                            console.error('JSON 파싱 오류:', parseError, '데이터:', jsonStr);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Fetch API failed:', error);
            textResponseArea.textContent = `An error occurred: ${error.message}`;
        } finally {
            // 최종 처리 (필요한 경우)
        }
    });

    pastedImageContainer.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('resizer')) { // Only drag if not clicking on a resizer
            isDragging = true;
            initialX = e.clientX;
            initialY = e.clientY;
            initialLeft = pastedImageContainer.offsetLeft;
            initialTop = pastedImageContainer.offsetTop;
            pastedImageContainer.style.cursor = 'grabbing';
        }
    });

    // Resizing logic
    let activeResizer = null;

    pastedImageContainer.querySelectorAll('.resizer').forEach(resizer => {
        resizer.addEventListener('mousedown', (e) => {
            activeResizer = e.target;
            isResizing = true;
            initialX = e.clientX;
            initialY = e.clientY;
            initialWidth = pastedImageContainer.offsetWidth;
            initialHeight = pastedImageContainer.offsetHeight;
            initialLeft = pastedImageContainer.offsetLeft; // Store initial left
            initialTop = pastedImageContainer.offsetTop; // Store initial top
            e.stopPropagation(); // Prevent dragging from starting
        });
    });

    imageDisplayArea.addEventListener('mousemove', (e) => {
        if (isResizing && activeResizer) {
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;

            let newWidth = initialWidth;
            let newHeight = initialHeight;
            let newLeft = initialLeft;
            let newTop = initialTop;

            if (activeResizer.classList.contains('bottom-right')) {
                newWidth = initialWidth + dx;
                newHeight = initialHeight + dy;
            } else if (activeResizer.classList.contains('bottom-left')) {
                newWidth = initialWidth - dx;
                newLeft = initialLeft + dx;
                newHeight = initialHeight + dy;
            } else if (activeResizer.classList.contains('top-right')) {
                newWidth = initialWidth + dx;
                newHeight = initialHeight - dy;
                newTop = initialTop + dy;
            } else if (activeResizer.classList.contains('top-left')) {
                newWidth = initialWidth - dx;
                newLeft = initialLeft + dx;
                newHeight = initialHeight - dy;
                newTop = initialTop + dy;
            }

            // Apply new dimensions and position
            pastedImageContainer.style.width = newWidth + 'px';
            pastedImageContainer.style.height = newHeight + 'px';
            pastedImageContainer.style.left = newLeft + 'px';
            pastedImageContainer.style.top = newTop + 'px';
        }
        // Existing dragging logic
        if (isDragging) {
            e.preventDefault();
            pastedImageContainer.style.left = (initialLeft + (e.clientX - initialX)) + 'px';
            pastedImageContainer.style.top = (initialTop + (e.clientY - initialY)) + 'px';
        }
    });

    imageDisplayArea.addEventListener('mouseup', () => {
        isResizing = false;
        activeResizer = null;
        isDragging = false;
        pastedImageContainer.style.cursor = 'grab';
    });

    pastedImageContainer.addEventListener('dblclick', () => {
        if (uploadedImage.style.display === 'none' || !uploadedImage.src) {
            alert('마스크 캔버스에 붙여넣기 전에 이미지를 업로드하거나 새로 만드세요.');
            return;
        }

        if (pastedImageContainer.style.display === 'block' && pastedImage.src) {
            const img = new Image();
            img.onload = () => {
                const containerRect = pastedImageContainer.getBoundingClientRect();
                const displayAreaRect = imageDisplayArea.getBoundingClientRect();

                const x = containerRect.left - displayAreaRect.left;
                const y = containerRect.top - displayAreaRect.top;
                const width = containerRect.width;
                const height = containerRect.height;

                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(img, x, y, width, height);
                pastedImageContainer.style.display = 'none'; // Hide pasted image after drawing
                pastedImage.src = '#'; // Clear pasted image source
            };
            img.src = pastedImage.src;
        }
    });

    imageDisplayArea.addEventListener('paste', async (event) => {
        const items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = function(e) {
                    pastedImage.src = e.target.result;
                    pastedImage.onload = () => {
                        pastedImageContainer.style.display = 'block';
                        pastedImageContainer.style.left = '0px';
                        pastedImageContainer.style.top = '0px';
                        // Set initial width/height, capping at imageDisplayArea's size if necessary
                        const maxWidth = imageDisplayArea.offsetWidth;
                        const maxHeight = imageDisplayArea.offsetHeight;

                        let newWidth = pastedImage.naturalWidth;
                        let newHeight = pastedImage.naturalHeight;

                        if (newWidth > maxWidth) {
                            newHeight = (maxWidth / newWidth) * newHeight;
                            newWidth = maxWidth;
                        }
                        if (newHeight > maxHeight) {
                            newWidth = (maxHeight / newHeight) * newWidth;
                            newHeight = maxHeight;
                        }
                        
                        pastedImageContainer.style.width = newWidth + 'px';
                        pastedImageContainer.style.height = newHeight + 'px';
                    };
                };
                reader.readAsDataURL(blob);
                event.preventDefault(); // Prevent default paste behavior
                break;
            }
        }
    });

    loadDemoBtn.addEventListener('click', async () => {
        loadDemoModal.style.display = 'flex'; // Show the modal
        demoList.innerHTML = 'Loading demos...';

        try {
            const response = await fetch('/list_nano_banana_demos');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const demos = await response.json();

            demoList.innerHTML = ''; // Clear loading message
            if (demos.length === 0) {
                demoList.innerHTML = '<p>No demos available.</p>';
            } else {
                demos.forEach(demo => {
                    const demoItem = document.createElement('div');
                    demoItem.className = 'demo-item';
                    
                    let displayPrompt = '';
                    if (demo.main_prompt) {
                        displayPrompt = demo.main_prompt;
                    } else if (demo.prompt) {
                        displayPrompt = demo.prompt;
                    } else {
                        displayPrompt = 'No prompt available.';
                    }

                    demoItem.innerHTML = `
                        <h4>${demo.title}</h4>
                        <p>Prompt: ${displayPrompt.substring(0, 100)}...</p>
                        <p>Images: ${demo.images.length}</p>
                        <p>Saved: ${new Date(demo.timestamp).toLocaleString()}</p>
                    `;
                    demoItem.addEventListener('click', () => {
                        alert(`Loading demo: ${demo.title}`);
                        if (demo.images.length > 0) {
                            console.log("Selected GCS Image Path:", demo.images[0]);
                            loadDemo(demo);
                        }
                        loadDemoModal.style.display = 'none'; // Close modal after selection
                    });
                    demoList.appendChild(demoItem);
                });

                // Add search functionality
                demoSearchInput.addEventListener('keyup', () => {
                    const searchTerm = demoSearchInput.value.toLowerCase();
                    demoList.querySelectorAll('.demo-item').forEach(item => {
                        const title = item.querySelector('h4').textContent.toLowerCase();
                        const prompt = item.querySelector('p:nth-of-type(1)').textContent.toLowerCase();
                        if (title.includes(searchTerm) || prompt.includes(searchTerm)) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading demos:', error);
            demoList.innerHTML = `<p style="color: red;">Error loading demos: ${error.message}</p>`;
        }
    });

    closeButton.addEventListener('click', () => {
        loadDemoModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == loadDemoModal) {
            loadDemoModal.style.display = 'none';
        }
    });

    // Close modal with Escape key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && loadDemoModal.style.display === 'flex') {
            event.stopPropagation();
            loadDemoModal.style.display = 'none';
        }
    });

    pasteFromClipboardBtn.addEventListener('click', async () => {
        try {
            const permission = await navigator.permissions.query({ name: "clipboard-read" });
            if (permission.state === "denied") {
                alert("클립보드 읽기 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.");
                return;
            }

            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                if (item.types.includes("image/png")) {
                    const blob = await item.getType("image/png");
                    handleImageFileAndReturnContainer(new File([blob], `clipboard_image_${Date.now()}.png`, { type: "image/png" }));
                    return; // Process only the first image found
                }
            }
            alert("클립보드에 이미지 데이터가 없습니다.");
        } catch (error) {
            console.error("클립보드에서 이미지 붙여넣기 실패:", error);
            alert(`클립보드에서 이미지를 붙여넣는 데 실패했습니다: ${error.message}. 브라우저가 클립보드 이미지 액세스를 지원하는지 확인하거나, 권한을 허용해주세요.`);
        }
    });

    // Add event listeners to guideCanvas as well
    guideCanvas.addEventListener('pointerdown', (e) => {
        isDrawing = true;
        const { x: mouseX, y: mouseY } = getCanvasMouseCoords(e);
        [lastX, lastY] = [mouseX, mouseY];
        if (currentTool === 'box') {
            [startX, startY] = [mouseX, mouseY];
            guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height); // Clear guideCanvas at start of drag
            guideCanvas.style.display = 'block'; // Show guideCanvas for box tool
            guideCanvas.style.opacity = '1'; // Show guideCanvas with opacity for box tool
        }
        e.preventDefault();
    });

    guideCanvas.addEventListener('pointermove', draw);

    guideCanvas.addEventListener('pointerup', (e) => {
        if (!isDrawing) return;
        
        if (currentTool === 'box') {
            guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height); // Clear guideCanvas after drawing box
            guideCanvas.style.display = 'none'; // Hide guideCanvas for box tool
            guideCanvas.style.opacity = '0'; // Hide guideCanvas with opacity for box tool
        }
        
        isDrawing = false;
    });

    guideCanvas.addEventListener('pointerleave', () => isDrawing = false);

    // Function to load and display prompt history
    function loadPromptHistory() {
        promptHistoryList.innerHTML = ''; // Clear previous entries
        let promptHistory = JSON.parse(localStorage.getItem('promptHistory') || '[]');

        if (promptHistory.length === 0) {
            promptHistoryList.innerHTML = '<p>No prompt history available.</p>';
            return;
        }

        promptHistory.slice().reverse().forEach((entry, index) => { // Show newest first
            const historyItem = document.createElement('div');
            historyItem.className = 'demo-item';
            historyItem.innerHTML = `
                <h4>${entry.header ? entry.header : ''} ${entry.prompt.substring(0, 100)}...</h4>
                <p>Saved: ${new Date(entry.timestamp).toLocaleString()}</p>
            `;
            historyItem.addEventListener('click', () => {
                document.getElementById('fixedPromptHeader').value = entry.header;
                document.getElementById('promptTextarea').value = entry.prompt;
                promptHistoryModal.style.display = 'none'; // Close modal after loading
            });
            promptHistoryList.appendChild(historyItem);
        });

        // Add search functionality for prompt history
        promptHistorySearchInput.addEventListener('keyup', () => {
            const searchTerm = promptHistorySearchInput.value.toLowerCase();
            promptHistoryList.querySelectorAll('.demo-item').forEach(item => {
                const titleAndPrompt = item.querySelector('h4').textContent.toLowerCase();
                if (titleAndPrompt.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Event listeners for prompt history modal
    closePromptHistoryButton.addEventListener('click', () => {
        promptHistoryModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == promptHistoryModal) {
            promptHistoryModal.style.display = 'none';
        }
    });

    // Close modal with Escape key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && promptHistoryModal.style.display === 'flex') {
            event.stopPropagation();
            promptHistoryModal.style.display = 'none';
        }
    });

    // Open prompt history modal on F1 key press
    document.addEventListener('keydown', (event) => {
        if (event.key === 'F1') {
            event.preventDefault(); // Prevent default browser help
            loadPromptHistory();
            promptHistoryModal.style.display = 'flex';
        }
    });
});

