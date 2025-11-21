import { useState, useRef, useEffect } from 'react';
import { Camera, Loader, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { signIn, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanningFace, setScanningFace] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [initializingCamera, setInitializingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const stream = streamRef.current;
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video on effect:', err);
      });
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setInitializingCamera(true);
    setErrorMessage('');

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      setCameraActive(true);
      setInitializingCamera(false);
    } catch (err) {
      console.error('Camera error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        setErrorMessage('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('not found')) {
        setErrorMessage('No se encontró ninguna cámara en tu dispositivo.');
      } else {
        setErrorMessage('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      }
      setInitializingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScanningFace(false);
  };

  const handleStartFacialRecognition = () => {
    setShowTermsModal(true);
  };

  const handleAcceptTerms = () => {
    setShowTermsModal(false);
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const handleCancelTerms = () => {
    setShowTermsModal(false);
  };

  const handleScanFace = async () => {
    setScanningFace(true);
    setErrorMessage('');

    await new Promise(resolve => setTimeout(resolve, 3000));

    stopCamera();
    setLoading(true);
    const result = await signIn('student@udal.edu.co', 'password123');
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      setErrorMessage('No se pudo verificar tu identidad. Intenta nuevamente.');
      setScanningFace(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-lg">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white">Control de Acceso</h1>
              <p className="text-blue-100 mt-2">Reconocimiento Facial</p>
            </div>

            <div className="p-8">
              {!cameraActive && !initializingCamera ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Inicia sesión con tu rostro
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Posiciona tu rostro frente a la cámara para acceder al sistema
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleStartFacialRecognition}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                  >
                    <Camera className="w-6 h-6" />
                    Iniciar Reconocimiento Facial
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> Necesitarás permitir el acceso a tu cámara para continuar.
                    </p>
                  </div>
                </div>
              ) : initializingCamera ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-gray-900 mb-2">Inicializando cámara...</p>
                    <p className="text-sm text-gray-600">Por favor espera mientras se accede a tu dispositivo</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ aspectRatio: '4/3' }}>
                    <video
                      ref={videoRef}
                      playsInline={true}
                      muted={true}
                      className="w-full h-full object-cover"
                      style={{
                        transform: 'scaleX(-1)',
                        display: 'block',
                        backgroundColor: '#000'
                      }}
                    />

                    {scanningFace && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-center">
                          <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                          <p className="text-white font-semibold text-lg">Analizando rostro...</p>
                          <p className="text-blue-300 text-sm mt-2">Por favor, mantén tu posición</p>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-64 h-64 border-4 border-blue-500 rounded-lg opacity-50"></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleScanFace}
                      disabled={scanningFace || loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {scanningFace || loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Verificando identidad...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          Escanear Rostro
                        </>
                      )}
                    </button>

                    <button
                      onClick={stopCamera}
                      disabled={scanningFace || loading}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Cancelar
                    </button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800 text-center">
                      Asegúrate de estar en un lugar bien iluminado y posiciona tu rostro dentro del marco
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <h2 className="text-2xl font-bold text-white">Términos y Condiciones</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900 font-semibold">
                    Importante: Lee cuidadosamente antes de continuar
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-gray-700 text-sm">
                <h3 className="font-semibold text-gray-900 text-base">Uso de Reconocimiento Facial</h3>
                <p>
                  Al aceptar estos términos, autorizas el uso de tecnología de reconocimiento facial para verificar tu identidad y controlar el acceso a los laboratorios de la institución.
                </p>

                <h3 className="font-semibold text-gray-900 text-base mt-4">Recopilación de Datos Biométricos</h3>
                <p>
                  Tus datos biométricos faciales serán capturados, procesados y almacenados de forma segura únicamente con el propósito de control de acceso. Estos datos están protegidos conforme a las leyes de protección de datos personales.
                </p>

                <h3 className="font-semibold text-gray-900 text-base mt-4">Consentimiento</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Autorizas el acceso a tu cámara</li>
                  <li>Permites el procesamiento de tu imagen facial</li>
                  <li>Aceptas el almacenamiento de tus datos biométricos</li>
                  <li>Comprendes que estos datos se usan exclusivamente para control de acceso</li>
                </ul>

                <h3 className="font-semibold text-gray-900 text-base mt-4">Seguridad y Privacidad</h3>
                <p>
                  Tus datos están protegidos mediante encriptación y medidas de seguridad avanzadas. No se compartirán con terceros sin tu consentimiento explícito.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-gray-600">
                    Puedes revocar este consentimiento en cualquier momento contactando al administrador del sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleCancelTerms}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAcceptTerms}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg"
              >
                Acepto los Términos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
