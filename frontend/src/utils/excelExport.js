import * as XLSX from 'xlsx';

const ROLE_NAMES = {
  GIAM_DOC: 'Giám Đốc Điều Hành (C-Level)',
  ADMIN: 'Tổng Quản Trị Hệ Thống (System Admin)',
  QUAN_LY: 'Quản Lý Cửa Hàng (Store Manager)',
  KE_TOAN: 'Kế Toán & Thu Ngân',
  THU_KHO: 'Thủ Kho Linh Kiện',
  KY_THUAT_VIEN: 'Kỹ Thuật Viên Sửa Chữa',
  LE_TAN: 'Lễ Tân & CSKH'
};

/**
 * Xuất file Excel (.xlsx) chuẩn doanh nghiệp với đầy đủ:
 * - Tên Công ty, Địa chỉ, Hotline, Website
 * - Tiêu đề Báo cáo dạng bảng chuẩn
 * - Ngày giờ xuất thực tế
 * - Tên & Chức vụ người xuất báo cáo
 * - Bảng dữ liệu tự động căn lề và độ rộng cột
 * - Dòng tổng cộng thống kê
 * - Khối chữ ký phê duyệt 3 bên (Người lập, Thủ kho/Kế toán, Ban Giám Đốc)
 */
export function exportEnterpriseExcel({
  filename = 'Bao_Cao_HungHau.xlsx',
  sheetName = 'Báo Cáo',
  title = 'BÁO CÁO HỆ THỐNG',
  headers = [],
  rows = [],
  summaryRow = null,
  signRole = 'THỦ KHO / KẾ TOÁN'
}) {
  const wb = XLSX.utils.book_new();

  const fullName = localStorage.getItem('fullName') || 'Lê Trần Tuấn Minh';
  const roleKey = localStorage.getItem('role') || 'GIAM_DOC';
  const username = localStorage.getItem('username') || 'giamdoc';
  const roleTitle = ROLE_NAMES[roleKey] || 'Nhân sự điều hành';
  const exportTime = new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const totalCols = Math.max(headers.length, 6);
  const lastColIndex = totalCols - 1;

  // Xây dựng các hàng của bảng tính
  const aoa = [
    // Dòng 1: Tiêu đề công ty
    ['CÔNG TY CỔ PHẦN PHÁT TRIỂN HÙNG HẬU — HUNGHAU HOLDINGS'],
    // Dòng 2: Chi nhánh & Trung tâm
    ['TRUNG TÂM SỬA CHỮA & BẢO HÀNH THIẾT BỊ CÔNG NGHỆ (HUNGHAU IT SUPPORT)'],
    // Dòng 3: Địa chỉ & Liên hệ
    ['Địa chỉ: 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP. Hồ Chí Minh | Hotline: 1900 6868 | Email: cskh@hunghau.edu.vn'],
    // Dòng 4: Dòng trống
    [],
    // Dòng 5: Tiêu đề báo cáo
    [title.toUpperCase()],
    // Dòng 6: Thông tin người lập & thời điểm xuất
    [`Thời điểm xuất: ${exportTime}  |  Người lập báo cáo: ${fullName} (@${username} - ${roleTitle})`],
    // Dòng 7: Phạm vi dữ liệu
    [`Đơn vị quản lý: Cơ sở chính Tân Phú  |  Tổng số bản ghi: ${rows.length} mục dữ liệu`],
    // Dòng 8: Dòng trống phân cách
    [],
    // Dòng 9: Tiêu đề các cột dữ liệu
    headers,
    // Dòng 10..N: Dữ liệu thực tế
    ...rows
  ];

  // Thêm dòng tổng cộng nếu có
  if (summaryRow && Array.isArray(summaryRow)) {
    aoa.push(summaryRow);
  }

  // Thêm khối ký duyệt chuyên nghiệp
  aoa.push([]);
  aoa.push([]);

  // Tính vị trí 3 cột ký
  const colA = 1; // Cột người lập
  const colB = Math.floor(totalCols / 2); // Cột kế toán / thủ kho
  const colC = Math.max(totalCols - 2, colB + 1); // Cột Ban Giám Đốc

  const signTitleRow = new Array(totalCols).fill('');
  signTitleRow[colA] = 'NGƯỜI LẬP BIỂU';
  signTitleRow[colB] = signRole.toUpperCase();
  signTitleRow[colC] = 'BAN GIÁM ĐỐC PHÊ DUYỆT';
  aoa.push(signTitleRow);

  const signNoteRow = new Array(totalCols).fill('');
  signNoteRow[colA] = '(Ký & ghi rõ họ tên)';
  signNoteRow[colB] = '(Ký & ghi rõ họ tên)';
  signNoteRow[colC] = '(Ký tên, đóng dấu)';
  aoa.push(signNoteRow);

  // Khoảng trống ký tên (3 dòng)
  aoa.push([]);
  aoa.push([]);
  aoa.push([]);

  const signNameRow = new Array(totalCols).fill('');
  signNameRow[colA] = fullName;
  signNameRow[colB] = 'Bộ phận phụ trách';
  signNameRow[colC] = 'Lê Trần Tuấn Minh';
  aoa.push(signNameRow);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Gộp ô (Merge cells) cho các dòng tiêu đề trên cùng
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastColIndex } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: lastColIndex } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: lastColIndex } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: lastColIndex } }
  ];

  // Tự động căn chỉnh độ rộng cột tối ưu (Auto Column Widths)
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = String(h ?? '').length;
    rows.forEach(r => {
      const val = String(r[colIdx] ?? '');
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.max(maxLen + 4, 14) };
  });

  // Nếu cột đầu là STT hoặc Mã ngắn, chỉnh nhỏ vừa phải
  if (colWidths[0]) colWidths[0].wch = Math.max(colWidths[0].wch, 8);
  ws['!cols'] = colWidths;

  // Đính kèm sheet vào workbook và xuất file
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  // Tên file đảm bảo có đuôi .xlsx
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename.replace(/\.csv$/i, '')}.xlsx`;
  XLSX.writeFile(wb, safeFilename);

  return safeFilename;
}
