import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', keywords: [] },
  { id: 'screen', label: '💻 Màn hình & Bản lề', keywords: ['màn hình', 'bản lề'] },
  { id: 'battery', label: '🔋 Pin & Sạc Adapter', keywords: ['pin', 'sạc'] },
  { id: 'memory', label: '⚡ RAM & Ổ cứng SSD', keywords: ['ram', 'ssd', 'ổ cứng'] },
  { id: 'keyboard', label: '⌨️ Bàn phím & Chuột', keywords: ['bàn phím', 'phím'] },
  { id: 'cooling', label: '❄️ Vệ sinh & Tản nhiệt', keywords: ['keo tản nhiệt', 'vệ sinh', 'quạt'] },
  { id: 'software', label: '🛠️ Dịch vụ & Phần mềm', keywords: ['windows', 'office', 'adobe', 'dữ liệu', 'driver'] }
];

const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả mức giá', min: 0, max: Infinity },
  { id: 'under300', label: '< 300.000 đ', min: 0, max: 300000 },
  { id: '300to800', label: '300.000 - 800.000 đ', min: 300000, max: 800000 },
  { id: '800to1500', label: '800.000 - 1.500.000 đ', min: 800000, max: 1500000 },
  { id: 'above1500', label: '> 1.500.000 đ', min: 1500000, max: Infinity }
];

const SORT_OPTIONS = [
  { id: 'default', label: '★ Phổ biến / Đề xuất' },
  { id: 'priceAsc', label: 'Giá thấp → cao ⬆' },
  { id: 'priceDesc', label: 'Giá cao → thấp ⬇' },
  { id: 'nameAsc', label: 'Tên A → Z' },
  { id: 'studentDiscount', label: 'Tiết kiệm SV nhiều nhất 🎓' }
];

function Pricing() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialQ = new URLSearchParams(location.search).get('q') || '';
  const initialCategory = (() => {
    if (!initialQ) return 'all';
    const lower = initialQ.toLowerCase();
    if (lower.includes('pin') || lower.includes('sạc')) return 'battery';
    if (lower.includes('màn hình') || lower.includes('bản lề')) return 'screen';
    if (lower.includes('ram') || lower.includes('ssd')) return 'memory';
    if (lower.includes('phím')) return 'keyboard';
    if (lower.includes('vệ sinh') || lower.includes('keo')) return 'cooling';
    return 'all';
  })();

  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPricing = () => {
    setLoading(true);
    setError('');
    api.get('/public/pricing')
      .then(response => {
        setParts(response.data.data || []);
      })
      .catch(requestError => {
        setError(requestError.response?.data?.message || 'Không tải được bảng giá. Vui lòng bấm Thử lại.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    api.get('/public/pricing')
      .then(response => {
        if (!ignore) {
          setParts(response.data.data || []);
        }
      })
      .catch(requestError => {
        if (!ignore) {
          setError(requestError.response?.data?.message || 'Không tải được bảng giá. Vui lòng bấm Thử lại.');
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

  // Filter & Sort Logic
  const filteredAndSortedParts = useMemo(() => {
    let result = [...parts];

    // 1. Search Query Filter
    if (search.trim()) {
      const searchTerms = search.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      result = result.filter(part => {
        const itemName = part.ten_linh_kien.toLowerCase();
        return searchTerms.some(term => itemName.includes(term));
      });
    }

    // 2. Category Tab Filter
    if (selectedCategory !== 'all') {
      const catObj = CATEGORIES.find(c => c.id === selectedCategory);
      if (catObj && catObj.keywords.length > 0) {
        result = result.filter(part => {
          const lower = part.ten_linh_kien.toLowerCase();
          return catObj.keywords.some(kw => lower.includes(kw));
        });
      }
    }

    // 3. Price Range Filter
    if (selectedPriceRange !== 'all') {
      const range = PRICE_RANGES.find(r => r.id === selectedPriceRange);
      if (range) {
        result = result.filter(part => {
          const price = Number(part.gia_ban);
          return price >= range.min && price < range.max;
        });
      }
    }

    // 4. Sorting
    result.sort((a, b) => {
      const priceA = Number(a.gia_ban);
      const priceB = Number(b.gia_ban);
      if (sortBy === 'priceAsc') return priceA - priceB;
      if (sortBy === 'priceDesc') return priceB - priceA;
      if (sortBy === 'nameAsc') return a.ten_linh_kien.localeCompare(b.ten_linh_kien, 'vi');
      if (sortBy === 'studentDiscount') {
        const discA = Math.round(priceA * 0.15);
        const discB = Math.round(priceB * 0.15);
        return discB - discA;
      }
      return 0; // default order
    });

    return result;
  }, [parts, search, selectedCategory, selectedPriceRange, sortBy]);

  // Handle single item booking
  const handleBookService = (serviceName) => {
    navigate('/dat-lich', { state: { serviceName } });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 font-sans relative">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header Title */}
        <div className="text-center mb-10">
          <span className="text-xs font-black tracking-widest text-brand-orange uppercase bg-orange-100 px-3 py-1 rounded-full">
            Biểu Phí Niêm Yết & Trợ Giá 2026
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-brand-blue mt-3 mb-3">
            Bảng Giá Dịch Vụ & Linh Kiện Chính Hãng
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
            Hơn 30+ linh kiện chuẩn zin, báo giá minh bạch, miễn phí công lắp đặt và bảo hành điện tử e-Warranty tới 36 tháng.
          </p>
        </div>

        {/* Banner Trợ giá Học sinh - Sinh viên toàn quốc */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 text-9xl">🎓</div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-900 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                ★ Đặc quyền sinh viên toàn quốc
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                Giảm Trực Tiếp 15% Toàn Bộ Bảng Giá
              </h2>
              <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
                Áp dụng cho học sinh, sinh viên tất cả các trường ĐH/CĐ (VHU, Bách Khoa, KHTN, UEH, HUTECH, Văn Lang, IUH, Tôn Đức Thắng...) khi đặt lịch trước online.
              </p>
            </div>
            <button 
              onClick={() => navigate('/dat-lich')}
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-2xl whitespace-nowrap shadow-lg transition-transform hover:scale-105 text-base"
            >
              Đặt lịch nhận ưu đãi 15% →
            </button>
          </div>
        </div>

        {/* BỘ LỌC ĐA NĂNG (FILTER TOOLBAR) */}
        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 mb-8 space-y-5">
          
          {/* Hàng 1: Thanh Tìm Kiếm + Bộ chuyển đổi Chế độ xem */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm linh kiện, dịch vụ (VD: Màn hình, Pin, RAM, Cài win, Keo tản nhiệt...)" 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-blue text-slate-800 text-base outline-none pr-12 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-200 hover:bg-slate-300 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Chuyển View Dạng Bảng / Dạng Thẻ */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl self-end md:self-auto border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📋</span> Dạng Bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  viewMode === 'cards' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🎴</span> Dạng Thẻ
              </button>
            </div>
          </div>

          {/* Hàng 2: Tab Phân Loại Danh Mục (Category Tabs) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (search && cat.id !== 'all') setSearch('');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active 
                      ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20 scale-105' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Hàng 3: Lọc Theo Khoảng Giá & Sắp Xếp */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
            {/* Lọc khoảng giá */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="font-bold text-slate-500 whitespace-nowrap">Mức giá:</span>
              <div className="flex gap-1.5">
                {PRICE_RANGES.map(range => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setSelectedPriceRange(range.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      selectedPriceRange === range.id
                        ? 'bg-amber-400 text-slate-900 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sắp xếp */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadPricing}
              className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-blue-800"
            >
              🔄 Tải lại ngay
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 text-center text-slate-500 font-bold flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            <span>Đang tải bảng giá và danh mục linh kiện...</span>
          </div>
        )}

        {/* HIỂN THỊ KẾT QUẢ: 2 CHẾ ĐỘ VIEW (BẢNG HOẶC THẺ) */}
        {!loading && !error && (
          <>
            {/* Thanh hiển thị số lượng kết quả */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-3 px-1">
              <span>Tìm thấy {filteredAndSortedParts.length} linh kiện & dịch vụ phù hợp</span>
            </div>

            {/* CHẾ ĐỘ 1: DẠNG BẢNG (TABLE VIEW) */}
            {viewMode === 'table' ? (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-brand-blue to-blue-900 text-white text-sm">
                        <th className="py-4 px-6">Tên Dịch Vụ / Linh Kiện</th>
                        <th className="py-4 px-6 text-right w-40">Giá Niêm Yết</th>
                        <th className="py-4 px-6 text-right w-44 text-amber-300">Giá Sinh Viên (-15%)</th>
                        <th className="py-4 px-6 text-center w-36">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAndSortedParts.length > 0 ? filteredAndSortedParts.map((item, idx) => {
                        const regularPrice = Number(item.gia_ban);
                        const studentPrice = Math.round(regularPrice * 0.85);
                        return (
                          <tr 
                            key={item.id} 
                            className={`transition-colors ${idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/70'}`}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3.5">
                                {item.hinh_anh ? (
                                  <img
                                    src={item.hinh_anh}
                                    alt={item.ten_linh_kien}
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                                    ⚙️
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-800 text-base">{item.ten_linh_kien}</div>
                                  <div className="text-xs text-green-700 font-semibold flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">Chính Hãng</span>
                                    <span>🛡️ Bảo hành 12 - 36 tháng</span>
                                    <span className="text-slate-300">•</span>
                                    <span>Serial/IMEI kiểm soát</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-400 text-sm line-through whitespace-nowrap">
                              {regularPrice.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-4 px-6 text-right font-black text-brand-orange text-lg whitespace-nowrap">
                              <div>{studentPrice.toLocaleString('vi-VN')} đ</div>
                              <span className="inline-block text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black mt-0.5">
                                🎓 Tiết kiệm {Math.round(regularPrice * 0.15).toLocaleString('vi-VN')} đ
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleBookService(item.ten_linh_kien)}
                                className="px-5 py-2.5 bg-brand-green text-white font-bold text-sm rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-1.5"
                              >
                                <span>Đặt lịch</span>
                                <span>→</span>
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="4" className="py-16 text-center text-slate-400 text-base">
                            Không tìm thấy dịch vụ hoặc linh kiện phù hợp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ 2: DẠNG THẺ (CARDS VIEW) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedParts.length > 0 ? filteredAndSortedParts.map(item => {
                  const regularPrice = Number(item.gia_ban);
                  const studentPrice = Math.round(regularPrice * 0.85);
                  return (
                    <div 
                      key={item.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Ảnh linh kiện */}
                        <div className="relative w-full h-44 mb-4 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 group">
                          {item.hinh_anh ? (
                            <img
                              src={item.hinh_anh}
                              alt={item.ten_linh_kien}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <span className="text-4xl">⚙️</span>
                              <span className="text-[10px] text-slate-400 mt-1 font-semibold">Chính hãng</span>
                            </div>
                          )}
                          <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-xs">
                            Chính hãng 100%
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-800 text-base mb-2 leading-snug">
                          {item.ten_linh_kien}
                        </h3>

                        <div className="text-xs text-slate-500 space-y-1 mb-4">
                          <div className="flex items-center gap-1.5 text-green-700 font-semibold">
                            <span>🛡️</span> Bảo hành chính hãng 12 - 36 tháng
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>🔍</span> Quản lý theo Serial/IMEI linh kiện
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>⚡</span> Miễn phí vệ sinh & công lắp ráp
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-baseline mb-3">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Giá niêm yết:</div>
                            <div className="text-sm font-semibold text-slate-400 line-through">
                              {regularPrice.toLocaleString('vi-VN')} đ
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-brand-orange uppercase">Ưu đãi sinh viên:</div>
                            <div className="text-2xl font-black text-brand-orange">
                              {studentPrice.toLocaleString('vi-VN')} đ
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBookService(item.ten_linh_kien)}
                          className="w-full py-2.5 bg-brand-green text-white font-bold text-sm rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <span>📅 Đặt lịch sửa ngay</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-16 text-center text-slate-400 text-base bg-white rounded-3xl border border-slate-200">
                    Không tìm thấy linh kiện phù hợp với lựa chọn của bạn.
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default Pricing;
