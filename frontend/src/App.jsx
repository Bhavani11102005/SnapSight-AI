import React, { useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Stop camera when component is removed
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // -----------------------------
  // START CAMERA
  // -----------------------------
  async function startCamera() {
    setCameraError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported by this browser.");
        return;
      }

      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      videoRef.current.srcObject = media;

      setStream(media);
    } catch (error) {
      console.error("Camera error:", error);

      setCameraError(
        "Camera access was blocked or unavailable. Please allow camera permission."
      );
    }
  }

  // -----------------------------
  // STOP CAMERA
  // -----------------------------
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
  }

  // -----------------------------
  // CAPTURE CAMERA IMAGE
  // -----------------------------
  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video?.videoWidth) {
      setCameraError("Camera is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      video.videoWidth,
      video.videoHeight
    );

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setResult({
            error: "Could not capture the camera image.",
          });
          return;
        }

        const url = URL.createObjectURL(blob);

        setPreview(url);

        await analyze(blob, "camera-capture.jpg");
      },
      "image/jpeg",
      0.9
    );
  }

  // -----------------------------
  // SEND IMAGE TO FASTAPI
  // -----------------------------
  async function analyze(blob, filename) {
    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();

      form.append("file", blob, filename);

      const response = await fetch(`${API}/api/analyze`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      console.log("Backend response:", data);

      if (!response.ok) {
        throw new Error(
          data.detail || "Image analysis failed."
        );
      }

      setResult(data.result);
    } catch (error) {
      console.error("Analysis error:", error);

      setResult({
        error:
          error.message ||
          "Unable to connect to the SnapSight AI backend.",
      });
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // UPLOAD IMAGE
  // -----------------------------
  function onUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("Uploaded file:", file);

    const url = URL.createObjectURL(file);

    setPreview(url);

    analyze(file, file.name);
  }

  // -----------------------------
  // CLEAR RESULT
  // -----------------------------
  function clearResult() {
    setPreview(null);
    setResult(null);
    setCameraError("");
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <main className="page">

      {/* =========================
          HEADER
      ========================== */}
      <header className="hero">

        <div>
          <p className="eyebrow">
            SNAPDRAGON AI • ON-DEVICE VISION
          </p>

          <h1>
            SnapSight <span>AI</span>
          </h1>

          <p className="subtitle">
            Privacy-first multimodal visual assistance
            for everyday understanding.
          </p>
        </div>

        <div className="status">
          MVP • Local AI pipeline
        </div>

      </header>

      {/* =========================
          MAIN GRID
      ========================== */}
      <section className="grid">

        {/* =========================
            CAMERA CARD
        ========================== */}
        <div className="card camera-card">

          <div className="card-head">

            <div>
              <h2>Vision Capture</h2>

              <p>
                Point the camera at an object,
                document or scene.
              </p>
            </div>

            <div className="dot" />

          </div>

          {/* CAMERA */}
          <div className="camera">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            {!stream && (
              <div className="camera-placeholder">
                Camera is off
              </div>
            )}

          </div>

          {/* CAMERA ERROR */}
          {cameraError && (
            <p className="error">
              {cameraError}
            </p>
          )}

          {/* ACTION BUTTONS */}
          <div className="actions">

            {!stream ? (
              <button onClick={startCamera}>
                Start Camera
              </button>
            ) : (
              <button
                className="secondary"
                onClick={stopCamera}
              >
                Stop Camera
              </button>
            )}

            <button
              onClick={capture}
              disabled={!stream || loading}
            >
              {loading
                ? "Analyzing..."
                : "Capture & Analyze"}
            </button>

            <label className="upload">

              Upload Image

              <input
                type="file"
                accept="image/*"
                onChange={onUpload}
              />

            </label>

            {(preview || result) && (
              <button
                className="secondary"
                onClick={clearResult}
              >
                Clear
              </button>
            )}

          </div>

          {/* HIDDEN CANVAS */}
          <canvas
            ref={canvasRef}
            hidden
          />

        </div>

        {/* =========================
            RESULT CARD
        ========================== */}
        <div className="card result-card">

          <div className="card-head">

            <div>
              <h2>AI Understanding</h2>

              <p>
                Object detection + OCR
              </p>
            </div>

          </div>

          {/* IMAGE PREVIEW */}
          {preview && (
            <img
              className="preview"
              src={preview}
              alt="Captured input"
            />
          )}

          {/* LOADING */}
          {loading && (
            <div className="loading">
              <div className="spinner" />

              <p>
                Analyzing image with AI...
              </p>

              <span>
                YOLO object detection + EasyOCR
              </span>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && !result && (
            <div className="empty">

              <strong>
                No analysis yet
              </strong>

              <span>
                Capture a frame or upload an image
                to begin.
              </span>

            </div>
          )}

          {/* ERROR */}
          {!loading && result?.error && (
            <div className="error-box">

              <strong>
                Analysis Failed
              </strong>

              <p>
                {result.error}
              </p>

            </div>
          )}

          {/* SUCCESS RESULT */}
          {!loading &&
            result &&
            !result.error && (

              <div className="results">

                {/* =====================
                    OBJECTS
                ====================== */}
                <div>

                  <h3>
                    Detected Objects
                  </h3>

                  {result.objects?.length ? (

                    <div className="chips">

                      {result.objects.map(
                        (item, index) => (

                          <span
                            className="chip"
                            key={`${item.label}-${index}`}
                          >

                            {item.label}

                            {" · "}

                            {Math.round(
                              item.confidence * 100
                            )}
                            %

                          </span>

                        )
                      )}

                    </div>

                  ) : (

                    <p className="muted">
                      No objects detected.
                    </p>

                  )}

                </div>

                {/* =====================
                    OCR TEXT
                ====================== */}
                <div>

                  <h3>
                    Extracted Text
                  </h3>

                  {Array.isArray(result.text) ? (

                    result.text.length > 0 ? (

                      <pre className="ocr">
                        {result.text.join("\n")}
                      </pre>

                    ) : (

                      <pre className="ocr">
                        No text detected.
                      </pre>

                    )

                  ) : (

                    <pre className="ocr">
                      {result.text ||
                        "No text detected."}
                    </pre>

                  )}

                </div>

                {/* =====================
                    SUMMARY
                ====================== */}
                <div className="summary">

                  <h3>
                    Summary
                  </h3>

                  <p>
                    {result.summary ||
                      "No summary available."}
                  </p>

                </div>

              </div>
            )}

        </div>

      </section>

      {/* =========================
          FOOTER
      ========================== */}
      <footer>

        SnapSight AI • Qualcomm Snapdragon AI Lab
        Build & Present Challenge

      </footer>

    </main>
  );
}