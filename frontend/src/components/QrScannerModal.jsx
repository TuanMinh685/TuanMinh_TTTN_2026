import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef(null);
  const isStoppingRef = useRef(false);
  const scannerElementId = 'qr-reader-viewport';

  const stopAndClearScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // Bỏ qua nếu scanner đã dừng trước đó
    }
    try {
      scanner.clear();
    } catch {
      // Bỏ qua
    }
    scannerRef.current = null;
    isStoppingRef.current = false;
  }, []);

  const handleClose = useCallback(async () => {
    await stopAndClearScanner();
    onClose();
  }, [stopAndClearScanner, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    const startScanner = async () => {
      try {
        const el = document.getElementById(scannerElementId);
        if (!el || isCancelled) return;

        const html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: 'environment' }, // Ưu tiên camera sau trên điện thoại
          config,
          async (decodedText) => {
            if (decodedText && !isCancelled) {
              isCancelled = true;
              let code = decodedText.trim();
              const match = code.match(/track\/([A-Za-z0-9_-]+)/i);
              if (match && match[1]) {
                code = match[1];
              }
              await stopAndClearScanner();
              onScanSuccess(code);
            }
          },
          () => {
            // Lỗi frame quét (bỏ qua frame rỗng)
          }
        );
        if (!isCancelled) {
          setIsStarting(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Lỗi khởi động camera quét QR:', err);
          setError('Không thể mở Camera. Vui lòng cấp quyền truy cập Camera cho trình duyệt hoặc thử lại.');
          setIsStarting(false);
        }
      }
    };

    const timer = setTimeout(startScanner, 100);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      stopAndClearScanner();
    };
  }, [isOpen, onScanSuccess, stopAndClearScanner]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      setIsStarting(true);
      const html5QrCode = new Html5Qrcode('qr-reader-file-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      let code = decodedText.trim();
      const match = code.match(/track\/([A-Za-z0-9_-]+)/i);
      if (match && match[1]) {
        code = match[1];
      }
      await stopAndClearScanner();
      onScanSuccess(code);
    } catch (err) {
      console.error('Lỗi nhận diện ảnh QR:', err);
      setError('Không nhận diện được mã QR trong ảnh. Vui lòng chọn ảnh chụp rõ nét hơn hoặc nhập mã trực tiếp.');
    } finally {
      setIsStarting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <h3 className="font-bold text-slate-800 text-lg">Quét mã QR trên phiếu</h3>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Khung quét Camera */}
        <div className="p-6">
          <p className="mb-4 text-center text-sm text-slate-500">
            Hướng camera vào mã QR in trên phiếu tiếp nhận để hệ thống tự động nhận diện.
          </p>

          {error ? (
            <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">
              <p className="font-bold mb-1">⚠️ Lỗi Camera</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border-2 border-brand-green bg-black">
              <div id={scannerElementId} className="w-full h-full" />
              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white text-sm">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent mb-2" />
                  <span>Đang khởi động camera...</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-2 font-medium">Hoặc nếu trình duyệt điện thoại chặn camera:</p>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition">
              <span>🖼️ Tải ảnh chụp mã QR từ máy</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <div id="qr-reader-file-temp" className="hidden" />
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
            >
              Hủy / Đóng camera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QrScannerModal;

