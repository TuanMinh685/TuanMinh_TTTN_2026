const { loadStore, saveStore } = require('./local_store');

function executeMockQuery(sql, params = []) {
    const s = loadStore();
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. nhan_vien login
    if (/SELECT .* FROM nhan_vien WHERE ten_dang_nhap = \$1/i.test(cleanSql)) {
        const u = s.nhan_vien.find(x => x.ten_dang_nhap === params[0]);
        return { rows: u ? [{ ...u }] : [] };
    }

    // 2. nhan_vien getMe
    if (/SELECT .* FROM nhan_vien WHERE id = \$1/i.test(cleanSql)) {
        const u = s.nhan_vien.find(x => x.id === Number(params[0]));
        return { rows: u ? [{ ...u }] : [] };
    }

    // 3. nhan_vien list
    if (/SELECT .* FROM nhan_vien/i.test(cleanSql)) {
        return { rows: s.nhan_vien.map(u => ({ ...u })) };
    }

    // 4. linh_kien public / pricing
    if (/SELECT id, ten_linh_kien, gia_ban FROM linh_kien/i.test(cleanSql) || /SELECT \* FROM linh_kien/i.test(cleanSql)) {
        return { rows: s.linh_kien.map(l => ({ ...l })) };
    }

    // 5. linh_kien single / for update
    if (/SELECT .* FROM linh_kien WHERE id = \$1/i.test(cleanSql)) {
        const l = s.linh_kien.find(x => x.id === Number(params[0]));
        return { rows: l ? [{ ...l }] : [] };
    }

    // 6. linh_kien insert
    if (/INSERT INTO linh_kien/i.test(cleanSql)) {
        const newId = s.linh_kien.length > 0 ? Math.max(...s.linh_kien.map(x => x.id)) + 1 : 1;
        const item = { id: newId, ten_linh_kien: params[0], gia_ban: Number(params[1]), so_luong: Number(params[2]), ngay_tao: new Date().toISOString() };
        s.linh_kien.push(item);
        saveStore();
        return { rows: [item] };
    }

    // 7. linh_kien update
    if (/UPDATE linh_kien SET ten_linh_kien = \$1, gia_ban = \$2, so_luong = \$3 WHERE id = \$4/i.test(cleanSql)) {
        const item = s.linh_kien.find(x => x.id === Number(params[3]));
        if (item) {
            item.ten_linh_kien = params[0];
            item.gia_ban = Number(params[1]);
            item.so_luong = Number(params[2]);
            saveStore();
            return { rows: [item] };
        }
        return { rows: [] };
    }

    // 8. linh_kien reduce or restore stock
    if (/UPDATE linh_kien SET so_luong = so_luong - \$1 WHERE id = \$2/i.test(cleanSql)) {
        const item = s.linh_kien.find(x => x.id === Number(params[1]));
        if (item) {
            item.so_luong = Math.max(0, item.so_luong - Number(params[0]));
            saveStore();
        }
        return { rows: [] };
    }
    if (/UPDATE linh_kien SET so_luong = so_luong \+ \$1 WHERE id = \$2/i.test(cleanSql)) {
        const item = s.linh_kien.find(x => x.id === Number(params[1]));
        if (item) {
            item.so_luong = Number(item.so_luong) + Number(params[0]);
            saveStore();
        }
        return { rows: [] };
    }

    // 9. phieu_linh_kien get or delete for ticket
    if (/SELECT id, linh_kien_id, so_luong, don_gia FROM phieu_linh_kien WHERE id = \$1 AND phieu_sua_chua_id = \$2/i.test(cleanSql)) {
        const rec = s.phieu_linh_kien.find(p => p.id === Number(params[0]) && p.phieu_sua_chua_id === Number(params[1]));
        return { rows: rec ? [{ ...rec }] : [] };
    }
    if (/SELECT .* FROM phieu_linh_kien .* WHERE .*phieu_sua_chua_id = \$1/i.test(cleanSql)) {
        const ticketId = Number(params[0]);
        const parts = s.phieu_linh_kien.filter(p => p.phieu_sua_chua_id === ticketId).map(p => {
            const lk = s.linh_kien.find(l => l.id === p.linh_kien_id) || {};
            return { ...p, ten_linh_kien: lk.ten_linh_kien || 'Linh kiện' };
        });
        return { rows: parts };
    }
    if (/DELETE FROM phieu_linh_kien WHERE id = \$1 AND phieu_sua_chua_id = \$2/i.test(cleanSql)) {
        s.phieu_linh_kien = s.phieu_linh_kien.filter(p => !(p.id === Number(params[0]) && p.phieu_sua_chua_id === Number(params[1])));
        saveStore();
        return { rows: [] };
    }
    if (/DELETE FROM phieu_linh_kien WHERE phieu_sua_chua_id = \$1/i.test(cleanSql)) {
        const ticketId = Number(params[0]);
        s.phieu_linh_kien = s.phieu_linh_kien.filter(p => p.phieu_sua_chua_id !== ticketId);
        saveStore();
        return { rows: [] };
    }

    // 10. phieu_linh_kien insert (with so_serial)
    if (/INSERT INTO phieu_linh_kien/i.test(cleanSql)) {
        const newId = s.phieu_linh_kien.length > 0 ? Math.max(...s.phieu_linh_kien.map(x => x.id)) + 1 : 1;
        const item = {
            id: newId,
            phieu_sua_chua_id: Number(params[0]),
            linh_kien_id: Number(params[1]),
            so_luong: Number(params[2]),
            don_gia: Number(params[3]),
            so_serial: params[4] || `SN-LK-${Math.floor(100000 + Math.random() * 900000)}`,
            ngay_them: new Date().toISOString()
        };
        s.phieu_linh_kien.push(item);
        saveStore();
        return { rows: [item] };
    }

    // 11. hinh_anh_phieu get for ticket
    if (/SELECT .* FROM hinh_anh_phieu WHERE phieu_sua_chua_id = \$1/i.test(cleanSql)) {
        const ticketId = Number(params[0]);
        const imgs = s.hinh_anh_phieu.filter(img => img.phieu_sua_chua_id === ticketId);
        return { rows: imgs };
    }

    // 12. hinh_anh_phieu insert
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

    // 13. khach_hang find by phone or update student info
    if (/SELECT .* FROM khach_hang WHERE so_dien_thoai = \$1/i.test(cleanSql)) {
        const k = s.khach_hang.find(x => x.so_dien_thoai === params[0]);
        return { rows: k ? [{ ...k }] : [] };
    }
    if (/UPDATE khach_hang SET la_sinh_vien = \$1, truong_hoc = \$2, ma_sinh_vien = \$3 WHERE id = \$4/i.test(cleanSql)) {
        const k = s.khach_hang.find(x => x.id === Number(params[3]));
        if (k) {
            k.la_sinh_vien = Boolean(params[0]);
            k.truong_hoc = params[1] || '';
            k.ma_sinh_vien = params[2] || '';
            saveStore();
        }
        return { rows: [] };
    }

    // 14. khach_hang insert (with la_sinh_vien, truong_hoc, ma_sinh_vien)
    if (/INSERT INTO khach_hang/i.test(cleanSql)) {
        const newId = s.khach_hang.length > 0 ? Math.max(...s.khach_hang.map(x => x.id)) + 1 : 1;
        const k = {
            id: newId,
            ho_ten: params[0],
            so_dien_thoai: params[1],
            zalo_id: params[2] || null,
            la_sinh_vien: !!params[3],
            truong_hoc: params[4] || '',
            ma_sinh_vien: params[5] || '',
            diem_tich_luy: 0,
            hang_thanh_vien: 'DONG',
            ngay_tao: new Date().toISOString()
        };
        s.khach_hang.push(k);
        saveStore();
        return { rows: [{ id: newId }] };
    }

    // 15. thiet_bi insert
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

    // 16. thiet_bi update
    if (/UPDATE thiet_bi SET tinh_trang_may = \$1 WHERE id = \$2/i.test(cleanSql)) {
        const tb = s.thiet_bi.find(x => x.id === Number(params[1]));
        if (tb) {
            tb.tinh_trang_may = params[0];
            saveStore();
        }
        return { rows: [] };
    }

    // 17. phieu_sua_chua insert
    if (/INSERT INTO phieu_sua_chua/i.test(cleanSql)) {
        const newId = s.phieu_sua_chua.length > 0 ? Math.max(...s.phieu_sua_chua.map(x => x.id)) + 1 : 1;
        const tb = s.thiet_bi.find(x => x.id === Number(params[0])) || {};
        const kh = s.khach_hang.find(x => x.id === tb.khach_hang_id) || {};
        const p = {
            id: newId,
            thiet_bi_id: Number(params[0]),
            ma_tra_cuu: params[1],
            loai_dich_vu: params[2] || 'OFFLINE',
            ma_ultraviewer: params[3] || null,
            trang_thai: 'CHỜ_KHÁM',
            tong_tien: 0,
            giam_gia_sinh_vien: 0,
            tien_sau_giam: 0,
            la_sinh_vien: Boolean(kh.la_sinh_vien),
            truong_hoc: kh.truong_hoc || '',
            ma_sinh_vien: kh.ma_sinh_vien || '',
            han_bao_hanh: null,
            ngay_tao: new Date().toISOString(),
            ngay_cap_nhat: new Date().toISOString()
        };
        s.phieu_sua_chua.push(p);
        saveStore();
        return { rows: [{ id: newId, ma_tra_cuu: p.ma_tra_cuu, loai_dich_vu: p.loai_dich_vu, trang_thai: p.trang_thai, ngay_tao: p.ngay_tao }] };
    }

    // 18. nhat_ky_sua_chua insert
    if (/INSERT INTO nhat_ky_sua_chua/i.test(cleanSql)) {
        const newId = s.nhat_ky_sua_chua.length > 0 ? Math.max(...s.nhat_ky_sua_chua.map(x => x.id)) + 1 : 1;
        const nk = {
            id: newId,
            phieu_sua_chua_id: Number(params[0]),
            trang_thai_moi: params[1] || params[2] || 'CẬP_NHẬT',
            ghi_chu: params[2] || params[3] || '',
            ngay_tao: new Date().toISOString()
        };
        s.nhat_ky_sua_chua.push(nk);
        saveStore();
        return { rows: [{ id: newId }] };
    }

    // 19. nhat_ky_sua_chua get by phieu_sua_chua_id
    if (/SELECT .* FROM nhat_ky_sua_chua WHERE phieu_sua_chua_id = \$1/i.test(cleanSql)) {
        const ticketId = Number(params[0]);
        const list = s.nhat_ky_sua_chua
            .filter(x => x.phieu_sua_chua_id === ticketId)
            .sort((a, b) => new Date(b.ngay_tao) - new Date(a.ngay_tao));
        return { rows: list };
    }

    // 19b. get ticket & device for updateTicketSoftwarePackages
    if (/SELECT p\.id, t\.id AS device_id, t\.tinh_trang_may FROM phieu_sua_chua p JOIN thiet_bi t ON p\.thiet_bi_id = t\.id WHERE p\.id = \$1/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.id === Number(params[0]));
        if (!p) return { rows: [] };
        const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
        return { rows: [{ id: p.id, device_id: tb.id, tinh_trang_may: tb.tinh_trang_may || '' }] };
    }

    // 20. trackTicket by ma_tra_cuu
    if (/SELECT .* FROM phieu_sua_chua p .* WHERE p\.ma_tra_cuu = \$1/i.test(cleanSql)) {
        const code = params[0];
        const p = s.phieu_sua_chua.find(x => x.ma_tra_cuu === code);
        if (!p) return { rows: [] };
        const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
        const kh = s.khach_hang.find(x => x.id === tb.khach_hang_id) || {};
        const da_danh_gia = s.danh_gia.some(d => d.phieu_sua_chua_id === p.id);
        const row = {
            id: p.id,
            ma_tra_cuu: p.ma_tra_cuu,
            trang_thai: p.trang_thai,
            loai_dich_vu: p.loai_dich_vu || 'OFFLINE',
            ma_ultraviewer: p.ma_ultraviewer || null,
            tong_tien: p.tong_tien,
            giam_gia_sinh_vien: p.giam_gia_sinh_vien || 0,
            tien_sau_giam: p.tien_sau_giam || p.tong_tien,
            la_sinh_vien: kh.la_sinh_vien || p.la_sinh_vien || false,
            truong_hoc: kh.truong_hoc || p.truong_hoc || '',
            ma_sinh_vien: kh.ma_sinh_vien || p.ma_sinh_vien || '',
            han_bao_hanh: p.han_bao_hanh,
            ngay_tao: p.ngay_tao,
            ngay_cap_nhat: p.ngay_cap_nhat,
            ho_ten: kh.ho_ten || 'Khách hàng',
            so_dien_thoai: kh.so_dien_thoai || '',
            ten_may: tb.ten_may || 'Thiết bị',
            ten_thiet_bi: tb.ten_may || 'Thiết bị',
            so_imei_serial: tb.so_imei_serial || null,
            tinh_trang_may: tb.tinh_trang_may || '',
            mo_ta_loi: tb.tinh_trang_may || '',
            da_danh_gia
        };
        return { rows: [row] };
    }

    // 21. track by phone / IMEI / Serial / Ticket Code
    if (/SELECT .* FROM phieu_sua_chua p .* WHERE k\.so_dien_thoai = \$1/i.test(cleanSql)) {
        const keyword = String(params[0] || '').trim();
        const kwUpper = keyword.toUpperCase();
        const matchedTickets = s.phieu_sua_chua.filter(p => {
            const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
            const kh = s.khach_hang.find(x => x.id === tb.khach_hang_id) || {};
            const parts = s.phieu_linh_kien.filter(pl => pl.phieu_sua_chua_id === p.id);
            const matchPhone = kh.so_dien_thoai === keyword;
            const matchImei = tb.so_imei_serial && String(tb.so_imei_serial).toUpperCase() === kwUpper;
            const matchCode = p.ma_tra_cuu && String(p.ma_tra_cuu).toUpperCase() === kwUpper;
            const matchPartSerial = parts.some(pl => pl.so_serial && String(pl.so_serial).toUpperCase() === kwUpper);
            return matchPhone || matchImei || matchCode || matchPartSerial;
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

    // 22. getAllTickets
    if (/SELECT .* FROM phieu_sua_chua p .* ORDER BY p\.ngay_tao DESC/i.test(cleanSql)) {
        const list = s.phieu_sua_chua.map(p => {
            const tb = s.thiet_bi.find(x => x.id === p.thiet_bi_id) || {};
            const kh = s.khach_hang.find(x => x.id === tb.khach_hang_id) || {};
            return {
                id: p.id,
                ma_phieu: p.ma_tra_cuu,
                trang_thai: p.trang_thai,
                loai_dich_vu: p.loai_dich_vu || 'OFFLINE',
                ma_ultraviewer: p.ma_ultraviewer || null,
                tong_tien: p.tong_tien,
                giam_gia_sinh_vien: p.giam_gia_sinh_vien || 0,
                tien_sau_giam: p.tien_sau_giam || p.tong_tien,
                la_sinh_vien: kh.la_sinh_vien || p.la_sinh_vien || false,
                truong_hoc: kh.truong_hoc || p.truong_hoc || '',
                ma_sinh_vien: kh.ma_sinh_vien || p.ma_sinh_vien || '',
                mssv: kh.ma_sinh_vien || p.ma_sinh_vien || '',
                han_bao_hanh: p.han_bao_hanh,
                ngay_tao: p.ngay_tao,
                ho_ten_khach: kh.ho_ten,
                so_dien_thoai: kh.so_dien_thoai,
                ten_thiet_bi: tb.ten_may,
                so_imei_serial: tb.so_imei_serial || null,
                mo_ta_loi: tb.tinh_trang_may
            };
        });
        return { rows: list };
    }

    // 23. updateTicketStatus
    if (/UPDATE phieu_sua_chua SET trang_thai = \$1.*WHERE id = \$2/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.id === Number(params[1]));
        if (p) {
            p.trang_thai = params[0];
            p.ngay_cap_nhat = new Date().toISOString();
            if (params[0] === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' && !p.han_bao_hanh) {
                // Kích hoạt bảo hành điện tử 06 tháng (180 ngày)
                const d = new Date();
                d.setDate(d.getDate() + 180);
                p.han_bao_hanh = d.toISOString();
            }
            saveStore();
            return { rows: [{ ma_tra_cuu: p.ma_tra_cuu }] };
        }
        return { rows: [] };
    }

    // 24. update tong_tien phieu_sua_chua
    if (/UPDATE phieu_sua_chua SET tong_tien = tong_tien \+ \$1 WHERE id = \$2/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.id === Number(params[1]));
        if (p) {
            p.tong_tien = Number(p.tong_tien) + Number(params[0]);
            if (p.la_sinh_vien) {
                p.giam_gia_sinh_vien = Math.round(p.tong_tien * 0.15);
                p.tien_sau_giam = p.tong_tien - p.giam_gia_sinh_vien;
            } else {
                p.giam_gia_sinh_vien = 0;
                p.tien_sau_giam = p.tong_tien;
            }
            saveStore();
        }
        return { rows: [] };
    }
    if (/UPDATE phieu_sua_chua SET tong_tien = GREATEST\(tong_tien - \$1, 0\) WHERE id = \$2/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.id === Number(params[1]));
        if (p) {
            p.tong_tien = Math.max(0, Number(p.tong_tien) - Number(params[0]));
            if (p.la_sinh_vien) {
                p.giam_gia_sinh_vien = Math.round(p.tong_tien * 0.15);
                p.tien_sau_giam = p.tong_tien - p.giam_gia_sinh_vien;
            } else {
                p.giam_gia_sinh_vien = 0;
                p.tien_sau_giam = p.tong_tien;
            }
            saveStore();
        }
        return { rows: [] };
    }
    if (/UPDATE phieu_sua_chua SET tong_tien = 0 WHERE id = \$1/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.id === Number(params[0]));
        if (p) {
            p.tong_tien = 0;
            p.giam_gia_sinh_vien = 0;
            p.tien_sau_giam = 0;
            saveStore();
        }
        return { rows: [] };
    }

    // 25. approveQuote
    if (/UPDATE phieu_sua_chua SET trang_thai = \$1, ngay_cap_nhat = CURRENT_TIMESTAMP WHERE id = \$2/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.id === Number(params[1]));
        if (p) {
            p.trang_thai = params[0];
            p.ngay_cap_nhat = new Date().toISOString();
            saveStore();
            return { rows: [p] };
        }
        return { rows: [] };
    }

    // 26. select from phieu_sua_chua where ma_tra_cuu = $1
    if (/SELECT .* FROM phieu_sua_chua WHERE ma_tra_cuu = \$1/i.test(cleanSql)) {
        const p = s.phieu_sua_chua.find(x => x.ma_tra_cuu === params[0]);
        return { rows: p ? [{ ...p }] : [] };
    }

    // 27. submitBooking
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

    // 28. getBookings
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
                trang_thai: l.trang_thai,
                la_sinh_vien: kh.la_sinh_vien || false,
                truong_hoc: kh.truong_hoc || '',
                ma_sinh_vien: kh.ma_sinh_vien || '',
                mssv: kh.ma_sinh_vien || ''
            };
        });
        return { rows: list };
    }

    // 29. updateBookingStatus
    if (/UPDATE lich_hen SET trang_thai = \$1 WHERE id = \$2/i.test(cleanSql)) {
        const lh = s.lich_hen.find(x => x.id === Number(params[1]));
        if (lh) {
            lh.trang_thai = params[0];
            saveStore();
            return { rows: [{ khach_hang_id: lh.khach_hang_id, mo_ta_loi: lh.mo_ta_loi, loai_dich_vu: lh.loai_dich_vu }] };
        }
        return { rows: [] };
    }

    // 30a. stats: daily revenue series (WITH report_days AS)
    if (/WITH report_days AS/i.test(cleanSql)) {
        const period = params[0] || 'week';
        const today = new Date();
        const startDate = new Date(today);
        if (period === 'month') {
            startDate.setDate(1);
        } else {
            startDate.setDate(today.getDate() - 6);
        }
        const rows = [];
        const cur = new Date(startDate);
        while (cur <= today) {
            const dateStr = cur.toISOString().slice(0, 10);
            const dayRev = s.phieu_sua_chua
                .filter(p => p.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' && String(p.ngay_tao || '').slice(0, 10) === dateStr)
                .reduce((sum, p) => sum + Number(p.tien_sau_giam || p.tong_tien || 0), 0);
            rows.push({ date: dateStr, total_revenue: dayRev });
            cur.setDate(cur.getDate() + 1);
        }
        return { rows };
    }

    // 30b. stats: parts revenue in period
    if (/SELECT COALESCE\(SUM\(pl\.so_luong \* pl\.don_gia\), 0\) AS total_parts_revenue/i.test(cleanSql)) {
        const completedIds = new Set(
            s.phieu_sua_chua
                .filter(p => p.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN')
                .map(p => p.id)
        );
        const totalPartsRev = s.phieu_linh_kien
            .filter(pl => completedIds.has(pl.phieu_sua_chua_id))
            .reduce((sum, pl) => sum + Number(pl.so_luong) * Number(pl.don_gia), 0);
        return { rows: [{ total_parts_revenue: totalPartsRev }] };
    }

    // 30c. stats: revenue & completed_tickets
    if (/SELECT COALESCE\(SUM\(tong_tien\), 0\) as total_revenue/i.test(cleanSql)) {
        const completed = s.phieu_sua_chua.filter(x => x.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN');
        const rev = completed.reduce((acc, cur) => acc + Number(cur.tien_sau_giam || cur.tong_tien || 0), 0);
        return { rows: [{ total_revenue: rev, completed_tickets: completed.length }] };
    }

    // 31a. stats: status distribution for pie chart (name, value)
    if (/SELECT trang_thai as name, CAST\(COUNT\(\*\) AS INTEGER\) as value FROM phieu_sua_chua/i.test(cleanSql)) {
        const map = {};
        for (const p of s.phieu_sua_chua) {
            map[p.trang_thai] = (map[p.trang_thai] || 0) + 1;
        }
        const rows = Object.keys(map).map(k => ({ name: k, value: Number(map[k]) }));
        return { rows };
    }

    // 31b. stats: tickets count by status
    if (/SELECT trang_thai, COUNT\(\*\) as count FROM phieu_sua_chua/i.test(cleanSql)) {
        const map = {};
        for (const p of s.phieu_sua_chua) {
            map[p.trang_thai] = (map[p.trang_thai] || 0) + 1;
        }
        const rows = Object.keys(map).map(k => ({ trang_thai: k, count: String(map[k]) }));
        return { rows };
    }

    // 32. danh_gia review
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
                ho_ten: kh.ho_ten || 'Sinh viên / Khách hàng'
            };
        });
        return { rows: list };
    }

    return { rows: [] };
}

module.exports = {
    executeMockQuery
};
