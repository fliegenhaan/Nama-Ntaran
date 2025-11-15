'use client';

interface HeatMapCell {
  label: string;
  value: number;
}

interface HeatMapProps {
  data: HeatMapCell[];
  title?: string;
  maxValue?: number;
  colorScale?: {
    low: string;
    medium: string;
    high: string;
  };
}

export default function HeatMap({
  data,
  title,
  maxValue,
  colorScale = {
    low: '#86efac',
    medium: '#fbbf24',
    high: '#ef4444',
  },
}: HeatMapProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  const getColor = (value: number) => {
    const percentage = (value / max) * 100;
    if (percentage < 33) return colorScale.low;
    if (percentage < 66) return colorScale.medium;
    return colorScale.high;
  };

  const getIntensity = (value: number) => {
    return (value / max) * 100;
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="grid grid-cols-7 gap-2">
        {data.map((cell, index) => {
          const intensity = getIntensity(cell.value);
          return (
            <div
              key={index}
              className="aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all hover:scale-110 cursor-pointer shadow-sm hover:shadow-md"
              style={{
                backgroundColor: getColor(cell.value),
                opacity: 0.3 + (intensity / 100) * 0.7,
              }}
              title={`${cell.label}: ${cell.value}`}
            >
              <span className="text-xs font-semibold text-gray-900">{cell.label}</span>
              <span className="text-lg font-bold text-gray-900">{cell.value}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: colorScale.low, opacity: 0.8 }}
          />
          <span className="text-xs text-gray-600">Rendah</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: colorScale.medium, opacity: 0.8 }}
          />
          <span className="text-xs text-gray-600">Sedang</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: colorScale.high, opacity: 0.8 }}
          />
          <span className="text-xs text-gray-600">Tinggi</span>
        </div>
      </div>
    </div>
  );
}
