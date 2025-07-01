import React from 'react';

interface CurrencyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ id, label, value, onChange, icon }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    onChange(numericValue);
  };

  const formattedValue = value ? new Intl.NumberFormat('vi-VN').format(Number(value)) : '';

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-700 ml-1 mb-1 block">
        {label}
      </label>
      <div className="relative group">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-blue-600 transition-colors">
          {icon}
        </span>
        <input
          type="text"
          inputMode="numeric"
          id={id}
          name={id}
          value={formattedValue}
          onChange={handleInputChange}
          placeholder="0"
          className="w-full pl-12 pr-16 py-3 text-lg bg-gray-50 border-2 text-gray-900 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200 outline-none"
          autoComplete="off"
        />
        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 text-sm font-semibold">VNĐ</span>
      </div>
    </div>
  );
};