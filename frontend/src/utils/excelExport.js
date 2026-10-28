import ExcelJS from 'exceljs';

const ROLE_NAMES = {
  GIAM_DOC: 'Giám Đốc Điều Hành',
  ADMIN: 'Tổng Quản Trị Hệ Thống',
  QUAN_LY: 'Quản Lý Cửa Hàng',
  KE_TOAN: 'Kế Toán & Thu Ngân',
  THU_KHO: 'Thủ Kho Linh Kiện',
  KY_THUAT_VIEN: 'Kỹ Thuật Viên Sửa Chữa',
  LE_TAN: 'Lễ Tân & CSKH'
};

const BORDER_THIN = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

const BORDER_DOUBLE_BOTTOM = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'double', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

/**
 * Xuất file Excel (.xlsx) chuẩn doanh nghiệp với:
 * - Font chữ: 100% Times New Roman
 * - Khung viền ô (cell borders) rõ ràng, kẻ bảng chuẩn hành chính
 * - Tiêu đề cơ quan chủ quản, tiêu đề báo cáo căn giữa in hoa
 * - Định dạng số tiền có dấu phẩy phân cách hàng nghìn (#,##0)
 * - Tự động giãn cột, không che khuất dữ liệu
 * - Dòng tổng cộng kế toán viền đôi
 * - Khối chữ ký phê duyệt 3 bên (Người lập, Thủ kho/Kế toán, Ban Giám Đốc)
 */
export async function exportEnterpriseExcel({
  filename = 'Bao_Cao.xlsx',
  sheetName = 'Báo Cáo',
  title = 'BÁO CÁO HỆ THỐNG',
  headers = [],
  rows = [],
  summaryRow = null,
  signRole = 'THỦ KHO / KẾ TOÁN'
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HungHau IT Support';
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName.substring(0, 31), {
    views: [{ showGridLines: true }]
  });

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

  const numCols = Math.max(headers.length, 7);

  // Helper chuyển đổi số cột (1-indexed) sang chữ cái Excel (1 -> A, 2 -> B...)
  const getColLetter = (colIdx) => {
    let letter = '';
    while (colIdx > 0) {
      const rem = (colIdx - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      colIdx = Math.floor((colIdx - 1) / 26);
    }
    return letter;
  };

  const lastColLetter = getColLetter(numCols);
  const midColLetter1 = getColLetter(Math.max(Math.floor(numCols / 2), 3));
  const midColLetter2 = getColLetter(Math.max(Math.floor(numCols / 2) + 1, 4));

  // --- DÒNG 1, 2, 3: HEADER QUỐC HIỆU & DOANH NGHIỆP ---
  ws.mergeCells(`A1:${midColLetter1}1`);
  const cA1 = ws.getCell('A1');
  cA1.value = 'CÔNG TY CỔ PHẦN PHÁT TRIỂN HÙNG HẬU';
  cA1.font = { name: 'Times New Roman', size: 11, bold: true };
  cA1.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells(`${midColLetter2}1:${lastColLetter}1`);
  const cRight1 = ws.getCell(`${midColLetter2}1`);
  cRight1.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  cRight1.font = { name: 'Times New Roman', size: 11, bold: true };
  cRight1.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`A2:${midColLetter1}2`);
  const cA2 = ws.getCell('A2');
  cA2.value = 'TRUNG TÂM SỬA CHỮA HUNGHAU IT SUPPORT';
  cA2.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF0D457B' } };
  cA2.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells(`${midColLetter2}2:${lastColLetter}2`);
  const cRight2 = ws.getCell(`${midColLetter2}2`);
  cRight2.value = 'Độc lập - Tự do - Hạnh phúc';
  cRight2.font = { name: 'Times New Roman', size: 11, bold: true, italic: true };
  cRight2.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`A3:${midColLetter1}3`);
  const cA3 = ws.getCell('A3');
  cA3.value = 'Đ/C: 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM | Hotline: 1900 6868';
  cA3.font = { name: 'Times New Roman', size: 10, italic: true, color: { argb: 'FF555555' } };
  cA3.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells(`${midColLetter2}3:${lastColLetter}3`);
  const cRight3 = ws.getCell(`${midColLetter2}3`);
  cRight3.value = '---------------o0o---------------';
  cRight3.font = { name: 'Times New Roman', size: 10 };
  cRight3.alignment = { horizontal: 'center', vertical: 'middle' };

  // Dòng 4 trống
  ws.addRow([]);

  // --- DÒNG 5, 6, 7: TIÊU ĐỀ BÁO CÁO & METADATA ---
  const titleRowIdx = 5;
  ws.mergeCells(`A${titleRowIdx}:${lastColLetter}${titleRowIdx}`);
  const cTitle = ws.getCell(`A${titleRowIdx}`);
  cTitle.value = title.toUpperCase();
  cTitle.font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FF000000' } };
  cTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(titleRowIdx).height = 26;

  const metaRowIdx = 6;
  ws.mergeCells(`A${metaRowIdx}:${lastColLetter}${metaRowIdx}`);
  const cMeta = ws.getCell(`A${metaRowIdx}`);
  cMeta.value = `Thời điểm xuất: ${exportTime}  |  Người lập báo cáo: ${fullName} (@${username} - ${roleTitle})`;
  cMeta.font = { name: 'Times New Roman', size: 11, italic: true };
  cMeta.alignment = { horizontal: 'center', vertical: 'middle' };

  const scopeRowIdx = 7;
  ws.mergeCells(`A${scopeRowIdx}:${lastColLetter}${scopeRowIdx}`);
  const cScope = ws.getCell(`A${scopeRowIdx}`);
  cScope.value = `Đơn vị chi nhánh: 615 Âu Cơ, Tân Phú, TP.HCM  |  Tổng số danh mục: ${rows.length} mục dữ liệu`;
  cScope.font = { name: 'Times New Roman', size: 10, italic: true, color: { argb: 'FF444444' } };
  cScope.alignment = { horizontal: 'center', vertical: 'middle' };

  // Dòng 8 trống
  ws.addRow([]);

  // --- DÒNG 9: HÀNG TIÊU ĐỀ BẢNG (TABLE HEADER) ---
  const headerRow = ws.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF000000' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    cell.border = BORDER_THIN;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // --- DÒNG 10..N: DỮ LIỆU BẢNG ---
  rows.forEach((rowVals) => {
    const row = ws.addRow(rowVals);
    row.height = 22;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.border = BORDER_THIN;

      const val = cell.value;
      if (typeof val === 'number') {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (colNum === 1 || colNum === 2) {
        // STT hoặc Mã phiếu / Mã LK
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (String(val).startsWith('ĐỦ') || String(val).startsWith('HẾT') || String(val).startsWith('CẢNH') || String(val).startsWith('Chờ') || String(val).startsWith('Đang') || String(val).startsWith('Đã')) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  // --- DÒNG TỔNG CỘNG NẾU CÓ ---
  if (summaryRow && Array.isArray(summaryRow)) {
    const sumRow = ws.addRow(summaryRow);
    sumRow.height = 24;
    sumRow.eachCell((cell) => {
      cell.font = { name: 'Times New Roman', size: 11, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      cell.border = BORDER_DOUBLE_BOTTOM;

      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  }

  // --- KHỐI CHỮ KÝ PHÊ DUYỆT 3 BÊN ---
  ws.addRow([]);
  ws.addRow([]);

  const signTitleRowIdx = ws.rowCount + 1;
  const colA_start = 1;
  const colA_end = Math.max(2, Math.floor(numCols * 0.3));
  const colB_start = colA_end + 1;
  const colB_end = Math.max(colB_start + 1, Math.floor(numCols * 0.7));
  const colC_start = colB_end + 1;
  const colC_end = numCols;

  ws.mergeCells(`${getColLetter(colA_start)}${signTitleRowIdx}:${getColLetter(colA_end)}${signTitleRowIdx}`);
  const sA = ws.getCell(`${getColLetter(colA_start)}${signTitleRowIdx}`);
  sA.value = 'NGƯỜI LẬP BIỂU';
  sA.font = { name: 'Times New Roman', size: 11, bold: true };
  sA.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`${getColLetter(colB_start)}${signTitleRowIdx}:${getColLetter(colB_end)}${signTitleRowIdx}`);
  const sB = ws.getCell(`${getColLetter(colB_start)}${signTitleRowIdx}`);
  sB.value = signRole.toUpperCase();
  sB.font = { name: 'Times New Roman', size: 11, bold: true };
  sB.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`${getColLetter(colC_start)}${signTitleRowIdx}:${getColLetter(colC_end)}${signTitleRowIdx}`);
  const sC = ws.getCell(`${getColLetter(colC_start)}${signTitleRowIdx}`);
  sC.value = 'BAN GIÁM ĐỐC PHÊ DUYỆT';
  sC.font = { name: 'Times New Roman', size: 11, bold: true };
  sC.alignment = { horizontal: 'center', vertical: 'middle' };

  // Dòng chú thích "(Ký & ghi rõ họ tên)"
  const signNoteRowIdx = signTitleRowIdx + 1;
  ws.mergeCells(`${getColLetter(colA_start)}${signNoteRowIdx}:${getColLetter(colA_end)}${signNoteRowIdx}`);
  const nA = ws.getCell(`${getColLetter(colA_start)}${signNoteRowIdx}`);
  nA.value = '(Ký & ghi rõ họ tên)';
  nA.font = { name: 'Times New Roman', size: 10, italic: true };
  nA.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`${getColLetter(colB_start)}${signNoteRowIdx}:${getColLetter(colB_end)}${signNoteRowIdx}`);
  const nB = ws.getCell(`${getColLetter(colB_start)}${signNoteRowIdx}`);
  nB.value = '(Ký & ghi rõ họ tên)';
  nB.font = { name: 'Times New Roman', size: 10, italic: true };
  nB.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`${getColLetter(colC_start)}${signNoteRowIdx}:${getColLetter(colC_end)}${signNoteRowIdx}`);
  const nC = ws.getCell(`${getColLetter(colC_start)}${signNoteRowIdx}`);
  nC.value = '(Ký tên, đóng dấu)';
  nC.font = { name: 'Times New Roman', size: 10, italic: true };
  nC.alignment = { horizontal: 'center', vertical: 'middle' };

  // 3 dòng trống để ký
  ws.addRow([]);
  ws.addRow([]);
  ws.addRow([]);

  // Dòng họ tên người ký
  const signNameRowIdx = ws.rowCount + 1;
  ws.mergeCells(`${getColLetter(colA_start)}${signNameRowIdx}:${getColLetter(colA_end)}${signNameRowIdx}`);
  const nameA = ws.getCell(`${getColLetter(colA_start)}${signNameRowIdx}`);
  nameA.value = fullName;
  nameA.font = { name: 'Times New Roman', size: 11, bold: true };
  nameA.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`${getColLetter(colB_start)}${signNameRowIdx}:${getColLetter(colB_end)}${signNameRowIdx}`);
  const nameB = ws.getCell(`${getColLetter(colB_start)}${signNameRowIdx}`);
  nameB.value = 'Bộ phận phụ trách';
  nameB.font = { name: 'Times New Roman', size: 11, bold: true };
  nameB.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`${getColLetter(colC_start)}${signNameRowIdx}:${getColLetter(colC_end)}${signNameRowIdx}`);
  const nameC = ws.getCell(`${getColLetter(colC_start)}${signNameRowIdx}`);
  nameC.value = 'Lê Trần Tuấn Minh';
  nameC.font = { name: 'Times New Roman', size: 11, bold: true };
  nameC.alignment = { horizontal: 'center', vertical: 'middle' };

  // --- TÍNH TOÁN ĐỘ RỘNG CỘT TỰ ĐỘNG CHUẨN XÁC ---
  ws.columns = headers.map((h, colIdx) => {
    let maxLen = String(h ?? '').length;
    rows.forEach((r) => {
      const val = String(r[colIdx] ?? '');
      if (val.length > maxLen) maxLen = val.length;
    });
    // Đảm bảo không cột nào quá hẹp
    let w = Math.max(maxLen + 4, 14);
    if (colIdx === 0) w = Math.max(w, 8); // Cột STT
    if (colIdx === 1) w = Math.max(w, 16); // Cột Mã
    if (colIdx === 2) w = Math.max(w, 38); // Cột Tên
    return { width: w };
  });

  // Xuất file và kích hoạt tải về trên trình duyệt
  const buffer = await wb.xlsx.writeBuffer();
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename.replace(/\.csv$/i, '')}.xlsx`;

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return safeFilename;
}

