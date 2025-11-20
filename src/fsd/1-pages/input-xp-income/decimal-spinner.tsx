import React from 'react';

interface DecimalSpinnerProps {
    value: number;
    onChange: (value: number) => void;
    label: string;
}

/** Decimal spinner component for numeric input with two points of decimal precision. */
export const DecimalSpinner: React.FC<DecimalSpinnerProps> = ({ value, onChange, label }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numericValue = parseFloat(e.target.value);
        if (!isNaN(numericValue)) {
            onChange(numericValue);
        }
    };

    return (
        <div className="flex items-center justify-between py-2">
            <label className="font-bold">{label}:</label>
            <input
                type="number"
                value={value.toFixed(2)}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-32 p-2 rounded-md border bg-gray-100 border-gray-300 text-gray-800 
                           dark:bg-gray-700 dark:border-gray-600 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
};
