import React from 'react';
import InfoTooltip from '@/components/ui/infoTooltip';

interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  unit: string;
  tooltipTitle: string;
  tooltipContent: string;
  minLabel?: string;
  maxLabel?: string;
}

const RangeInput: React.FC<RangeInputProps> = ({
  label,
  value,
  min,
  max,
  onChange,
  unit,
  tooltipTitle,
  tooltipContent,
  minLabel,
  maxLabel
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
        {label}: {value} {unit}
        <InfoTooltip title={tooltipTitle} content={tooltipContent} />
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{minLabel || `${min} ${unit}`}</span>
        <span>{maxLabel || `${max} ${unit}`}</span>
      </div>
    </div>
  );
};


export default RangeInput;
