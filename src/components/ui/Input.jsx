export function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
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
          w-full px-4 py-3 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          ${error ? "border-red-500" : "border-gray-300"}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

