from pathlib import Path
import io

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image

from app.services.vision import analyze_image


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="SnapSight AI API",
    version="0.1.0",
    description="Backend for the SnapSight AI on-device visual assistant."
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://snapsight-ai.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# API routes
# --------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "snapsight-backend",
        "version": "0.1.0"
    }


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file."
        )

    data = await file.read()

    try:
        image = Image.open(
            io.BytesIO(data)
        ).convert("RGB")

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid image."
        ) from exc

    result = analyze_image(image)

    return {
        "filename": file.filename,
        "result": result
    }


# --------------------------------------------------
# React frontend
# --------------------------------------------------

if FRONTEND_DIST.exists():

    # Serve Vite-generated assets
    app.mount(
        "/assets",
        StaticFiles(
            directory=FRONTEND_DIST / "assets"
        ),
        name="assets"
    )


    @app.get("/")
    async def serve_frontend():
        return FileResponse(
            FRONTEND_DIST / "index.html"
        )


    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):

        # Never intercept API routes
        if full_path.startswith("api/"):
            raise HTTPException(
                status_code=404,
                detail="API endpoint not found."
            )

        requested_file = FRONTEND_DIST / full_path

        if requested_file.is_file():
            return FileResponse(requested_file)

        # React SPA fallback
        return FileResponse(
            FRONTEND_DIST / "index.html"
        )

else:

    @app.get("/")
    async def frontend_not_found():
        return {
            "message": "SnapSight AI API is running.",
            "frontend": "Frontend build not found."
        }