from PIL import Image

class ObjectDetector:
    """
    MVP detector.

    This class is intentionally isolated so the inference implementation can
    later be replaced with a Qualcomm AI Hub / ONNX Runtime QNN backend.
    """

    def __init__(self):
        self.model = None

    def _load(self):
        if self.model is None:
            from ultralytics import YOLO
            # Small model for the first MVP.
            self.model = YOLO("yolo11n.pt")

    def detect(self, image: Image.Image):
        self._load()

        results = self.model.predict(
            source=image,
            verbose=False,
            conf=0.35
        )

        output = []
        for result in results:
            names = result.names
            boxes = result.boxes

            if boxes is None:
                continue

            for box in boxes:
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                xyxy = [round(float(v), 2) for v in box.xyxy[0].tolist()]

                output.append({
                    "label": names[cls_id],
                    "confidence": round(confidence, 3),
                    "box": xyxy
                })

        return output
