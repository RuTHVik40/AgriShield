import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

model = load_model("ml-models/agri_model.h5")

CLASSES = [
    "Aphids",
    "Army worm",
    "Bacterial blight",
    "Cotton Boll Rot",
    "Green Cotton Boll",
    "Healthy",
    "Powdery mildew",
    "Target spot"
]

IMG_SIZE = (224, 224)


def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize(IMG_SIZE, Image.BILINEAR)
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    return image


def predict_image(image_bytes):
    processed = preprocess_image(image_bytes)
    predictions = model.predict([processed, processed])

    logger.debug(f"Predictions: {predictions}")

    confidence = float(np.max(predictions))
    class_index = int(np.argmax(predictions))
    pest_name = CLASSES[class_index]

    return {
        "pest": pest_name,
        "confidence": round(confidence, 4),
        "raw_predictions": predictions.tolist()
    }