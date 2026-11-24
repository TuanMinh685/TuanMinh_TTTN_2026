/**
 * Tiện ích thông báo trình duyệt, rung thiết bị và phát âm báo.
 */

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Phát âm báo hai nốt bằng Web Audio API.
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Nốt 1: D5 (587.33 Hz) - ngân 120ms
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Nốt 2: A5 (880.00 Hz) - vang sáng 350ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (audioErr) {
    console.warn('Không thể phát chuông âm thanh Web Audio:', audioErr);
  }
}

/**
 * Rung thiết bị di động khi có hỗ trợ navigator.vibrate.
 */
export function triggerDeviceVibration(pattern = [300, 100, 300, 100, 450]) {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (vibErr) {
    console.warn('Thiết bị không hỗ trợ rung:', vibErr);
  }
}

/**
 * Xin quyền thông báo từ người dùng
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Đăng ký hoặc kích hoạt Service Worker
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready.catch(() => {});
      }
      // Rung nhẹ xác nhận
      triggerDeviceVibration([100, 50, 100]);
      playNotificationChime();
    }
    return permission;
  } catch (err) {
    console.error('Lỗi yêu cầu cấp quyền thông báo:', err);
    return 'denied';
  }
}

/**
 * Hiển thị thông báo đẩy kèm âm báo và rung trên thiết bị.
 */
export async function showPushNotification({
  title = 'CSKH Công Ty Cổ Phần Lục Giác',
  body = 'Hồ sơ thiết bị của bạn đã có cập nhật tiến độ mới!',
  ticketCode = '',
  isCompleted = false
}) {
  playNotificationChime();

  const vibrationPattern = isCompleted ? [350, 120, 350, 120, 600] : [200, 100, 200];
  triggerDeviceVibration(vibrationPattern);

  if (isNotificationSupported() && Notification.permission === 'granted') {
    const notificationOptions = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: vibrationPattern,
      tag: ticketCode ? `ticket-${ticketCode}` : 'cskh-update',
      renotify: true,
      requireInteraction: isCompleted,
      data: {
        url: ticketCode ? `/track/${ticketCode}` : window.location.pathname
      }
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notificationOptions);
          return true;
        }
      }
    } catch (swErr) {
      console.warn('Không thể gửi thông báo qua Service Worker, dùng Notification API:', swErr);
    }

    // Dự phòng bằng Notification API trực tiếp
    try {
      const notif = new Notification(title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        if (ticketCode) {
          window.location.href = `/track/${ticketCode}`;
        }
      };
      return true;
    } catch (notifErr) {
      console.warn('Không thể tạo Notification:', notifErr);
    }
  }

  return false;
}
