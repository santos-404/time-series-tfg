import React from 'react';

interface InfoTooltipProps {
  content: string;
  title: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, title }) => {
  return (
    <div className="relative group">
      <div className="w-4 h-4 bg-blue-100 border-2 border-blue-800 rounded-full flex items-center justify-center cursor-help">
        <span className="text-blue-800 text-xs font-bold">i</span>
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-100 border-2 border-blue-800 text-blue-800 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
        <div className="text-center">
          <strong>{title}:</strong> {content}
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-800"></div>
      </div>
    </div>
  );
}

  export default InfoTooltip;
