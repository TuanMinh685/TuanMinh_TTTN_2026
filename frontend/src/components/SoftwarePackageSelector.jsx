import { SOFTWARE_PACKAGES } from './softwarePackages';

function SoftwarePackageSelector({ value, onChange }) {
  return (
    <div>
      <label htmlFor="software-package" className="mb-1 block text-sm font-semibold text-slate-700">
        Gói phần mềm cần cài (không bắt buộc)
      </label>
      <select
        id="software-package"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
      >
        <option value="">Không chọn gói</option>
        {SOFTWARE_PACKAGES.map(packageName => (
          <option key={packageName} value={packageName}>{packageName}</option>
        ))}
      </select>
      <p className="mt-1 text-xs text-slate-500">Yêu cầu sẽ được ghi vào phiếu để nhân viên xác nhận chi phí trước khi thực hiện.</p>
    </div>
  );
}

export default SoftwarePackageSelector;
