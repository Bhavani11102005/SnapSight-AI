# SnapSight AI

Privacy-First On-Device Multimodal Visual Assistant

SnapSight AI is a camera-driven AI application designed for Snapdragon-powered HP PCs. The MVP combines a React interface with a FastAPI backend and a model abstraction layer so that open-source models can be replaced by Qualcomm AI Hub/ONNX Runtime deployments for Snapdragon NPU execution.

## MVP features
- Live webcam preview
- Capture a frame
- Upload an image
- Object detection through a pluggable detector
- OCR through a pluggable OCR engine
- Combined analysis result
- Health/status endpoint

## Architecture

React + Vite
        |
        v
FastAPI
        |
        +--> Object Detector
        |
        +--> OCR Engine
        |
        +--> Future: Qualcomm AI Hub / ONNX Runtime QNN
        |
        v
Text / structured result

## Development

### Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Optional model dependencies are included in requirements. On first use, model weights may be downloaded.

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite.

## Snapdragon deployment plan

The inference layer is intentionally separated from the API. After the MVP works on a normal Windows PC, the detector/OCR components will be replaced or augmented with Snapdragon-targeted models from Qualcomm AI Hub and an appropriate ONNX Runtime/QNN execution path. Qualcomm documents ONNX Runtime and QNN execution paths for Windows on Snapdragon.

Do not claim NPU performance until the model has actually been tested on a Snapdragon device or Qualcomm-hosted device.

## Roadmap
1. Working camera + API
2. Local object detection
3. Local OCR
4. Visual Q&A layer
5. Qualcomm AI Hub model integration
6. Snapdragon performance measurement
7. Accessibility voice mode
8. Demo polish and submission assets
