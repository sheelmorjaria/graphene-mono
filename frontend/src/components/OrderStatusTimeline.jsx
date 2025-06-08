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
      <div className="card animate-fadeIn">
        <div className="card-body">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Status</h2>
          <div className="status-timeline-special">
            <div className="status-icon-large">
              {specialStatus.icon}
            </div>
            <div className={`status-label-large ${specialStatus.color}`}>
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
    <div className="card animate-fadeIn">
      <div className="card-body">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Progress</h2>
        
        <div className="timeline">
          {statusFlow.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            
            // Find the corresponding history entry
            const historyEntry = statusHistory.find(entry => entry.status === step.key);
            
            return (
              <div key={step.key} className="timeline-item animate-slideIn" style={{ animationDelay: `${index * 0.1}s` }}>
                {/* Timeline connector */}
                <div className="flex flex-col items-center mr-4">
                  <div 
                    className={`timeline-marker ${
                      isCompleted 
                        ? 'completed' 
                        : isCurrent 
                          ? 'current' 
                          : 'pending'
                    }`}
                  >
                    {step.icon}
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div 
                      className={`timeline-connector ${isCompleted ? 'completed' : 'pending'}`}
                    />
                  )}
                </div>
                
                {/* Status info */}
                <div className="timeline-content">
                  <div className="flex items-center justify-between">
                    <h3 className={`timeline-title ${
                      isCompleted 
                        ? 'completed' 
                        : isCurrent 
                          ? 'current' 
                          : 'pending'
                    }`}>
                      {step.label}
                    </h3>
                    {historyEntry && (
                      <span className="timeline-timestamp">
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
                    <p className="timeline-note">
                      {historyEntry.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusTimeline;