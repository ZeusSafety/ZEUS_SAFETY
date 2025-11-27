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
            <div className="text-gray-400">
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
            w-full px-4 py-3 border-2 rounded-xl bg-slate-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
            text-gray-900 placeholder-gray-400 font-medium
            ${icon ? "pl-12" : ""}
            ${error ? "border-red-400 bg-red-50/50 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300 hover:border-gray-400"}
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
