from functools import lru_cache
from PIL import Image

from app.services.detector import ObjectDetector
from app.services.ocr import OCREngine


@lru_cache(maxsize=1)
def get_detector():
    return ObjectDetector()


@lru_cache(maxsize=1)
def get_ocr():
    return OCREngine()


def analyze_image(image: Image.Image):
    detector = get_detector()
    ocr = get_ocr()

    # Run object detection
    detections = detector.detect(image)

    # Run OCR
    text = ocr.read(image)

    return {
        "objects": detections,
        "text": text,
        "summary": build_summary(detections, text)
    }


def build_summary(objects, text):
    parts = []

    # -----------------------------
    # OBJECT DETECTION SUMMARY
    # -----------------------------
    object_names = [
        item["label"]
        for item in objects
        if isinstance(item, dict) and "label" in item
    ]

    if object_names:
        unique = list(dict.fromkeys(object_names))
        parts.append(
            "Detected: " + ", ".join(unique) + "."
        )

    # -----------------------------
    # OCR SUMMARY
    # -----------------------------
    if isinstance(text, list):
        extracted_text = " ".join(
            item.get("text", "")
            for item in text
            if isinstance(item, dict)
        )
    else:
        extracted_text = str(text) if text else ""

    extracted_text = " ".join(extracted_text.split())

    if extracted_text:
        if len(extracted_text) > 300:
            extracted_text = extracted_text[:300] + "..."

        parts.append(
            "Text: " + extracted_text
        )

    # -----------------------------
    # FALLBACK
    # -----------------------------
    if not parts:
        parts.append(
            "No useful visual information was detected."
        )

    return " ".join(parts)