interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay = ({ error }: ErrorDisplayProps) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex">
      <div className="text-red-400">⚠️</div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    </div>
  </div>
);

export default ErrorDisplay;
