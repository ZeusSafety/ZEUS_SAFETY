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
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {icon}
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
            w-full px-4 py-3.5 border rounded-xl bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200 text-gray-900 placeholder-gray-400
            shadow-sm hover:shadow-md focus:shadow-lg
            ${icon ? "pl-12" : ""}
            ${error ? "border-red-500 bg-red-50 focus:ring-red-500" : "border-gray-300"}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

