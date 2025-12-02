export function InputWithIcon({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  icon,
  className = "",
  premium = false,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-gray-800 mb-2.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <div className={premium ? "text-[#8A94A6]" : "text-gray-400"}>
              {icon}
            </div>
          </div>
        )}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-3 border-2 font-medium
            focus:outline-none focus:ring-2
            text-gray-900 placeholder-gray-400
            ${icon ? "pl-12" : ""}
            ${premium 
              ? `rounded-[12px] bg-[#F9FBFD] border-[#E2E8F0] hover:border-[#D1D9E6] focus:ring-[#1E63F7]/30 focus:border-[#1E63F7] ${error ? "border-red-400 bg-red-50/50 focus:ring-red-500/30 focus:border-red-500" : ""}`
              : `rounded-xl bg-slate-200 border-gray-300 hover:border-gray-400 focus:ring-blue-500/30 focus:border-blue-500 ${error ? "border-red-400 bg-red-50/50 focus:ring-red-500/30 focus:border-red-500" : ""}`
            }
          `}
          style={{ 
            transition: 'all 0.2s ease',
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
