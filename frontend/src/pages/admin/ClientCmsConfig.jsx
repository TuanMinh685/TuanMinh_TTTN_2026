import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';

export default function ClientCmsConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('HERO_BRAND'); // 'HERO_BRAND' | 'SERVICES' | 'PILLARS'
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

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
        text: 'Không tải được cấu hình từ Backend: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleBrandChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      brand: {
        ...(prev?.brand || {}),
        [field]: value
      }
    }));
  };

  const handleHeroChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      hero: {
        ...(prev?.hero || {}),
        [field]: value
      }
    }));
  };

  const handleServiceChange = (index, field, value) => {
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
    setConfig(prev => {
      const nextServices = [
        ...(prev?.services || []),
        {
          id: `srv-${Date.now()}`,
          icon: '🔧',
          tag: 'Dịch vụ mới',
          title: 'Dịch Vụ Kỹ Thuật Mới',
          desc: 'Mô tả chi tiết hạng mục dịch vụ hiển thị trên giao diện Client...',
          imageUrl: '/img/cskh-banner.svg',
          priceHint: 'Liên hệ báo giá',
          serviceParam: 'Dịch Vụ Kỹ Thuật Mới'
        }
      ];
      return { ...prev, services: nextServices };
    });
  };

  const handleRemoveService = (index) => {
    setConfig(prev => {
      const nextServices = (prev?.services || []).filter((_, idx) => idx !== index);
      return { ...prev, services: nextServices };
    });
  };

  const handlePillarChange = (index, field, value) => {
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
      alert('Vui lòng chọn ảnh có dung lượng nhỏ hơn 4MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
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
        setStatusMessage({
          type: 'success',
          text: '✅ Đã lưu cấu hình UI & Hình ảnh lên máy chủ Backend thành công! Trang Client đã được cập nhật tức thì.'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: '❌ Lỗi lưu cấu hình: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm('Bạn có chắc muốn khôi phục toàn bộ nội dung, hình ảnh trang Client về mặc định ban đầu?')) {
      return;
    }
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await api.post('/admin/cms-config/reset');
      if (res.data?.success) {
        setConfig(res.data.data);
        setStatusMessage({
          type: 'success',
          text: '🔄 Đã khôi phục cấu hình giao diện Client về mặc định!'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: '❌ Không thể khôi phục mặc định: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <AdminNav activeKey="CMS_CLIENT" />

        {/* Thanh tiêu đề & Nút lưu Backend */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-blue mb-1.5">
                <span>🎨 Quản Trị Dữ Liệu Giao Diện Động (Backend CMS API)</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Cấu Hình Giao Diện, Hình Ảnh &amp; Nội Dung Trang Client
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mọi thay đổi về tiêu đề, văn bản, banner thông báo, hình ảnh dịch vụ và bảng giá tại đây được lưu trực tiếp vào cơ sở dữ liệu Backend và đồng bộ thời gian thực (Socket.IO) sang trang chủ Client.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <span>👁️</span>
                <span>Xem Trang Client</span>
              </Link>
              <button
                type="button"
                onClick={handleResetDefault}
                disabled={saving || loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
              >
                <span>🔄</span>
                <span>Khôi phục mặc định</span>
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={saving || loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-blue-hover transition disabled:opacity-50 cursor-pointer"
              >
                <span>💾</span>
                <span>{saving ? 'Đang lưu lên Backend...' : 'Lưu Thay Đổi Lên Backend'}</span>
              </button>
            </div>
          </div>

          {statusMessage.text && (
            <div
              role="alert"
              className={`mt-4 rounded-xl border p-3.5 text-xs font-bold flex items-center justify-between ${
                statusMessage.type === 'success'
                  ? 'border-slate-200 bg-slate-50 text-slate-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <span>{statusMessage.text}</span>
              <Link to="/" className="underline ml-3 shrink-0 font-extrabold">
                Mở trang chủ kiểm tra ngay →
              </Link>
            </div>
          )}

          {/* Thanh chuyển Tab */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('HERO_BRAND')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'HERO_BRAND'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🖼️ 1. Thương Hiệu, Banner &amp; Tiêu Đề Trang Chủ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SERVICES')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'SERVICES'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🛠️ 2. Danh Sách Dịch Vụ, Hình Ảnh &amp; Giá ({config?.services?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PILLARS')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'PILLARS'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ⭐ 3. Bốn Trụ Cột Quy Trình QR ({config?.pillars?.length || 0})
            </button>
          </div>
        </div>

        {loading || !config ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">
            Đang tải dữ liệu cấu hình giao diện từ máy chủ Backend...
          </div>
        ) : (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            {/* TAB 1: THƯƠNG HIỆU & HERO BANNER */}
            {activeTab === 'HERO_BRAND' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Khối Thương hiệu & Thông báo */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">
                    🏢 Cấu Hình Thương Hiệu &amp; Thanh Thông Báo (Header / Promo)
                  </h3>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Hiển thị Banner Thông Báo / Khuyến Mãi đầu trang</p>
                      <p className="text-[11px] text-slate-500">Bật để hiển thị thanh thông báo nổi bật trên đầu trang chủ Client</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(config.brand?.showPromoBanner)}
                      onChange={(e) => handleBrandChange('showPromoBanner', e.target.checked)}
                      className="h-5 w-5 accent-brand-blue cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nội dung thanh thông báo khuyến mãi / sự kiện
                    </label>
                    <input
                      type="text"
                      value={config.brand?.promoBannerText || ''}
                      onChange={(e) => handleBrandChange('promoBannerText', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium"
                      placeholder="Nhập thông báo hiển thị trên đầu trang Client..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tên đơn vị / Công ty</label>
                      <input
                        type="text"
                        value={config.brand?.companyName || ''}
                        onChange={(e) => handleBrandChange('companyName', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hotline CSKH</label>
                      <input
                        type="text"
                        value={config.brand?.hotline || ''}
                        onChange={(e) => handleBrandChange('hotline', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhãn Huy Hiệu (Badge) đầu trang</label>
                    <input
                      type="text"
                      value={config.brand?.badgeText || ''}
                      onChange={(e) => handleBrandChange('badgeText', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ trung tâm CSKH</label>
                    <input
                      type="text"
                      value={config.brand?.address || ''}
                      onChange={(e) => handleBrandChange('address', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Logo Thương Hiệu (URL hoặc Tải ảnh từ máy tính)
                    </label>
                    <div className="flex items-center gap-3">
                      <img
                        src={config.brand?.logoUrl || '/img/logo-luc-giac.png'}
                        alt="Logo preview"
                        className="h-12 w-12 rounded-xl border border-slate-200 object-contain bg-slate-50 p-1 shrink-0"
                      />
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={config.brand?.logoUrl || ''}
                          onChange={(e) => handleBrandChange('logoUrl', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                          placeholder="/img/logo-luc-giac.png hoặc URL ảnh..."
                        />
                        <label className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 cursor-pointer transition">
                          <span>📁 Tải ảnh Logo mới từ máy</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileUpload(e, (base64) => handleBrandChange('logoUrl', base64))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Khối Hero Banner & Hình ảnh Trang chủ */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">
                    🖼️ Cấu Hình Tiêu Đề &amp; Hình Ảnh Banner Trang Chủ (Hero Section)
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề chính (Dòng 1)</label>
                    <input
                      type="text"
                      value={config.hero?.titleLine1 || ''}
                      onChange={(e) => handleHeroChange('titleLine1', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề điểm nhấn màu xanh (Dòng 2)</label>
                    <input
                      type="text"
                      value={config.hero?.titleHighlight || ''}
                      onChange={(e) => handleHeroChange('titleHighlight', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Đoạn văn mô tả giới thiệu hệ thống</label>
                    <textarea
                      rows={3}
                      value={config.hero?.description || ''}
                      onChange={(e) => handleHeroChange('description', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề khung Kiosk QR</label>
                      <input
                        type="text"
                        value={config.hero?.kioskTitle || ''}
                        onChange={(e) => handleHeroChange('kioskTitle', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nhãn địa điểm Kiosk QR</label>
                      <input
                        type="text"
                        value={config.hero?.kioskBranch || ''}
                        onChange={(e) => handleHeroChange('kioskBranch', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Hình ảnh Banner Hero */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Hiển thị Hình Ảnh Banner Minh Họa Trang Chủ</p>
                        <p className="text-[11px] text-slate-500">Cho phép Admin thay đổi hình ảnh quảng bá hiển thị ở đầu trang Client</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.hero?.showBannerImage !== false}
                        onChange={(e) => handleHeroChange('showBannerImage', e.target.checked)}
                        className="h-5 w-5 accent-brand-blue cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <img
                        src={config.hero?.bannerImageUrl || '/img/cskh-banner.svg'}
                        alt="Hero Banner Preview"
                        className="h-24 w-40 rounded-xl border border-slate-200 object-cover bg-white p-1 shrink-0"
                      />
                      <div className="flex-1 w-full space-y-2">
                        <input
                          type="text"
                          value={config.hero?.bannerImageUrl || ''}
                          onChange={(e) => handleHeroChange('bannerImageUrl', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                          placeholder="Nhập đường dẫn ảnh hoặc tải ảnh từ máy..."
                        />
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue hover:bg-blue-700 px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer transition">
                            <span>📁 Tải ảnh Banner từ máy tính</span>
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
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            Dùng ảnh mặc định
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DANH SÁCH DỊCH VỤ, HÌNH ẢNH & BẢNG GIÁ */}
            {activeTab === 'SERVICES' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      🛠️ Quản Lý Danh Sách Dịch Vụ, Hình Ảnh Minh Họa &amp; Báo Giá Trên Client
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bạn có thể chỉnh sửa tên dịch vụ, mô tả, báo giá, tải ảnh minh họa riêng cho từng dịch vụ hoặc thêm dịch vụ mới.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover px-4 py-2.5 text-xs font-bold text-white shadow-xs transition shrink-0 cursor-pointer"
                  >
                    <span>+ Thêm Hạng Mục Dịch Vụ Mới</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(config.services || []).map((srv, idx) => (
                    <div
                      key={srv.id || idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          Dịch vụ #{idx + 1}: {srv.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer"
                        >
                          🗑️ Xóa
                        </button>
                      </div>

                      {/* Ảnh dịch vụ */}
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
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
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px]"
                            placeholder="Để trống hoặc nhập URL / tải ảnh dịch vụ..."
                          />
                          <div className="flex flex-wrap gap-1.5">
                            <label className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition">
                              <span>📷 Tải ảnh từ máy</span>
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
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50 cursor-pointer"
                              >
                                Ẩn ảnh
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Icon</label>
                          <input
                            type="text"
                            value={srv.icon || ''}
                            onChange={(e) => handleServiceChange(idx, 'icon', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhãn (Tag)</label>
                          <input
                            type="text"
                            value={srv.tag || ''}
                            onChange={(e) => handleServiceChange(idx, 'tag', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Báo giá hiển thị</label>
                          <input
                            type="text"
                            value={srv.priceHint || ''}
                            onChange={(e) => handleServiceChange(idx, 'priceHint', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                            placeholder="VD: Từ 150.000đ"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tên hạng mục dịch vụ</label>
                        <input
                          type="text"
                          value={srv.title || ''}
                          onChange={(e) => {
                            handleServiceChange(idx, 'title', e.target.value);
                            handleServiceChange(idx, 'serviceParam', e.target.value);
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô tả chi tiết</label>
                        <textarea
                          rows={2}
                          value={srv.desc || ''}
                          onChange={(e) => handleServiceChange(idx, 'desc', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: 4 TRỤ CỘT QUY TRÌNH QR */}
            {activeTab === 'PILLARS' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                  ⭐ Cấu Hình 4 Trụ Cột Chăm Sóc Khách Hàng Qua Mã QR
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(config.pillars || []).map((pillar, idx) => (
                    <div key={pillar.step || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-brand-blue">BƯỚC {pillar.step || `0${idx + 1}`}</span>
                        <input
                          type="text"
                          value={pillar.icon || ''}
                          onChange={(e) => handlePillarChange(idx, 'icon', e.target.value)}
                          className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-sm"
                          title="Biểu tượng"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tiêu đề trụ cột</label>
                        <input
                          type="text"
                          value={pillar.title || ''}
                          onChange={(e) => handlePillarChange(idx, 'title', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô tả quy trình</label>
                        <textarea
                          rows={2}
                          value={pillar.desc || ''}
                          onChange={(e) => handlePillarChange(idx, 'desc', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
