import React from 'react';

interface DecimalSpinnerProps {
    value: number;
    onChange: (value: number) => void;
    label: string;
}

/** Decimal spinner component for numeric input with two points of decimal precision. */
export const DecimalSpinner: React.FC<DecimalSpinnerProps> = ({ value, onChange, label }) => {
    const [stringValue, setStringValue] = React.useState(value.toFixed(2));
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numericValue = parseFloat(e.target.value);
        if (!isNaN(numericValue)) {
            onChange(numericValue);
            setStringValue(e.target.value);
        } else if (e.target.value === '') {
            setStringValue('');
        }
    };

    return (
        <div className="flex items-center justify-between py-2">
            <label className="font-bold">{label}:</label>
            <input
                type="number"
                value={stringValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-32 rounded-md border border-gray-300 bg-gray-100 p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
        </div>
    );
};
