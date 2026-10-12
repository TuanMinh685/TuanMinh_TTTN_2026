export const SOFTWARE_PACKAGE_GROUPS = {
  WINDOWS: 'Windows',
  OFFICE: 'Văn phòng',
  MACOS: 'macOS',
  UTILITIES: 'Tiện ích'
};

export const SOFTWARE_PACKAGE_OPTIONS = [
  { name: 'Cài đặt Windows', group: 'WINDOWS', description: 'Cài mới Windows và cấu hình ban đầu.' },
  { name: 'Cài driver thiết bị', group: 'WINDOWS', description: 'Cài driver phù hợp cho máy tính và thiết bị.' },
  { name: 'Cài Microsoft 365 / Office', group: 'OFFICE', description: 'Cài đặt bộ công cụ văn phòng Microsoft.' },
  { name: 'Cài LibreOffice', group: 'OFFICE', description: 'Cài bộ ứng dụng văn phòng mã nguồn mở.' },
  { name: 'Cập nhật macOS', group: 'MACOS', description: 'Cập nhật hệ điều hành macOS tương thích.' },
  { name: 'Cài gói phần mềm macOS', group: 'MACOS', description: 'Cài đặt ứng dụng và cấu hình cho máy Mac.' },
  { name: 'Bộ tiện ích cơ bản', group: 'UTILITIES', description: 'Cài trình duyệt, nén tệp và tiện ích thông dụng.' },
  { name: 'Công cụ bảo mật', group: 'UTILITIES', description: 'Cài và cấu hình công cụ bảo mật thiết bị.' },
  { name: 'Công cụ đồ họa', group: 'UTILITIES', description: 'Cài đặt phần mềm phục vụ thiết kế đồ họa.' },
  { name: 'Công cụ văn phòng', group: 'OFFICE', description: 'Cài các tiện ích hỗ trợ học tập và công việc.' }
];

export const SOFTWARE_PACKAGES = SOFTWARE_PACKAGE_OPTIONS.map(option => option.name);
