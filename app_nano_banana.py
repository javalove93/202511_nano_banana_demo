from flask import Blueprint, render_template, request, Response, send_from_directory, after_this_request, current_app
import json
import os
import base64
import mimetypes
import uuid
from PIL import Image
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Import Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore, storage
from google.cloud import storage as gcs

nano_banana_bp = Blueprint('nano_banana_bp', __name__, template_folder='templates')

LOCAL_CACHE = "/tmp/images"
os.makedirs(LOCAL_CACHE, exist_ok=True)

# .env 파일에서 환경 변수 로드
load_dotenv()

FIRESTORE_COLLECTION_ID = os.environ.get('FIRESTORE_COLLECTION_ID', 'nanobanana')
FIRESTORE_DATABASE_ID = os.environ.get('FIRESTORE_DATABASE_ID')

def parse_gcs_path(gcs_path):
    if gcs_path.startswith("gs://"):
        path_parts = gcs_path[len("gs://"):].split("/", 1)
        bucket_name = path_parts[0]
        folder_prefix = path_parts[1] + "/" if len(path_parts) > 1 else ""
        return bucket_name, folder_prefix
    return gcs_path, "" # Assume it's just a bucket name if no gs:// prefix

# Get GCS path from environment variable and parse it
gcs_full_path = os.environ.get('SHOWCASE_GCS_PATH')
if not gcs_full_path:
    raise ValueError("SHOWCASE_GCS_PATH environment variable is not set.")
gcs_bucket_name, gcs_folder_prefix = parse_gcs_path(gcs_full_path)

# Initialize Firebase Admin SDK if not already initialized
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        'projectId': os.environ.get('GOOGLE_CLOUD_PROJECT_ID'),
        'storageBucket': gcs_bucket_name # Use parsed bucket name
    })

if FIRESTORE_DATABASE_ID:
    db = firestore.client(database_id=FIRESTORE_DATABASE_ID)
else:
    db = firestore.client()
gcs_client = gcs.Client()


@nano_banana_bp.route('/nano_banana')
def index():
    return render_template('nano_banana.html')


def save_binary_file(file_name, data, directory=None, logger=None):
    target_path = os.path.join(directory if directory else ".", file_name)
    try:
        f = open(target_path, "wb")
        f.write(data)
        f.close()
        if logger:
            logger.info(f"File saved to: {target_path}")
        else:
            print(f"File saved to: {target_path}")
        return target_path
    except Exception as e:
        if logger:
            logger.error(f"Error saving file {target_path}: {e}")
        else:
            print(f"Error saving file {target_path}: {e}")


@nano_banana_bp.route('/generate_nano_banana', methods=['POST'])
def generate_nano_banana():
    app_logger = current_app.logger # Get the logger from the app context
    app_logger.info("Starting image generation process...")
    data = request.get_json()
    prompt = data.get('prompt')
    images_data = data.get('images', [])
    app_logger.info(f"Num of images: {len(images_data)}")

    parts = [types.Part.from_text(text=prompt)]
    for image_data in images_data:
        # data:image/png;base64,xxxxx
        header, encoded = image_data.split(",", 1)
        raw_mime_type = header.split(";", 1)[0].split(":", 1)[1]
        image_bytes = base64.b64decode(encoded)

        # Use the raw_mime_type directly as it should now be correct from the client
        mime_type = raw_mime_type

        app_logger.info(f"Preparing image part for AI: MIME type={mime_type}, data_start={image_bytes[:30].hex()}...")
        parts.append(types.Part.from_bytes(mime_type=mime_type, data=image_bytes))

    def generate_stream(app_logger_internal):
        image_result_count = 0 # Initialize a counter for generated images
        try:
            client = genai.Client(vertexai=True, project=os.environ.get('GOOGLE_CLOUD_PROJECT_ID'), location=os.environ.get('LOCATION'))
            model = "gemini-2.5-flash-image-preview"
            contents = [types.Content(role="user", parts=parts)]
            generate_content_config = types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            )

            # Currently brand new image size is fixed as 1024x1024
            # otherwise, it will be dependent on reference images size
            app_logger_internal.info(f"Generating content with model: {model}, prompt: {prompt[:50]}...")
            for chunk in client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=generate_content_config,
            ):
                if (
                    chunk.candidates is None
                    or chunk.candidates[0].content is None
                    or chunk.candidates[0].content.parts is None
                ):
                    continue

                app_logger_internal.info("Processing a new content part from AI chunk.")
                part = chunk.candidates[0].content.parts[0]
                if part.inline_data:
                    app_logger_internal.info(f"Part content type: Image, MIME: {part.inline_data.mime_type}")
                elif part.text:
                    app_logger_internal.info(f"Part content type: Text, Data: {part.text[:50]}...")
                else:
                    app_logger_internal.info(f"Part content type: Unknown")

                if part.inline_data and part.inline_data.data:
                    mime_type = part.inline_data.mime_type

                    # Save the generated image to a file
                    image_result_count += 1
                    file_extension = mimetypes.guess_extension(mime_type) or '.bin'
                    # Use UUID for filename
                    uuid_filename = f"{uuid.uuid4()}{file_extension}"
                    saved_path = save_binary_file(uuid_filename, part.inline_data.data, directory=LOCAL_CACHE, logger=app_logger_internal)
                    
                    if saved_path:
                        app_logger_internal.info(f"AI generated image saved as: {saved_path}")
                        try:
                            with Image.open(saved_path) as img:
                                app_logger_internal.info(f"Generated Image Size (backend): {img.width}x{img.height}")
                        except Exception as img_err:
                            app_logger_internal.error(f"Error getting image size with Pillow: {img_err}")
                        # Return the URL to the client instead of binary data
                        response_data = json.dumps({"type": "image_url", "url": f"/get_generated_image/{uuid_filename}"})
                        yield f"data: {response_data}\n\n"
                    else:
                        error_message = json.dumps({"type": "error", "data": "Failed to save generated image."})
                        yield f"data: {error_message}\n\n"

                elif chunk.text:
                    response_data = json.dumps({"type": "text", "data": chunk.text})
                    app_logger_internal.info(f"Text chunk generated: {chunk.text[:50]}...")
                    yield f"data: {response_data}\n\n"
            app_logger_internal.info("AI stream closed.")
            # Send stream closure message to the client
            app_logger_internal.info("Sending stream_end message to client.")
            yield f"data: {json.dumps({'type': 'stream_end', 'data': 'AI stream closed.'})}\n\n"
        except Exception as e:
            app_logger_internal.error(f"Error during image generation: {e}")
            error_message = json.dumps({"type": "error", "data": str(e)})
            yield f"data: {error_message}\n\n"
            app_logger_internal.info("Stream closed due to error.")

    return Response(generate_stream(app_logger), mimetype='text/event-stream')


@nano_banana_bp.route('/get_generated_image/<path:filename>')
def get_generated_image(filename):
    current_app.logger.info(f"Serving generated image: {filename} from {LOCAL_CACHE}")
    file_path = os.path.join(LOCAL_CACHE, filename)

    @after_this_request
    def remove_file(response):
        try:
            os.remove(file_path)
            current_app.logger.info(f"Deleted cached file: {file_path}")
        except Exception as e:
            current_app.logger.error(f"Error deleting cached file {file_path}: {e}")
        return response

    return send_from_directory(LOCAL_CACHE, filename)


@nano_banana_bp.route('/save_nano_banana_demo', methods=['POST'])
def save_nano_banana_demo():
    app_logger = current_app.logger
    app_logger.info("Starting save demo process...")
    data = request.get_json()
    title = data.get('title')
    fixed_prompt_header = data.get('fixed_prompt_header') # Get separately
    main_prompt = data.get('main_prompt') # Get separately
    images_data = data.get('images', [])

    # Check for essential data: title and at least one image
    if not title or not images_data:
        app_logger.error("Missing essential data: title or images.")
        return json.dumps({'status': 'error', 'message': 'Missing title or images data.'}), 400

    gcs_image_urls = []
    # Use the parsed bucket name and folder prefix
    # bucket_name = os.environ.get("SHOWCASE_GCS_PATH") # No longer needed
    if not gcs_bucket_name:
        app_logger.error("GCS bucket name not configured.")
        return json.dumps({'status': 'error', 'message': 'GCS bucket not configured.'}), 500

    try:
        bucket = gcs_client.get_bucket(gcs_bucket_name)

        for image_data in images_data:
            header, encoded = image_data.split(",", 1)
            # raw_mime_type = header.split(";", 1)[0].split(":", 1)[1] # No longer needed directly
            image_bytes_original = base64.b64decode(encoded)

            # Convert image to PNG using Pillow
            from io import BytesIO
            img = Image.open(BytesIO(image_bytes_original))
            png_bytes_io = BytesIO()
            img.save(png_bytes_io, format="PNG")
            image_bytes_png = png_bytes_io.getvalue()
            
            mime_type = "image/png" # Fixed MIME type after conversion
            file_extension = ".png" # Fixed file extension
            
            image_uuid = str(uuid.uuid4()) # Generate UUID for filename
            gcs_filename = f"{gcs_folder_prefix}nanobanana/{image_uuid}{file_extension}"

            blob = bucket.blob(gcs_filename)
            blob.upload_from_string(image_bytes_png, content_type=mime_type)
            gcs_image_urls.append(f"gs://{gcs_bucket_name}/{gcs_filename}") # Store GCS path in database
            app_logger.info(f"Uploaded PNG image to GCS: {gcs_filename}")

        # Save demo details to Firestore
        doc_ref = db.collection(FIRESTORE_COLLECTION_ID).document()
        doc_ref.set({
            'title': title,
            'fixed_prompt_header': fixed_prompt_header, # Save separately
            'main_prompt': main_prompt, # Save separately
            'images': gcs_image_urls,
            'timestamp': firestore.SERVER_TIMESTAMP # Use server timestamp
        })
        app_logger.info(f"Saved demo to Firestore with ID: {doc_ref.id}")

        return json.dumps({'status': 'success', 'message': 'Demo saved successfully!', 'demo_id': doc_ref.id}), 200

    except Exception as e:
        app_logger.error(f"Error saving demo: {e}")
        return json.dumps({'status': 'error', 'message': str(e)}), 500


@nano_banana_bp.route('/list_nano_banana_demos', methods=['GET'])
def list_nano_banana_demos():
    app_logger = current_app.logger
    app_logger.info("Starting list demos process...")
    try:
        demos_ref = db.collection(FIRESTORE_COLLECTION_ID).order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
        demos_list = []
        for doc in demos_ref:
            demo_data = doc.to_dict()
            # Convert timestamp to a serializable format (e.g., ISO 8601 string or Unix timestamp)
            if 'timestamp' in demo_data and hasattr(demo_data['timestamp'], 'isoformat'):
                demo_data['timestamp'] = demo_data['timestamp'].isoformat()
            elif 'timestamp' in demo_data and hasattr(demo_data['timestamp'], '_seconds'):
                # Fallback for old timestamp format if necessary, though isoformat is preferred
                demo_data['timestamp'] = demo_data['timestamp']._seconds * 1000 # Convert to milliseconds for JS Date
            demos_list.append(demo_data)

        app_logger.info(f"Retrieved {len(demos_list)} demos from Firestore.")
        return json.dumps(demos_list), 200
    except Exception as e:
        app_logger.error(f"Error listing demos: {e}")
        return json.dumps({'status': 'error', 'message': str(e)}), 500


@nano_banana_bp.route('/get_gcs_image', methods=['GET'])
def get_gcs_image():
    app_logger = current_app.logger
    gcs_path = request.args.get('gcs_path')

    if not gcs_path:
        app_logger.error("Missing GCS path in request.")
        return "Missing GCS path", 400

    try:
        # Parse GCS path (e.g., gs://bucket-name/path/to/image.png)
        if gcs_path.startswith("gs://"):
            path_parts = gcs_path[len("gs://"):].split("/", 1)
            bucket_name = path_parts[0]
            blob_name = path_parts[1] if len(path_parts) > 1 else ""
        else:
            # Assume it's already just bucket/blob name or invalid
            app_logger.error(f"Invalid GCS path format: {gcs_path}")
            return "Invalid GCS path format", 400

        bucket = gcs_client.get_bucket(bucket_name)
        blob = bucket.blob(blob_name)

        if not blob.exists():
            app_logger.error(f"GCS blob not found: {gcs_path}")
            return "Image not found", 404

        # Get content type for the response header
        content_type = blob.content_type if blob.content_type else 'application/octet-stream'

        # Stream the image data
        def generate_image_chunks():
            yield blob.download_as_bytes()

        return Response(generate_image_chunks(), mimetype=content_type)

    except Exception as e:
        app_logger.error(f"Error serving GCS image {gcs_path}: {e}")
        return str(e), 500


if __name__ == "__main__":
    # This part is for standalone testing and won't be used by Flask
    pass
