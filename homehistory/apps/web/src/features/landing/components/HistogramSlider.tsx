import React, { useState, useRef, useEffect } from 'react';

const DualRangeSlider = () => {
  const [minValue, setMinValue] = useState(150);
  const [maxValue, setMaxValue] = useState(3000);
  const [isDragging, setIsDragging] = useState(null);
  const sliderRef = useRef(null);

  const min = 0;
  const max = 5000;

  // Sample histogram data - you can replace this with your actual data
  const histogramData = [
    2, 3, 4, 5, 7, 9, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48, 52, 55, 58, 62, 65, 68, 72,
    75, 78, 82, 85, 88, 92, 95, 98, 95, 92, 88, 85, 82, 78, 75, 72, 68, 65, 62, 58, 55, 52, 48, 45,
    42, 38, 35, 32, 28, 25, 22, 18, 15, 12, 9, 7, 5, 4, 3, 2,
  ];

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const getPercentage = (value) => ((value - min) / (max - min)) * 100;

  const handleMouseDown = (type) => (e) => {
    setIsDragging(type);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const value = Math.round(min + (percentage / 100) * (max - min));

    if (isDragging === 'min') {
      if (value < maxValue) {
        setMinValue(value);
      }
    } else if (isDragging === 'max') {
      if (value > minValue) {
        setMaxValue(value);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, minValue, maxValue]);

  const minPercentage = getPercentage(minValue);
  const maxPercentage = getPercentage(maxValue);

  return (
    <div className="w-full max-w-2xl mx-auto flex">
      <span className="flex items-center font-semibold text-gray-400 justify-center">MIN</span>

      <div className="relative w-full">
        {/* Slider container */}
        <div className="relative h-20 my-4" ref={sliderRef}>
          {/* Histogram bars */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between h-16">
            {histogramData.map((height, index) => {
              const barPercentage = (index / (histogramData.length - 1)) * 100;
              const isInRange = barPercentage >= minPercentage && barPercentage <= maxPercentage;

              return (
                <div
                  key={index}
                  className={`w-1 transition-colors duration-200 rounded-3xl ${
                    isInRange ? 'bg-tertiary-500' : 'bg-gray-300'
                  }`}
                  style={{
                    height: `${(height / Math.max(...histogramData)) * 100}%`,
                    minHeight: '2px',
                  }}
                />
              );
            })}
          </div>

          {/* Track */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 rounded-full" />

          {/* Active track */}
          <div
            className="absolute bottom-0 h-1 bg-blue-500 rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />

          {/* Min handle */}
          <div
            className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer transform -translate-x-2 -translate-y-1.5 border-2 border-white shadow-lg hover:scale-110 transition-transform"
            style={{ left: `${minPercentage}%`, bottom: '-12px' }}
            onMouseDown={handleMouseDown('min')}
          />

          {/* Max handle */}
          <div
            className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer transform -translate-x-2 -translate-y-1.5 border-2 border-white shadow-lg hover:scale-110 transition-transform"
            style={{ left: `${maxPercentage}%`, bottom: '-12px' }}
            onMouseDown={handleMouseDown('max')}
          />
        </div>

        {/* Value inputs */}
        <div className="flex justify-between">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-24 text-gray-900">
            <input
              type="text"
              value={formatValue(minValue)}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^\d]/g, '')) || 0;
                if (value < maxValue && value >= min) {
                  setMinValue(value);
                }
              }}
              className="bg-transparent text-sm font-medium outline-none w-full"
            />
            <span className="text-gray-500 text-sm ml-1">$</span>
          </div>

          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-24">
            <input
              type="text"
              value={formatValue(maxValue)}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^\d]/g, '')) || 0;
                if (value > minValue && value <= max) {
                  setMaxValue(value);
                }
              }}
              className="bg-transparent text-sm font-medium outline-none w-full text-gray-900"
            />
            <span className="text-gray-500 text-sm ml-1">$</span>
          </div>
        </div>
      </div>
      <span className="flex items-center font-semibold text-gray-400">MAX</span>
    </div>
  );
};

export default DualRangeSlider;
