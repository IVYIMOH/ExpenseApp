import React from 'react';

function App() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600">FinanceIQ Dashboard</h1>
        <p className="text-gray-600">Welcome to your financial forensic analysis.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-semibold mb-2">Total Expenses</h2>
          <p className="text-2xl font-mono">Analyzing data...</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-semibold mb-2">Budget Status</h2>
          <p className="text-2xl font-mono text-green-500">Healthy</p>
        </div>
      </div>
    </div>
  );
}

export default App;
