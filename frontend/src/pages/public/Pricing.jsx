import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Pricing() {
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Để nhanh, chúng ta tạm fetch qua 1 API hoặc mảng cứng nếu chưa có API public
    // Tôi sẽ mock dữ liệu trước mắt để Giao diện hiển thị ngay lập tức
    setParts([
      { id: 1, ten: 'Màn hình LCD Dell 15.6 inch', gia: 1500000, loai: 'LAPTOP' },
      { id: 2, ten: 'Bàn phím cơ DareU', gia: 500000, loai: 'PHU_KIEN' },
      { id: 3, ten: 'Pin Laptop Asus 3 Cell', gia: 800000, loai: 'LAPTOP' },
      { id: 4, ten: 'Ram DDR4 8GB 3200MHz', gia: 600000, loai: 'LINH_KIEN' },
      { id: 5, ten: 'SSD Samsung 500GB', gia: 1200000, loai: 'LINH_KIEN' },
      { id: 6, ten: 'Phí dịch vụ Cài Win & Phần mềm', gia: 150000, loai: 'DICH_VU' },
      { id: 7, ten: 'Phí dịch vụ Vệ sinh máy', gia: 100000, loai: 'DICH_VU' },
      { id: 8, ten: 'Cứu dữ liệu ổ cứng (Dưới 500GB)', gia: 800000, loai: 'DICH_VU' }
    ]);
  }, []);

  const filteredParts = parts.filter(p => p.ten.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-slate-50 min-h-screen py-16 font-sans">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-blue mb-4">Bảng Giá Dịch Vụ & Linh Kiện</h1>
          <p className="text-slate-500 text-lg">Cam kết giá cả minh bạch - Không phát sinh chi phí ẩn - Linh kiện chính hãng</p>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t-4 border-brand-orange">
          <div className="flex-1 w-full">
             <input 
               type="text" 
               placeholder="🔍 Tìm kiếm linh kiện, dịch vụ (VD: Màn hình, Pin, Cài win...)" 
               className="w-full px-6 py-4 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-brand-blue text-lg outline-none"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </div>

        {/* Bảng giá */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-blue text-white">
                <th className="py-4 px-6 text-lg">Tên Dịch Vụ / Linh Kiện</th>
                <th className="py-4 px-6 text-lg w-48">Phân Loại</th>
                <th className="py-4 px-6 text-lg text-right w-48">Giá Tham Khảo</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length > 0 ? filteredParts.map((item, idx) => (
                <tr key={item.id} className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="py-4 px-6 font-semibold text-slate-700">{item.ten}</td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
                       {item.loai === 'LAPTOP' ? 'Laptop' : item.loai === 'DICH_VU' ? 'Dịch vụ' : 'Linh kiện'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-brand-orange text-lg">
                    {item.gia.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-slate-400 text-lg">
                    Không tìm thấy dịch vụ hoặc linh kiện nào phù hợp. Vui lòng liên hệ Hotline!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default Pricing;
