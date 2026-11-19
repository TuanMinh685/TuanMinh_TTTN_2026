import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import SvgIcon, { DynamicIcon } from '../../components/SvgIcon';

const CMS_ICON_OPTIONS = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Máy tính bàn' },
  { value: 'disc', label: 'Phần mềm / OS' },
  { value: 'wrench', label: 'Sửa chữa' },
  { value: 'shield', label: 'Bảo hành' },
  { value: 'lock', label: 'Bảo mật / Dữ liệu' },
  { value: 'globe', label: 'Mạng / Internet' },
  { value: 'zap', label: 'Nâng cấp / Tốc độ' },
  { value: 'clock', label: 'Tiến độ' },
  { value: 'star', label: 'Đánh giá' },
  { value: 'file-text', label: 'Phiếu tiếp nhận' },
  { value: 'camera', label: 'Hình ảnh' }
];

export default function ClientCmsConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('HERO_BRAND'); // 'HERO_BRAND' | 'SERVICES' | 'PILLARS'
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/cms-config');
      if (res.data?.success && res.data?.data) {
        setConfig(res.data.data);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Không thể tải cấu hình giao diện: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    api.get('/public/cms-config')
      .then((res) => {
        if (!ignore && res.data?.success && res.data?.data) {
          setConfig(res.data.data);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setStatusMessage({
            type: 'error',
            text: 'Không thể tải cấu hình giao diện: ' + (err.response?.data?.message || err.message)
          });
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleBrandChange = (field, value) => {
    setHasChanges(true);
    setConfig(prev => ({
      ...prev,
      brand: {
        ...(prev?.brand || {}),
        [field]: value
      }
    }));
  };

  const handleHeroChange = (field, value) => {
    setHasChanges(true);
    setConfig(prev => ({
      ...prev,
      hero: {
        ...(prev?.hero || {}),
        [field]: value
      }
    }));
  };

  const handleServiceChange = (index, field, value) => {
    setHasChanges(true);
    setConfig(prev => {
      const nextServices = [...(prev?.services || [])];
      nextServices[index] = {
        ...nextServices[index],
        [field]: value
      };
      return { ...prev, services: nextServices };
    });
  };

  const handleAddService = () => {
    setHasChanges(true);
    setConfig(prev => {
      const nextServices = [
        ...(prev?.services || []),
        {
          id: `srv-${Date.now()}`,
          icon: 'laptop',
          tag: 'Dịch vụ mới',
          title: 'Hạng Mục Dịch Vụ Mới',
          desc: 'Mô tả chi tiết hạng mục dịch vụ kỹ thuật...',
          imageUrl: '/img/cskh-banner.svg',
          priceHint: 'Liên hệ báo giá',
          serviceParam: 'Hạng Mục Dịch Vụ Mới'
        }
      ];
      return { ...prev, services: nextServices };
    });
  };

  const handleRemoveService = (index) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hạng mục dịch vụ này khỏi trang chủ?')) return;
    setHasChanges(true);
    setConfig(prev => {
      const nextServices = (prev?.services || []).filter((_, idx) => idx !== index);
      return { ...prev, services: nextServices };
    });
  };

  const handlePillarChange = (index, field, value) => {
    setHasChanges(true);
    setConfig(prev => {
      const nextPillars = [...(prev?.pillars || [])];
      nextPillars[index] = {
        ...nextPillars[index],
        [field]: value
      };
      return { ...prev, pillars: nextPillars };
    });
  };

  const handleImageFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có dung lượng nhỏ hơn 4MB để tối ưu tốc độ tải trang!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
        setHasChanges(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    if (!config) return;
    setSaving(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await api.put('/admin/cms-config', config);
      if (res.data?.success) {
        setConfig(res.data.data);
        setHasChanges(false);
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu và cập nhật nội dung thành công. Trang chủ khách hàng đã nhận phiên bản mới nhất.'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Lỗi lưu cấu hình: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm('Khôi phục toàn bộ giao diện trang chủ, tiêu đề và dịch vụ về cài đặt gốc chuẩn của Công ty Cổ phần Lục Giác?')) {
      return;
    }
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await api.post('/admin/cms-config/reset');
      if (res.data?.success) {
        setConfig(res.data.data);
        setHasChanges(false);
        setStatusMessage({
          type: 'success',
          text: 'Đã khôi phục toàn bộ nội dung trang chủ về mặc định.'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Không thể khôi phục mặc định: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 pb-20">
      <div className="mx-auto max-w-7xl space-y-6">
        <AdminNav activeKey="CMS_CLIENT" />

        {/* HEADER QUẢN TRỊ NỘI DUNG */}
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand-blue border border-blue-200">
                  <SvgIcon name="edit" className="w-3.5 h-3.5" />
                  <span>Cấu Hình Trang Chủ</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Đồng bộ trực tiếp với Trang chủ</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Quản Trị Nội Dung Giao Diện Khách Hàng
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                Chỉnh sửa thông tin đơn vị, thông báo đầu trang, tiêu đề Hero, ảnh banner và danh mục dịch vụ hiển thị ngoài trang chủ.
              </p>
            </div>

            {/* CỤM NÚT THAO TÁC HEADER */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                title="Mở tab mới xem giao diện thực tế"
              >
                <SvgIcon name="globe" className="w-4 h-4 text-slate-600" />
                <span>Xem Trang Chủ</span>
                <SvgIcon name="external-link" className="w-3 h-3 text-slate-400" />
              </Link>

              <button
                type="button"
                onClick={handleResetDefault}
                disabled={saving || loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
                title="Trả về cấu hình gốc mặc định của hệ thống"
              >
                <SvgIcon name="refresh" className="w-4 h-4 text-slate-600" />
                <span>Khôi Phục Gốc</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={saving || loading}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition cursor-pointer disabled:opacity-50 ${
                  hasChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-brand-blue hover:bg-brand-blue-hover'
                }`}
              >
                <SvgIcon name="save" className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : hasChanges ? 'Lưu Thay Đổi *' : 'Đã Lưu Mới Nhất'}</span>
              </button>
            </div>
          </div>

          {/* THÔNG BÁO TRẠNG THÁI */}
          {statusMessage.text && (
            <div
              className={`mt-4 rounded-xl border p-4 text-xs font-bold flex items-center justify-between shadow-2xs transition-all ${
                statusMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <SvgIcon name={statusMessage.type === 'success' ? 'check-circle' : 'alert'} className="w-4 h-4 shrink-0" />
                <span>{statusMessage.text}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/" target="_blank" className="underline font-bold text-brand-blue hover:text-blue-800">
                  Kiểm tra ngay →
                </Link>
                <button
                  type="button"
                  onClick={() => setStatusMessage({ type: '', text: '' })}
                  className="text-slate-400 hover:text-slate-700 ml-2 p-1 cursor-pointer"
                  aria-label="Đóng"
                >
                  <SvgIcon name="x" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* THANH TABS */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            {[
              {
                id: 'HERO_BRAND',
                icon: 'building',
                title: 'Thương Hiệu & Phần Đầu Trang',
                desc: 'Logo, Banner, Tiêu đề chính'
              },
              {
                id: 'SERVICES',
                icon: 'wrench',
                title: `Danh Mục Dịch Vụ (${config?.services?.length || 0})`,
                desc: 'Ảnh, Bảng giá, Nội dung dịch vụ'
              },
              {
                id: 'PILLARS',
                icon: 'star',
                title: `Quy Trình Tiếp Nhận QR (${config?.pillars?.length || 0})`,
                desc: 'Các bước tiếp nhận & bảo hành'
              }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[200px] text-left rounded-xl p-3 border transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-brand-blue bg-blue-50/80 shadow-2xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SvgIcon name={tab.icon} className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-blue' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${activeTab === tab.id ? 'text-brand-blue' : 'text-slate-800'}`}>
                    {tab.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  {tab.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* LOADING */}
        {loading || !config ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
            <div className="w-10 h-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-bold text-slate-700">Đang tải cấu hình từ hệ thống...</p>
          </div>
        ) : (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            
            {/* ======================================================== */}
            {/* TAB 1: THƯƠNG HIỆU & HERO BANNER                         */}
            {/* ======================================================== */}
            {activeTab === 'HERO_BRAND' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* CỘT TRÁI: THƯƠNG HIỆU & THANH PROMO BANNER (6 CỘT) */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <SvgIcon name="building" className="w-4 h-4 text-brand-blue" />
                        <span>Thông Tin Đơn Vị &amp; Header</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        Đầu trang
                      </span>
                    </div>

                    {/* TOGGLE PROMO BANNER */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Thanh Thông Báo Đầu Trang</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Hiển thị dòng thông báo trên đầu trang chủ</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(config.brand?.showPromoBanner)}
                          onChange={(e) => handleBrandChange('showPromoBanner', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                      </label>
                    </div>

                    {config.brand?.showPromoBanner && (
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                          <SvgIcon name="bell" className="w-3.5 h-3.5 text-brand-blue" />
                          <span>Nội dung dòng thông báo</span>
                        </label>
                        <input
                          type="text"
                          value={config.brand?.promoBannerText || ''}
                          onChange={(e) => handleBrandChange('promoBannerText', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
                          placeholder="Ví dụ: Miễn phí kiểm tra lỗi tại quầy 615 Âu Cơ..."
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên Đơn Vị / Công Ty</label>
                        <input
                          type="text"
                          value={config.brand?.companyName || ''}
                          onChange={(e) => handleBrandChange('companyName', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Hotline CSKH / Kỹ Thuật</label>
                        <input
                          type="text"
                          value={config.brand?.hotline || ''}
                          onChange={(e) => handleBrandChange('hotline', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-blue focus:outline-none focus:border-brand-blue"
                          placeholder="028.3860.4999"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Nhãn Huy Hiệu (Badge) Tiêu Đề</label>
                      <input
                        type="text"
                        value={config.brand?.badgeText || ''}
                        onChange={(e) => handleBrandChange('badgeText', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa Chỉ Trụ Sở / Quầy CSKH</label>
                      <input
                        type="text"
                        value={config.brand?.address || ''}
                        onChange={(e) => handleBrandChange('address', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    {/* KHUNG QUẢN LÝ LOGO */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Logo Doanh Nghiệp (Hiển thị góc trên Website)
                      </label>
                      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <img
                          src={config.brand?.logoUrl || '/img/logo-luc-giac.png'}
                          alt="Logo Preview"
                          className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-contain p-1.5 shadow-2xs shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            type="text"
                            value={config.brand?.logoUrl || ''}
                            onChange={(e) => handleBrandChange('logoUrl', e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-brand-blue"
                            placeholder="Đường dẫn ảnh logo (URL)..."
                          />
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs transition">
                              <SvgIcon name="upload" className="w-3.5 h-3.5" />
                              <span>Tải Logo Từ Máy</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageFileUpload(e, (base64) => handleBrandChange('logoUrl', base64))}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleBrandChange('logoUrl', '/img/logo-luc-giac.png')}
                              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 underline"
                            >
                              Đặt lại logo gốc
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: HERO BANNER & TIÊU ĐỀ LỚN (6 CỘT) */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <SvgIcon name="image" className="w-4 h-4 text-brand-blue" />
                        <span>Tiêu Đề &amp; Ảnh Banner Trang Chủ</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        Banner chính
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiêu Đề Dòng 1 (Chữ đen đậm)</label>
                      <input
                        type="text"
                        value={config.hero?.titleLine1 || ''}
                        onChange={(e) => handleHeroChange('titleLine1', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiêu Đề Điểm Nhấn (Màu xanh nhận diện)</label>
                      <input
                        type="text"
                        value={config.hero?.titleHighlight || ''}
                        onChange={(e) => handleHeroChange('titleHighlight', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-black text-brand-blue focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Đoạn Văn Giới Thiệu Tổng Quan Hệ Thống</label>
                      <textarea
                        rows={3}
                        value={config.hero?.description || ''}
                        onChange={(e) => handleHeroChange('description', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-slate-700 focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiêu Đề Kiosk QR Tại Quầy</label>
                        <input
                          type="text"
                          value={config.hero?.kioskTitle || ''}
                          onChange={(e) => handleHeroChange('kioskTitle', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa Điểm Kiosk QR</label>
                        <input
                          type="text"
                          value={config.hero?.kioskBranch || ''}
                          onChange={(e) => handleHeroChange('kioskBranch', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>

                    {/* QUẢN LÝ HÌNH ẢNH HERO BANNER */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Hiển Thị Ảnh Banner Minh Họa</p>
                          <p className="text-[11px] text-slate-500">Bật để hiển thị ảnh banner bên dưới tiêu đề trang chủ</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.hero?.showBannerImage !== false}
                            onChange={(e) => handleHeroChange('showBannerImage', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                        </label>
                      </div>

                      {config.hero?.showBannerImage !== false && (
                        <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-1">
                          <img
                            src={config.hero?.bannerImageUrl || '/img/cskh-banner.svg'}
                            alt="Banner Preview"
                            className="h-24 w-40 rounded-xl border border-slate-200 object-cover bg-white p-1 shadow-2xs shrink-0"
                          />
                          <div className="flex-1 w-full space-y-2">
                            <input
                              type="text"
                              value={config.hero?.bannerImageUrl || ''}
                              onChange={(e) => handleHeroChange('bannerImageUrl', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-brand-blue"
                              placeholder="URL ảnh hoặc tải file ảnh từ máy..."
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer shadow-2xs transition">
                                <SvgIcon name="upload" className="w-3.5 h-3.5" />
                                <span>Tải Ảnh Mới</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageFileUpload(e, (base64) => handleHeroChange('bannerImageUrl', base64))}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleHeroChange('bannerImageUrl', '/img/cskh-banner.svg')}
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              >
                                Dùng ảnh SVG chuẩn
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: DANH MỤC DỊCH VỤ & BẢNG GIÁ                       */}
            {/* ======================================================== */}
            {activeTab === 'SERVICES' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <SvgIcon name="wrench" className="w-4 h-4 text-brand-blue" />
                        <span>Quản Lý Hạng Mục Dịch Vụ ({config.services?.length || 0})</span>
                      </h3>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                        Danh mục
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      Các hạng mục này hiển thị trên trang chủ khách hàng và danh sách chọn khi đặt lịch hẹn.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition shrink-0 cursor-pointer"
                  >
                    <SvgIcon name="plus" className="w-4 h-4" />
                    <span>Thêm Hạng Mục Mới</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(config.services || []).map((srv, idx) => (
                    <div
                      key={srv.id || idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-3.5 hover:border-slate-300 transition-all"
                    >
                      {/* HEADER DỊCH VỤ */}
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-brand-blue border border-blue-200">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                            {srv.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600 px-2.5 py-1 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                          title="Xóa hạng mục dịch vụ này"
                        >
                          <SvgIcon name="trash" className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>

                      {/* KHUNG ẢNH DỊCH VỤ */}
                      <div className="flex items-center gap-3.5 bg-white p-3 rounded-xl border border-slate-200">
                        <img
                          src={srv.imageUrl || '/img/cskh-banner.svg'}
                          alt={srv.title}
                          className="h-16 w-24 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            type="text"
                            value={srv.imageUrl || ''}
                            onChange={(e) => handleServiceChange(idx, 'imageUrl', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 focus:outline-none focus:border-brand-blue"
                            placeholder="URL ảnh dịch vụ..."
                          />
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-[11px] font-bold cursor-pointer transition">
                              <SvgIcon name="camera" className="w-3.5 h-3.5" />
                              <span>Tải ảnh</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageFileUpload(e, (base64) => handleServiceChange(idx, 'imageUrl', base64))}
                              />
                            </label>
                            {srv.imageUrl && (
                              <button
                                type="button"
                                onClick={() => handleServiceChange(idx, 'imageUrl', '')}
                                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                              >
                                Bỏ ảnh
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3 CỘT: ICON, TAG, BÁO GIÁ */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Biểu tượng SVG</label>
                          <div className="flex items-center gap-1.5">
                            <span className="h-8 w-8 rounded-lg bg-blue-50 text-brand-blue border border-blue-100 flex items-center justify-center shrink-0">
                              <DynamicIcon value={srv.icon} className="w-4 h-4" />
                            </span>
                            <select
                              value={srv.icon || 'laptop'}
                              onChange={(e) => handleServiceChange(idx, 'icon', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-blue"
                            >
                              {!CMS_ICON_OPTIONS.some(opt => opt.value === srv.icon) && srv.icon && (
                                <option value={srv.icon}>Hiện tại ({srv.icon})</option>
                              )}
                              {CMS_ICON_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhãn Tag</label>
                          <input
                            type="text"
                            value={srv.tag || ''}
                            onChange={(e) => handleServiceChange(idx, 'tag', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                            placeholder="Phần cứng"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Mức Giá Hiển Thị</label>
                          <input
                            type="text"
                            value={srv.priceHint || ''}
                            onChange={(e) => handleServiceChange(idx, 'priceHint', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700 focus:outline-none focus:border-brand-blue"
                            placeholder="VD: Từ 150.000đ"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tên Dịch Vụ Tiếp Nhận</label>
                        <input
                          type="text"
                          value={srv.title || ''}
                          onChange={(e) => {
                            handleServiceChange(idx, 'title', e.target.value);
                            handleServiceChange(idx, 'serviceParam', e.target.value);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô Tả Quy Cách Xử Lý</label>
                        <textarea
                          rows={2}
                          value={srv.desc || ''}
                          onChange={(e) => handleServiceChange(idx, 'desc', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: QUY TRÌNH TIẾP NHẬN QR                            */}
            {/* ======================================================== */}
            {activeTab === 'PILLARS' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <SvgIcon name="star" className="w-4 h-4 text-brand-blue" />
                      <span>Quy Trình Tiếp Nhận &amp; Theo Dõi Qua Mã QR</span>
                    </h3>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                      4 bước chuẩn
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Quy trình 4 bước từ tiếp nhận thiết bị, kiểm tra sửa chữa, bàn giao thanh toán đến bảo hành điện tử.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(config.pillars || []).map((pillar, idx) => (
                    <div
                      key={pillar.step || idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3.5 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-brand-blue font-bold text-xs border border-blue-200">
                          BƯỚC {pillar.step || `0${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Biểu tượng:</span>
                          <span className="h-8 w-8 rounded-lg bg-white text-brand-blue border border-slate-200 flex items-center justify-center">
                            <DynamicIcon value={pillar.icon} className="w-4 h-4" />
                          </span>
                          <select
                            value={pillar.icon || 'laptop'}
                            onChange={(e) => handlePillarChange(idx, 'icon', e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-blue"
                          >
                            {!CMS_ICON_OPTIONS.some(opt => opt.value === pillar.icon) && pillar.icon && (
                              <option value={pillar.icon}>Hiện tại ({pillar.icon})</option>
                            )}
                            {CMS_ICON_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tiêu Đề Bước</label>
                        <input
                          type="text"
                          value={pillar.title || ''}
                          onChange={(e) => handlePillarChange(idx, 'title', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô Tả Bước Thực Hiện</label>
                        <textarea
                          rows={2}
                          value={pillar.desc || ''}
                          onChange={(e) => handlePillarChange(idx, 'desc', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* THANH THAO TÁC CỐ ĐỊNH PHÍA DƯỚI */}
            {hasChanges && (
              <div className="sticky bottom-4 z-40 rounded-xl bg-slate-900 text-white p-4 shadow-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-xs font-bold text-amber-300">
                    Bạn đang có thay đổi chưa lưu lên trang chủ.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchConfig}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <SvgIcon name="save" className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu & Áp Dụng Ngay'}</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        )}
      </div>
    </div>
  );
}
