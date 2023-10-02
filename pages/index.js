import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import * as faceapi from "face-api.js";

export default function Home() {
  const [isWebCamOpen, setIsWebCamOpen] = useState(false);
  const [streaming, setStreaming] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loadedModels, setLoadedModels] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const MODEL_URL = "/models";

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]).then(() => {
      setLoadedModels(true);
    });
  }, [isWebCamOpen]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      // Reduz o tamanho da foto para 70% do tamanho do vídeo
      const canvasWidth = video.videoWidth * 0.7;
      const canvasHeight = video.videoHeight * 0.7;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Calcula a posição de corte para centralizar a foto
      const cropX = (video.videoWidth - canvasWidth) / 2;
      const cropY = (video.videoHeight - canvasHeight) / 2;

      const context = canvas.getContext("2d");
      context.drawImage(
        video,
        cropX,
        cropY,
        canvasWidth,
        canvasHeight,
        0,
        0,
        canvasWidth,
        canvasHeight
      );

      const data = canvas.toDataURL("image/jpg");
      const link = document.createElement("a");
      link.download = "image.jpg";
      link.href = data;
      link.click();
    }
  };

  useEffect(() => {
    if (isWebCamOpen) {
      videoRef.current.srcObject = streaming;

      const yourInterval = setInterval(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const displaySize = { width: 720, height: 560 };

        if (video && canvas) {
          faceapi.matchDimensions(canvas, displaySize);

          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
          );

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );

          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

          let scoreDisabled = true;

          for (const detection of resizedDetections) {
            if (detection.score > 0.7) {
              // faceapi.draw.drawDetections(canvas, [detection]);
              scoreDisabled = false;
            }
          }
          setButtonDisabled(scoreDisabled);
        }
      }, 1000);

      intervalRef.current = yourInterval;
    }
  }, [isWebCamOpen, streaming]);

  useEffect(() => {
    return () => {
      // Limpa o intervalo quando o componente é desmontado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const toggleWebcam = () => {
    setLoading(true);

    if (streaming && isWebCamOpen) {
      streaming.getTracks().forEach((track) => {
        track.stop();
      });
      setIsWebCamOpen(false);
      setStreaming(null);
      setLoading(false);
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setIsWebCamOpen(true);
          setStreaming(stream);
        })
        .catch((error) => {
          console.error("Erro ao acessar a câmera:", error);
          setLoading(false);
        });
    }
  };

  return (
    <main className={styles.page}>
      <div className="main-container">
        <div
          className="card"
          style={{
            width: "720px",
            height: "560px",
            borderRadius: "12px",
            border: "2px solid #e2e8f0",
            position: "relative",
          }}
        >
          {isWebCamOpen && loadedModels ? (
            <>
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "12px",
                  objectFit: "cover",
                }}
                autoPlay
                muted
              ></video>
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "12px",
                }}
              />
            </>
          ) : (
            <>
              <h1
                style={{
                  color: "#e2e8f0",
                  fontFamily: "sans-serif",
                  margin: 48,
                }}
              >
                🧑🏻 Reconhecimento Facial (Teste)
              </h1>
              <h3
                style={{
                  color: "#e2e8f0",
                  fontFamily: "sans-serif",
                  margin: 48,
                }}
              >
                ℹ️ Esta página web tem o objetivo apenas de capturar imagens
                através da câmera do dispositivo ou webcam e, a partir disso,
                fazer a conexão com a API disponibilizada.
              </h3>
              <h3
                style={{
                  color: "#e2e8f0",
                  fontFamily: "sans-serif",
                  margin: 48,
                }}
              >
                📸 Para iniciar o teste, clique no botão abaixo para abrir a
                câmera do seu dispositivo ou acionar a webcam.
              </h3>
            </>
          )}
          <div
            className="btns-container"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: 12,
              margin: 48,
              height: 60,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            {isWebCamOpen ? (
              <>
                <button
                  style={{
                    backgroundColor: "#e2e8f0",
                    color: "#1a202c",
                    fontFamily: "sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 12,
                    height: 40,
                    width: 200,
                    margin: 8,
                    cursor: "pointer",
                    border: "none",
                    backgroundColor: "#ef4444",
                    color: "#e2e8f0",
                  }}
                  onClick={() => {
                    setLoading(true);
                    if (streaming && isWebCamOpen) {
                      streaming.getTracks().forEach((track) => {
                        track.stop();
                      });
                      setIsWebCamOpen(false);
                      setStreaming(null);
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? "Desligando..." : "Desligar Câmera"}
                </button>
                <button
                  style={{
                    backgroundColor: "#e2e8f0",
                    color: "#1a202c",
                    fontFamily: "sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 12,
                    height: 40,
                    width: 200,
                    margin: 8,
                    cursor: buttonDisabled ? "not-allowed" : "pointer",
                    border: "none",
                    opacity: buttonDisabled ? 0.4 : 1,
                  }}
                  onClick={takePhoto}
                  disabled={loading || buttonDisabled}
                >
                  {loading
                    ? "📸 Tirando..."
                    : buttonDisabled
                    ? "Rosto não detectado"
                    : "📸 Tirar Foto"}
                </button>
              </>
            ) : (
              <>
                <button
                  style={{
                    backgroundColor: "#4bb543",
                    color: "#e2e8f0",
                    fontFamily: "sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 12,
                    height: 40,
                    width: 200,
                    margin: 8,
                    cursor: "pointer",
                    border: "none",
                  }}
                  onClick={() => {
                    setLoading(true);
                    navigator.mediaDevices
                      .getUserMedia({ video: true })
                      .then((stream) => {
                        setIsWebCamOpen(true);
                        setStreaming(stream);
                      })
                      .then(() => {
                        setLoading(false);
                      });
                  }}
                  disabled={loading}
                >
                  {loading ? "Ligando..." : "Ligar Câmera"}
                </button>
                <button
                  style={{
                    backgroundColor: "#e2e8f0",
                    color: "#1a202c",
                    fontFamily: "sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 12,
                    height: 40,
                    width: 200,
                    margin: 8,
                    border: "none",
                  }}
                  onClick={() => console.log("oiiiiiii")}
                >
                  ⬆️ Fazer upload
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
