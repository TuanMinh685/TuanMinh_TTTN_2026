import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';

function BookingForm() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetService = searchParams.get('service') || location.state?.serviceName || '';

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    zaloId: '',
    deviceName: '',
    ngayHen: '',
    gioHen: '',
    moTaLoi: targetService ? `Cần hỗ trợ / CSKH: ${targetService}` : '',
    loaiDichVu: 'TAI_CUA_HANG'
  });
  const [selectedServiceBanner, setSelectedServiceBanner] = useState(targetService);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TAI_QUAY'); // 'TAI_QUAY' | 'VIETQR'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const paymentDesc = paymentMethod === 'VIETQR'
        ? '\n[Hình thức thanh toán dự kiến: Chuyển khoản VietQR]'
        : '\n[Hình thức thanh toán dự kiến: Tiền mặt / Quẹt thẻ tại quầy]';

      await api.post('/tickets/booking', {
        ...formData,
        isStudent,
        schoolName,
        studentId,
        moTaLoi: `${formData.moTaLoi}${paymentDesc}`
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const vietQrBookingUrl = `https://img.vietqr.io/image/MB-02838604999-compact2.png?amount=150000&addInfo=${encodeURIComponent(`LH ${formData.phone.slice(-4) || 'CSKH'}`)}&accountName=${encodeURIComponent('HUNGHAU IT SUPPORT')}`;

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-6 md:p-8 text-center border-t-8 border-brand-green">
          <div className="w-16 h-16 bg-green-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-brand-blue mb-2">Đặt lịch hẹn CSKH thành công!</h2>
          <p className="text-slate-600 text-xs md:text-sm mb-6">
            Cảm ơn bạn <strong>{formData.fullName}</strong> đã đặt hẹn trước. Khi bạn đến quầy lễ tân tại <strong>615 Âu Cơ</strong>, nhân viên sẽ chuyển lịch hẹn thành <strong>Mã QR Hồ Sơ CSKH</strong> ngay lập tức!
          </p>

          {paymentMethod === 'VIETQR' ? (
            <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📱</span>
                <span className="font-bold text-xs uppercase tracking-wider text-brand-blue">
                  Mã QR Thanh Toán / Đặt Cọc VietQR
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={vietQrBookingUrl}
                  alt="Mã QR VietQR"
                  className="w-36 h-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs"
                />
                <div className="text-xs space-y-1 text-slate-600">
                  <p><strong>Ngân hàng:</strong> MB Bank (Quân Đội)</p>
                  <p><strong>Số tài khoản:</strong> <code className="font-bold text-slate-800">02838604999</code></p>
                  <p><strong>Chủ tài khoản:</strong> HUNGHAU IT SUPPORT</p>
                  <p><strong>Nội dung CK:</strong> <code className="font-bold text-brand-blue">LH {formData.phone.slice(-4) || 'CSKH'}</code></p>
                  <p className="text-[11px] text-slate-400 mt-1">Bạn có thể chuyển khoản trước hoặc chờ KTV báo giá chính xác trên hồ sơ QR.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">🏢 Thanh toán tại quầy</span>
              Bạn sẽ kiểm tra thiết bị ưng ý và thanh toán trực tiếp bằng tiền mặt hoặc quẹt thẻ tại quầy 615 Âu Cơ sau khi nhận máy.
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/tra-cuu"
              className="px-5 py-2.5 bg-brand-blue text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
            >
              📷 Mở Cổng Quét QR & Tra Cứu
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
            >
              Trở về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-brand-orange">
          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-xs font-bold uppercase tracking-wider mb-2">
                📅 Đặt Lịch Hẹn Trước Qua Web QR
              </span>
              <h1 className="text-2xl font-bold text-brand-blue mb-1">Đặt Lịch Hẹn Chăm Sóc Khách Hàng</h1>
              <p className="text-slate-500 text-xs md:text-sm">
                Đặt lịch trước để được ưu tiên tiếp nhận và cấp phiếu QR nhanh chóng khi đến trung tâm 615 Âu Cơ.
              </p>
            </div>

            {selectedServiceBanner && (
              <div className="mb-6 p-4 bg-orange-50 border-l-4 border-brand-orange rounded-r-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="text-[10px] uppercase font-extrabold text-brand-orange tracking-wider">Nội dung hẹn</div>
                    <div className="font-bold text-slate-800 text-sm md:text-base">{selectedServiceBanner}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceBanner('');
                    setFormData(prev => ({ ...prev, moTaLoi: '' }));
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold"
                >
                  Xóa chọn
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hình thức tiếp nhận tại trung tâm CSKH</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                  value={formData.loaiDichVu} onChange={e => setFormData({...formData, loaiDichVu: e.target.value})}
                >
                  <option value="TAI_CUA_HANG">Mang thiết bị đến Trung tâm CSKH (615 Âu Cơ, Q. Tân Phú)</option>
                  <option value="BAO_HANH_DINH_KY">Đặt lịch kiểm tra & bảo hành điện tử (e-Warranty)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                  <input type="text" required placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
                  <input type="tel" required placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Zalo (để nhận thông báo QR tiến độ)</label>
                  <input type="tel" placeholder="Nhập số Zalo (nếu khác SĐT)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.zaloId} onChange={e => setFormData({...formData, zaloId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thiết bị mang theo</label>
                  <input type="text" placeholder="VD: Laptop Asus Zenbook, PC Dell..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.deviceName || ''} onChange={e => setFormData({...formData, deviceName: e.target.value})} />
                </div>
              </div>

              {/* Ưu đãi Sinh viên toàn quốc */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isStudent} 
                    onChange={e => setIsStudent(e.target.checked)}
                    className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-indigo-900 block">🎓 Tôi là Học sinh / Sinh viên (Ưu đãi -15% tổng hóa đơn)</span>
                    <span className="text-[11px] text-indigo-700">Áp dụng cho học sinh, sinh viên các trường toàn quốc.</span>
                  </div>
                </label>

                {isStudent && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-indigo-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trường đang theo học *</label>
                      <input 
                        type="text" 
                        required={isStudent}
                        list="school-suggestions"
                        placeholder="VD: Đại học Văn Hiến (VHU)..."
                        value={schoolName}
                        onChange={e => setSchoolName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-brand-blue outline-none bg-white"
                      />
                      <datalist id="school-suggestions">
                        <option value="Trường Đại học Văn Hiến (VHU)" />
                        <option value="Trường Đại học Bách Khoa TP.HCM" />
                        <option value="Trường Đại học Công nghệ Thông tin (UIT)" />
                        <option value="Trường Đại học Sư phạm Kỹ thuật TP.HCM" />
                        <option value="Trường Đại học Kinh tế TP.HCM (UEH)" />
                        <option value="Trường Đại học Tài chính - Marketing (UFM)" />
                        <option value="Trường Đại học Sài Gòn" />
                        <option value="Trường Đại học Mở TP.HCM" />
                        <option value="Trường Đại học FPT TP.HCM" />
                        <option value="Học sinh / Sinh viên trường khác trên toàn quốc" />
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mã số sinh viên (MSSV) *</label>
                      <input 
                        type="text" 
                        required={isStudent}
                        placeholder="VD: 221A010123"
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-brand-blue outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày hẹn *</label>
                  <input type="date" required 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.ngayHen} onChange={e => setFormData({...formData, ngayHen: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giờ hẹn dự kiến *</label>
                  <input type="time" required 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.gioHen} onChange={e => setFormData({...formData, gioHen: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả chi tiết tình trạng / Yêu cầu hỗ trợ *</label>
                <textarea required rows="3" placeholder="Ví dụ: Máy bật không lên nguồn, cần kiểm tra tổng quát và vệ sinh bảo dưỡng..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                  value={formData.moTaLoi} onChange={e => setFormData({...formData, moTaLoi: e.target.value})}></textarea>
              </div>

              {/* KHỐI CHỌN PHƯƠNG THỨC THANH TOÁN DỰ KIẾN */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80">
                <label className="block text-xs font-bold text-slate-800 mb-2.5">
                  💳 Phương thức thanh toán dự kiến sau khi hoàn tất:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentMethod('TAI_QUAY')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      paymentMethod === 'TAI_QUAY'
                        ? 'border-brand-blue bg-white shadow-xs text-brand-blue font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'TAI_QUAY'}
                      onChange={() => setPaymentMethod('TAI_QUAY')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">🏢 Thanh toán tại quầy</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">Tiền mặt hoặc quẹt thẻ khi nhận máy tại 615 Âu Cơ</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      paymentMethod === 'VIETQR'
                        ? 'border-brand-blue bg-white shadow-xs text-brand-blue font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'VIETQR'}
                      onChange={() => setPaymentMethod('VIETQR')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">📱 Chuyển khoản VietQR</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">Quét mã QR ngân hàng thanh toán nhanh 24/7</div>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-brand-orange text-white font-bold text-base rounded-xl hover:brightness-110 shadow-lg hover:shadow-xl transition-all mt-4 disabled:opacity-50">
                {loading ? 'Đang gửi thông tin...' : 'XÁC NHẬN ĐẶT LỊCH HẸN CSKH'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BookingForm;
