import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef(null);
  const scannerElementId = 'qr-reader-viewport';

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: 'environment' }, // Ưu tiên camera sau trên điện thoại
          config,
          (decodedText) => {
            // Khi quét thành công mã QR
            if (decodedText) {
              // Bóc tách mã phiếu nếu là đường dẫn URL: https://.../track/RP-123456
              let code = decodedText.trim();
              const match = code.match(/track\/([A-Za-z0-9_-]+)/i);
              if (match && match[1]) {
                code = match[1];
              }
              // Dừng scanner và gọi callback
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
                onScanSuccess(code);
              }).catch(() => {
                onScanSuccess(code);
              });
            }
          },
          () => {
            // Lỗi frame quét (bỏ qua frame rỗng)
          }
        );
        setIsStarting(false);
      } catch (err) {
        console.error('Lỗi khởi động camera quét QR:', err);
        setError('Không thể mở Camera. Vui lòng cấp quyền truy cập Camera cho trình duyệt hoặc thử lại.');
        setIsStarting(false);
      }
    };

    // Đợi DOM render element qr-reader-viewport
    const timer = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          try {
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, onScanSuccess]);

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
            onClick={onClose}
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

          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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
