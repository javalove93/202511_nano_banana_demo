import os
import io
import base64 # Import base64
from dotenv import load_dotenv
from flask import Flask, request, render_template, send_file, jsonify # Import jsonify
from werkzeug.utils import secure_filename
from PIL import Image as PIL_Image
from google import genai
import traceback # Import traceback
from google.genai.types import (
    EditImageConfig,
    Image,
    MaskReferenceConfig,
    MaskReferenceImage,
    RawReferenceImage,
)

from app_nano_banana import nano_banana_bp
from app_admin import admin_bp
import logging # Add this line

# .env 파일에서 환경 변수 로드
load_dotenv()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

# Set up basic logging for the Flask app
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
app.logger.setLevel(logging.INFO)

# Ensure Werkzeug logger outputs to console
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
werkzeug_logger.addHandler(handler)

app.register_blueprint(nano_banana_bp)
app.register_blueprint(admin_bp)

# 환경 변수에서 프로젝트 ID 가져오기
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
LOCATION = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")

if not PROJECT_ID:
    raise ValueError("GOOGLE_CLOUD_PROJECT_ID 환경 변수가 설정되지 않았습니다.")

# GenAI 클라이언트 초기화
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

generation_model = "imagen-3.0-generate-002"
edit_model = "imagen-3.0-capability-002"
# edit_model = "imagen@4.0"

# 허용된 파일 확장자를 확인하는 헬퍼 함수 (더 이상 사용하지 않으므로 제거합니다.)
# def allowed_file(filename):
#     print(f"Checking allowed_file for filename: {filename}")
#     if '.' not in filename:
#         print(f"Filename '{filename}' has no dot. Returning False.")
#         return False
    
#     ext = filename.rsplit('.', 1)[1].lower()
#     print(f"Extracted extension: {ext}")
#     print(f"Allowed extensions: {app.config['ALLOWED_EXTENSIONS']}")
#     is_allowed = ext in app.config['ALLOWED_EXTENSIONS']
#     print(f"Is extension '{ext}' in allowed extensions? {is_allowed}")
#     return is_allowed

# PIL Image 객체에서 바이트를 가져오는 헬퍼 함수
def get_bytes_from_pil(image: PIL_Image) -> bytes:
    byte_io_png = io.BytesIO()
    image.save(byte_io_png, "PNG")
    return byte_io_png.getvalue()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/edit_image', methods=['POST'])
def edit_image():
    data = request.json
    if not data:
        return "Invalid JSON data", 400

    original_image_base64 = data.get('original_image')
    mask_image_base64 = data.get('mask_image')
    edit_prompt = data.get('edit_prompt', "put a human hand")
    edit_mode = data.get('edit_mode', "EDIT_MODE_INPAINT_INSERTION") # Get the edit mode, default to INPAINT_INSERTION

    if not original_image_base64:
        return "원본 이미지가 제공되지 않았습니다.", 400
    if not mask_image_base64:
        return "마스크 이미지가 제공되지 않았습니다.", 400

    try:
        # Base64 데이터 디코딩
        original_image_bytes = base64.b64decode(original_image_base64)
        mask_image_bytes = base64.b64decode(mask_image_base64)

        # BytesIO로 감싸서 PIL Image로 로드
        original_image_pil = PIL_Image.open(io.BytesIO(original_image_bytes)).convert("RGB")
        mask_image_pil = PIL_Image.open(io.BytesIO(mask_image_bytes)).convert("L")

    except Exception as e:
        return f"이미지 파일 로드 오류: {e}", 400

    user_original_image = Image(image_bytes=original_image_bytes)
    user_provided_mask_image = Image(image_bytes=mask_image_bytes)

    # Mask Mode	Description
    # MASK_MODE_FOREGROUND	Automatically generates a mask to select the primary, most salient object(s) in the image.   This is the mode from your code snippet. 
    # MASK_MODE_BACKGROUND	Automatically generates a mask for the background of the image, which is useful for tasks like background replacement.
    # MASK_MODE_SEMANTIC	Automatically generates a mask based on specific object categories you define using segmentation_classes.   For example, you can specify classes like "car" or "bicycle" to mask only those objects. 
    # MASK_MODE_USER_PROVIDED	This mode indicates that you are supplying your own binary mask image.   The model will use this exact mask to perform the edit. 
    # mask_dilation: The mask_dilation parameter you included is also very relevant. It allows you to expand the border of the generated or provided mask by a certain percentage. This is particularly useful for ensuring that the mask fully covers the intended object, especially around thin or detailed areas, preventing an imperfect edit. 

    raw_ref_image_interactive = RawReferenceImage(reference_image=user_original_image, reference_id=0)
    mask_ref_image_interactive = MaskReferenceImage(
        reference_id=1,
        reference_image=user_provided_mask_image,
        config=MaskReferenceConfig(
            mask_mode="MASK_MODE_USER_PROVIDED",
            mask_dilation=0.1,
        ),
    )

    # Edit Mode	Description
    # EDIT_MODE_INPAINT_INSERTION   Adds an object to a specified masked area based on the text prompt.   
    # EDIT_MODE_INPAINT_REMOVAL	    Removes an object from a specified masked area and fills it in with the surrounding background.   
    # EDIT_MODE_OUTPAINT	        Expands the content of an image into a larger area, guided by the text prompt.   
    # EDIT_MODE_BGSWAP	            Swaps the background of an image while preserving the foreground object, which is useful for product image editing.   
    # EDIT_MODE_CONTROLLED_EDITING	Creates a new image guided by a control signal image (like a canny edge or a scribble) and a text prompt. 

    try:
        edited_image_with_interactive_mask = client.models.edit_image(
            model=edit_model,
            prompt=edit_prompt,
            reference_images=[raw_ref_image_interactive, mask_ref_image_interactive],
            config=EditImageConfig(
                edit_mode=edit_mode, # Use the dynamic edit_mode
                number_of_images=1,
                safety_filter_level="BLOCK_FEW_ADULT",
                person_generation="ALLOW_ALL",
            ),
        )
        
        # generated_images가 None이거나 비어 있는지 확인
        if not edited_image_with_interactive_mask.generated_images:
            raise ValueError("GenAI 모델에서 생성된 이미지가 없습니다.")

        edited_pil_image = edited_image_with_interactive_mask.generated_images[0].image._pil_image

        # 편집된 이미지를 Base64로 인코딩하여 클라이언트에 반환
        img_byte_arr = io.BytesIO()
        edited_pil_image.save(img_byte_arr, format='PNG')
        edited_image_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')

        return jsonify({"edited_image_base64": edited_image_base64}), 200

    except Exception as e:
        # 오류 발생 시 스택 트레이스 출력
        app.logger.error("이미지 편집 중 오류 발생:", exc_info=True)
        return jsonify({"error": f"이미지 편집 중 오류 발생: {e}", "details": traceback.format_exc()}), 500

if __name__ == '__main__':
    # 'uploads' 폴더가 없으면 생성 (더 이상 사용하지 않으므로 제거)
    # if not os.path.exists(app.config['UPLOAD_FOLDER']):
    #     os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug=True, host='0.0.0.0', port=5000)
