import { Zap } from 'lucide-react';

const Error = ({ error }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-xl shadow-lg text-center">
      <div className="text-red-500 mb-4">
        <Zap size={48} className="mx-auto" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
      <p className="text-gray-600">{error?.message || 'An unexpected error occurred'}</p>
    </div>
  </div>
);

export default Error;
