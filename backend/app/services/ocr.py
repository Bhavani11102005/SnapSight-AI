import easyocr
import numpy as np


class OCREngine:
    def __init__(self):
        self.reader = easyocr.Reader(["en"], gpu=False)

    def read(self, image):
        # EasyOCR accepts a NumPy array, file path, bytes, etc.
        # Convert PIL Image to NumPy array when necessary.
        if not isinstance(image, np.ndarray):
            image = np.array(image)

        results = self.reader.readtext(
            image,
            detail=1
        )

        return [
            {
                "text": result[1],
                "confidence": float(result[2])
            }
            for result in results
        ]