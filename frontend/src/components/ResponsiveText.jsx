/**
 * Hiển thị nội dung ngắn gọn trên điện thoại (< 640px) và giữ nguyên văn bản đầy đủ trên máy tính (>= 640px).
 */
export default function ResponsiveText({ mobile, desktop }) {
  return (
    <>
      <span className="sm:hidden">{mobile}</span>
      <span className="hidden sm:inline">{desktop}</span>
    </>
  );
}
