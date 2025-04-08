from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "✅ Backend server is running and integrated!"

@app.route('/api/detection/face', methods=['POST'])
def detect_face():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    img_bytes = image_file.read()
    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    # Simulated detection
    face_detected = True
    phone_detected = False

    return jsonify({
        'faceDetected': face_detected,
        'multipleFaces': False,
        'phoneDetected': phone_detected
    })

@app.route('/api/detection/object', methods=['POST'])
def detect_object():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    img_bytes = image_file.read()
    np_img = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    # Simulated object detection
    object_detected = True
    detected_label = "Phone"

    return jsonify({
        'objectDetected': object_detected,
        'label': detected_label
    })

if __name__ == '__main__':
    app.run(host='localhost', port=5173, debug=True)
