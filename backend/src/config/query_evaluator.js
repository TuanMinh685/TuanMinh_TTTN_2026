const { loadStore, saveStore } = require('./local_store');

function executeMockQuery(sql, params = []) {
    const s = loadStore();
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. nhan_vien login (supports username or email)
    if (/SELECT .* FROM nhan_vien WHERE .*ten_dang_nhap/i.test(cleanSql)) {
        const p0 = String(params[0] || '').trim().toLowerCase();
        const p1 = String(params[1] || p0.split('@')[0]).trim().toLowerCase();
        const u = s.nhan_vien.find(x => x.ten_dang_nhap.toLowerCase() === p0 || x.ten_dang_nhap.toLowerCase() === p1);
        return { rows: u ? [{ ...u }] : [] };
    }

    // 2. nhan_vien getMe / by id
    if (/SELECT .* FROM nhan_vien WHERE id = \$1/i.test(cleanSql)) {
        const u = s.nhan_vien.find(x => x.id === Number(params[0]));
        return { rows: u ? [{ ...u }] : [] };
    }

    // 3. nhan_vien list
    if (/SELECT .* FROM nhan_vien/i.test(cleanSql)) {
        const sorted = [...s.nhan_vien].sort((a, b) => a.id - b.id);
        return { rows: sorted.map(({ mat_khau, ...rest }) => ({ ...rest })) };
    }

    // 3b. nhan_vien insert
    if (/INSERT INTO nhan_vien/i.test(cleanSql)) {
        const newId = s.nhan_vien.length > 0 ? Math.max(...s.nhan_vien.map(x => x.id)) + 1 : 1;
        const emp = {
            id: newId,
            ten_dang_nhap: String(params[0]).trim(),
            mat_khau: params[1],
            ho_ten: String(params[2]).trim(),
            vai_tro: params[3],
            trang_thai: params[4] || 'HOAT_DONG',
            ngay_tao: new Date().toISOString()
        };
        s.nhan_vien.push(emp);
        saveStore();
        const { mat_khau, ...safeEmp } = emp;
        return { rows: [safeEmp] };
    }

    // 3c. nhan_vien update with password
    if (/UPDATE nhan_vien SET ho_ten = \$1, vai_tro = \$2, trang_thai = \$3, mat_khau = \$4 WHERE id = \$5/i.test(cleanSql)) {
        const emp = s.nhan_vien.find(x => x.id === Number(params[4]));
        if (!emp) return { rows: [] };
        emp.ho_ten = String(params[0]).trim();
        emp.vai_tro = params[1];
        emp.trang_thai = params[2];
        emp.mat_khau = params[3];
        saveStore();
        const { mat_khau, ...safeEmp } = emp;
        return { rows: [safeEmp] };
    }

    // 3d. nhan_vien update without password
    if (/UPDATE nhan_vien SET ho_ten = \$1, vai_tro = \$2, trang_thai = \$3 WHERE id = \$4/i.test(cleanSql)) {
        const emp = s.nhan_vien.find(x => x.id === Number(params[3]));
        if (!emp) return { rows: [] };
        emp.ho_ten = String(params[0]).trim();
        emp.vai_tro = params[1];
        emp.trang_thai = params[2];
        saveStore();
        const { mat_khau, ...safeEmp } = emp;
        return { rows: [safeEmp] };
    }

    // 3e. nhan_vien delete
    if (/DELETE FROM nhan_vien WHERE id = \$1/i.test(cleanSql)) {
        const idx = s.nhan_vien.findIndex(x => x.id === Number(params[0]));
        if (idx === -1) return { rows: [] };
        const [removed] = s.nhan_vien.splice(idx, 1);
        saveStore();
        const { mat_khau, ...safeEmp } = removed;
        return { rows: [safeEmp] };
    }

    // 4. ticket_sessions
    if (/INSERT INTO ticket_sessions/i.test(cleanSql)) {
        if (!Array.isArray(s.ticket_sessions)) s.ticket_sessions = [];
        const newId = s.ticket_sessions.length > 0 ? Math.max(...s.ticket_sessions.map(x => x.id)) + 1 : 1;
        const sess = {
            id: newId,
            session_token: params[0],
            qr_image_base64: params[1],
            status: 'ACTIVE',
            expires_at: params[2],
            created_by: params[3] || null,
            ticket_id: null,
            submitted_at: null,
            created_at: new Date().toISOString()
        };
        s.ticket_sessions.push(sess);
        saveStore();
        return { rows: [sess] };
    }
    if (/SELECT .* FROM ticket_sessions WHERE session_token = \$1/i.test(cleanSql)) {
        if (!Array.isArray(s.ticket_sessions)) s.ticket_sessions = [];
        const sess = s.ticket_sessions.find(x => x.session_token === params[0]);
        return { rows: sess ? [{ ...sess }] : [] };
    }
    if (/UPDATE ticket_sessions SET status = 'SUBMITTED'/i.test(cleanSql)) {
        if (!Array.isArray(s.ticket_sessions)) s.ticket_sessions = [];
        const sess = s.ticket_sessions.find(x => x.session_token === params[1]);
        if (!sess) return { rows: [] };
        sess.status = 'SUBMITTED';
        sess.ticket_id = Number(params[0]);
        sess.submitted_at = new Date().toISOString();
        saveStore();
        return { rows: [sess] };
    }

    // 5. hinh_anh_phieu get for ticket
    if (/SELECT .* FROM hinh_anh_phieu WHERE phieu_sua_chua_id = \$1/i.test(cleanSql)) {
        const ticketId = Number(params[0]);
        const imgs = s.hinh_anh_phieu.filter(img => img.phieu_sua_chua_id === ticketId);
        return { rows: imgs };
    }

    // 6. hinh_anh_phieu insert
    if (/INSERT INTO hinh_anh_phieu/i.test(cleanSql)) {
        const newId = s.hinh_anh_phieu.length > 0 ? Math.max(...s.hinh_anh_phieu.map(x => x.id)) + 1 : 1;
        const img = {
            id: newId,
            phieu_sua_chua_id: Number(params[0]),
            duong_dan_anh: params[1],
            loai_anh: params[2] || 'NGOAI_QUAN',
            ghi_chu: params[3] || '',
            ngay_tao: new Date().toISOString()
        };
        s.hinh_anh_phieu.push(img);
        saveStore();
        return { rows: [img] };
    }

    // 7. khach_hang find by phone or update
    if (/SELECT .* FROM khach_hang WHERE so_dien_thoai = \$1/i.test(cleanSql)) {
        const k = s.khach_hang.find(x => x.so_dien_thoai === params[0]);
        return { rows: k ? [{ ...k }] : [] };
    }
    if (/UPDATE khach_hang SET ho_ten = \$1 WHERE id = \$2/i.test(cleanSql)) {
        const k = s.khach_hang.find(x => x.id === Number(params[1]));
        if (k) {
            k.ho_ten = params[0];
            saveStore();
        }
        return { rows: [] };
    }

    // 8. khach_hang insert
    if (/INSERT INTO khach_hang/i.test(cleanSql)) {
        const newId = s.khach_hang.length > 0 ? Math.max(...s.khach_hang.map(x => x.id)) + 1 : 1;
        const k = {
            id: newId,
            ho_ten: params[0],
            so_dien_thoai: params[1],
            zalo_id: params[2] || null,
            ngay_tao: new Date().toISOString()
        };
        s.khach_hang.push(k);
        saveStore();
        return { rows: [{ id: newId }] };
    }

    // 9. thiet_bi insert
    if (/INSERT INTO thiet_bi/i.test(cleanSql)) {
        const newId = s.thiet_bi.length > 0 ? Math.max(...s.thiet_bi.map(x => x.id)) + 1 : 1;
        const hasSerial = params.length >= 4;
        const tb = {
            id: newId,
            khach_hang_id: Number(params[0]),
            ten_may: params[1],
            so_imei_serial: hasSerial ? (params[2] || null) : null,
            tinh_trang_may: hasSerial ? (params[3] || '') : (params[2] || ''),
            ngay_tao: new Date().toISOString()
        };
        s.thiet_bi.push(tb);
        saveStore();
        return { rows: [{ id: newId }] };
    }

    // 10. phieu_sua_chua insert
    if (/INSERT INTO phieu_sua_chua/i.test(cleanSql)) {
        const newId = s.phieu_sua_chua.length > 0 ? Math.max(...s.phieu_sua_chua.map(x => x.id)) + 1 : 1;
        const p = {
            id: newId,
            thiet_bi_id: Number(params[0]),
            ma_tra_cuu: params[1],
            loai_dich_vu: params[2] || 'OFFLINE',
            trang_thai: 'CHỜ_KHÁM',
            han_bao_hanh: null,
            ngay_tao: new Date().toISOString(),
            ngay_cap_nhat: new Date().toISOString()
        };
        s.phieu_sua_chua.push(p);
        saveStore();
        return { rows: [{ id: newId, ma_tra_cuu: p.ma_tra_cuu, loai_dich_vu: p.loai_dich_vu, trang_thai: p.trang_thai, ngay_tao: p.ngay_tao }] };
    }

    // 11. nhat_ky_sua_chua insert
    if (/INSERT INTO nhat_ky_sua_chua/i.test(cleanSql)) {
        const newId = s.nhat_ky_sua_chua.length > 0 ? Math.max(...s.nhat_ky_sua_chua.map(x => x.id)) + 1 : 1;
        const nk = {
            id: newId,
            phieu_sua_chua_id: Number(params[0]),
            trang_thai_moi: params.length === 5 ? params[3] : (params[1] || 'CHỜ_KHÁM'),
            ghi_chu: params.length === 5 ? params[4] : (params[2] || 'Khách hàng vừa tạo yêu cầu tiếp nhận qua mã QR'),
            ngay_tao: new Date().toISOString()
        };
        s.nhat_ky_sua_chua.push(nk);
        saveStore();
        return { rows: [{ id: newId }] };
    }

    // 12. nhat_ky_sua_chua get by phieu_sua_chua_id
    if (/SELECT .* FROM nhat_ky_sua_chua WHERE phieu_sua_chua_id = \$1/i.test(cleanSql)) {
        const ticketId = Number(params[0]);
        const list = s.nhat_ky_sua_chua
            .filter(x => x.phieu_sua_chua_id === ticketId)
            .sort((a, b) => new Date(b.ngay_tao) - new Date(a.ngay_tao));
        return { rows: list };
    }

    // 13. trackTicket by ma_tra_cuu or id
    if (/SELECT .* FROM phieu_sua_chua p .* WHERE (?:p\.)?(?:ma_tra_cuu|id) = \$1/i.test(cleanSql)) {
        const key = params[0];
        const isNum = typeof key === 'number' || /^\d+$/.test(String(key).trim());
        const p = isNum 
            ? (s.phieu_sua_chua.find(x => x.id === Number(key)) || s.phieu_sua_chua.find(x => x.ma_tra_cuu === key))
            : s.phieu_sua_chua.find(x => x.ma_tra_cuu === key);
        if (!p) return { rows: [] };
        const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
        const kh = s.khach_hang.find(x => x.id === tb.khach_hang_id) || {};
        const da_danh_gia = s.danh_gia.some(d => d.phieu_sua_chua_id === p.id);
        const row = {
            id: p.id,
            ma_tra_cuu: p.ma_tra_cuu,
            trang_thai: p.trang_thai,
            loai_dich_vu: p.loai_dich_vu || 'OFFLINE',
            han_bao_hanh: p.han_bao_hanh,
            ngay_tao: p.ngay_tao,
            ngay_cap_nhat: p.ngay_cap_nhat,
            ho_ten: kh.ho_ten || 'Khách hàng',
            so_dien_thoai: kh.so_dien_thoai || '',
            ten_may: tb.ten_may || 'Sản phẩm / Dịch vụ',
            ten_thiet_bi: tb.ten_may || 'Sản phẩm / Dịch vụ',
            so_imei_serial: tb.so_imei_serial || null,
            tinh_trang_may: tb.tinh_trang_may || '',
            mo_ta_loi: tb.tinh_trang_may || '',
            da_danh_gia
        };
        return { rows: [row] };
    }

    // 14. track by phone / IMEI / Serial / Ticket Code
    if (/SELECT .* FROM phieu_sua_chua p .* WHERE k\.so_dien_thoai = \$1/i.test(cleanSql)) {
        const keyword = String(params[0] || '').trim();
        const kwUpper = keyword.toUpperCase();
        const matchedTickets = s.phieu_sua_chua.filter(p => {
            const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
            const kh = s.khach_hang.find(x => x.id === tb.khach_hang_id) || {};
            const matchPhone = kh.so_dien_thoai === keyword;
            const matchImei = tb.so_imei_serial && String(tb.so_imei_serial).toUpperCase() === kwUpper;
            const matchCode = p.ma_tra_cuu && String(p.ma_tra_cuu).toUpperCase() === kwUpper;
            return matchPhone || matchImei || matchCode;
        }).map(p => {
            const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
            return {
                ma_tra_cuu: p.ma_tra_cuu,
                trang_thai: p.trang_thai,
                loai_dich_vu: p.loai_dich_vu,
                ten_may: tb.ten_may,
                so_imei_serial: tb.so_imei_serial || null,
                tinh_trang_may: tb.tinh_trang_may,
                han_bao_hanh: p.han_bao_hanh,
                ngay_cap_nhat: p.ngay_cap_nhat
            };
        });
        return { rows: matchedTickets };
    }

    // 15. getAllTickets
    if (/SELECT .* FROM phieu_sua_chua p .* ORDER BY p\.ngay_tao DESC/i.test(cleanSql)) {
        const list = s.phieu_sua_chua.map(p => {
            const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
            const kh = s.khach_hang.find(x => x.id === tb.khach_hang_id) || {};
            return {
                id: p.id,
                ma_phieu: p.ma_tra_cuu,
                ma_tra_cuu: p.ma_tra_cuu,
                trang_thai: p.trang_thai,
                loai_dich_vu: p.loai_dich_vu || 'OFFLINE',
                han_bao_hanh: p.han_bao_hanh,
                ngay_tao: p.ngay_tao,
                ngay_cap_nhat: p.ngay_cap_nhat || p.ngay_tao,
                ho_ten_khach: kh.ho_ten,
                so_dien_thoai: kh.so_dien_thoai,
                ten_thiet_bi: tb.ten_may,
                so_imei_serial: tb.so_imei_serial || null,
                mo_ta_loi: tb.tinh_trang_may
            };
        });
        return { rows: list };
    }

    // 16. select from phieu_sua_chua by id or ma_tra_cuu
    if (/SELECT .* FROM phieu_sua_chua WHERE id = \$1/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.id === Number(params[0]));
        return { rows: p ? [{ ...p }] : [] };
    }
    if (/SELECT .* FROM phieu_sua_chua WHERE ma_tra_cuu = \$1/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.ma_tra_cuu === params[0]);
        return { rows: p ? [{ ...p }] : [] };
    }

    // 17. updateTicketStatus
    if (/UPDATE phieu_sua_chua SET trang_thai = \$1.*WHERE id = \$2/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.id === Number(params[1]));
        if (p) {
            p.trang_thai = params[0];
            p.ngay_cap_nhat = new Date().toISOString();
            if ((params[0] === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' || params[0] === 'ĐÃ_SỬA_XONG') && !p.han_bao_hanh) {
                const d = new Date();
                d.setDate(d.getDate() + 180);
                p.han_bao_hanh = d.toISOString();
            }
            saveStore();
            return { rows: [{ ...p }] };
        }
        return { rows: [] };
    }

    // 18. submitBooking
    if (/INSERT INTO lich_hen/i.test(cleanSql)) {
        const newId = s.lich_hen.length > 0 ? Math.max(...s.lich_hen.map(x => x.id)) + 1 : 1;
        const lh = {
            id: newId,
            khach_hang_id: Number(params[0]),
            ngay_hen: params[1],
            gio_hen: params[2],
            mo_ta_loi: params[3],
            loai_dich_vu: params[4] || 'TAI_CUA_HANG',
            trang_thai: 'CHO_XAC_NHAN'
        };
        s.lich_hen.push(lh);
        saveStore();
        return { rows: [{ id: newId }] };
    }

    // 19. getBookings
    if (/SELECT .* FROM lich_hen/i.test(cleanSql)) {
        const list = s.lich_hen.map(l => {
            const kh = s.khach_hang.find(x => x.id === l.khach_hang_id) || {};
            return {
                id: l.id,
                ho_ten_khach: kh.ho_ten,
                so_dien_thoai: kh.so_dien_thoai,
                ngay_hen: l.ngay_hen,
                gio_hen: l.gio_hen,
                mo_ta_loi: l.mo_ta_loi,
                loai_dich_vu: l.loai_dich_vu,
                trang_thai: l.trang_thai
            };
        });
        return { rows: list };
    }

    // 20. updateBookingStatus
    if (/UPDATE lich_hen SET trang_thai = \$1 WHERE id = \$2/i.test(cleanSql)) {
        const lh = s.lich_hen.find(x => x.id === Number(params[1]));
        if (lh) {
            lh.trang_thai = params[0];
            saveStore();
            return { rows: [{ khach_hang_id: lh.khach_hang_id, mo_ta_loi: lh.mo_ta_loi, loai_dich_vu: lh.loai_dich_vu }] };
        }
        return { rows: [] };
    }

    // 21. stats: tickets count by status
    if (/SELECT trang_thai, COUNT\(\*\) as count FROM phieu_sua_chua/i.test(cleanSql)) {
        const map = {};
        for (const p of s.phieu_sua_chua) {
            map[p.trang_thai] = (map[p.trang_thai] || 0) + 1;
        }
        const rows = Object.keys(map).map(k => ({ trang_thai: k, count: String(map[k]) }));
        return { rows };
    }

    // 22. stats: review stats
    if (/SELECT COUNT\(\*\) as total_reviews, COALESCE\(ROUND\(AVG\(so_sao\), 1\), 5\.0\) as avg_rating FROM danh_gia/i.test(cleanSql)) {
        const total = s.danh_gia.length;
        const avg = total > 0
            ? Number((s.danh_gia.reduce((sum, d) => sum + Number(d.so_sao || 5), 0) / total).toFixed(1))
            : 5.0;
        return { rows: [{ total_reviews: total, avg_rating: avg }] };
    }

    // 23. danh_gia review
    if (/SELECT id FROM danh_gia WHERE phieu_sua_chua_id = \$1/i.test(cleanSql)) {
        const d = s.danh_gia.filter(x => x.phieu_sua_chua_id === Number(params[0]));
        return { rows: d };
    }

    if (/INSERT INTO danh_gia/i.test(cleanSql)) {
        const newId = s.danh_gia.length > 0 ? Math.max(...s.danh_gia.map(x => x.id)) + 1 : 1;
        const d = {
            id: newId,
            phieu_sua_chua_id: Number(params[0]),
            so_sao: Number(params[1]),
            nhan_xet: params[2],
            ngay_danh_gia: new Date().toISOString()
        };
        s.danh_gia.push(d);
        saveStore();
        return { rows: [d] };
    }

    if (/SELECT d\.so_sao, d\.nhan_xet, d\.ngay_danh_gia, k\.ho_ten FROM danh_gia d/i.test(cleanSql)) {
        const list = s.danh_gia.filter(x => x.so_sao >= 4).map(d => {
            const p = s.phieu_sua_chua.find(x => x.id === d.phieu_sua_chua_id) || {};
            const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
            const kh = s.khach_hang.find(x => x.id === tb.khach_hang_id) || {};
            return {
                so_sao: d.so_sao,
                nhan_xet: d.nhan_xet,
                ngay_danh_gia: d.ngay_danh_gia,
                ho_ten: kh.ho_ten || 'Khách hàng'
            };
        });
        return { rows: list };
    }

    return { rows: [] };
}

module.exports = {
    executeMockQuery
};
