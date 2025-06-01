import React from 'react';

const OrderStatusTimeline = ({ currentStatus, statusHistory = [] }) => {
  // Define the standard order flow
  const statusFlow = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'processing', label: 'Processing', icon: '⚙️' },
    { key: 'shipped', label: 'Shipped', icon: '📦' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '✅' }
  ];

  // Special statuses that don't follow the normal flow
  const specialStatuses = {
    cancelled: { label: 'Cancelled', icon: '❌', color: 'text-red-600' },
    returned: { label: 'Returned', icon: '↩️', color: 'text-gray-600' }
  };

  // Handle special statuses
  if (specialStatuses[currentStatus]) {
    const specialStatus = specialStatuses[currentStatus];
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Status</h2>
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center">
            <div className={`text-4xl mb-2`}>
              {specialStatus.icon}
            </div>
            <div className={`text-lg font-semibold ${specialStatus.color}`}>
              {specialStatus.label}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the index of current status in the flow
  const currentIndex = statusFlow.findIndex(step => step.key === currentStatus);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Progress</h2>
      
      <div className="space-y-4">
        {statusFlow.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          
          // Find the corresponding history entry
          const historyEntry = statusHistory.find(entry => entry.status === step.key);
          
          return (
            <div key={step.key} className="flex items-start">
              {/* Timeline connector */}
              <div className="flex flex-col items-center mr-4">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-colors
                    ${isCompleted 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : isCurrent 
                        ? 'bg-blue-100 border-blue-500 text-blue-700' 
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                >
                  {step.icon}
                </div>
                {index < statusFlow.length - 1 && (
                  <div 
                    className={`w-0.5 h-8 mt-2 transition-colors
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                )}
              </div>
              
              {/* Status info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-medium transition-colors
                    ${isCompleted 
                      ? 'text-green-700' 
                      : isCurrent 
                        ? 'text-blue-700' 
                        : 'text-gray-400'
                    }`}>
                    {step.label}
                  </h3>
                  {historyEntry && (
                    <span className="text-xs text-gray-500">
                      {new Date(historyEntry.timestamp).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                {historyEntry && historyEntry.note && (
                  <p className="text-xs text-gray-600 mt-1">
                    {historyEntry.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;