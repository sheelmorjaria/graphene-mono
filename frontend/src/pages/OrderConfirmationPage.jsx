import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircleIcon, ShoppingBagIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { getUserOrderDetails, formatCurrency, formatOrderDate } from '../services/orderService';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Order Confirmation - GrapheneOS Store';
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await getUserOrderDetails(orderId);
        setOrder(response.order);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The order you are looking for could not be found.'}
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your order. Your order number is <span className="font-semibold text-gray-800">#{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Summary Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-semibold">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-semibold">{formatOrderDate(order.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Total:</span>
                <span className="font-semibold text-lg">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  order.paymentStatus === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 text-sm">Shipping Address:</span>
                <div className="mt-1">
                  <div className="font-semibold">{order.shippingAddress.fullName}</div>
                  <div className="text-sm text-gray-600">
                    <div>{order.shippingAddress.addressLine1}</div>
                    {order.shippingAddress.addressLine2 && (
                      <div>{order.shippingAddress.addressLine2}</div>
                    )}
                    <div>
                      {order.shippingAddress.city}, {order.shippingAddress.stateProvince} {order.shippingAddress.postalCode}
                    </div>
                    <div>{order.shippingAddress.country}</div>
                    {order.shippingAddress.phoneNumber && (
                      <div>Phone: {order.shippingAddress.phoneNumber}</div>
                    )}
                  </div>
                </div>
              </div>
              {order.shippingMethod && (
                <div>
                  <span className="text-gray-600 text-sm">Shipping Method:</span>
                  <div className="mt-1">
                    <div className="font-semibold">{order.shippingMethod.name}</div>
                    {order.shippingMethod.estimatedDelivery && (
                      <div className="text-sm text-gray-600">{order.shippingMethod.estimatedDelivery}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item._id} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                <div className="flex-shrink-0">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{item.productName}</h3>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <div className="text-lg font-semibold text-gray-800">
                  {formatCurrency(item.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Totals */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span>{formatCurrency(order.shipping)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">What's Next?</h2>
          <div className="space-y-2 text-blue-700">
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              <span>You'll receive an order confirmation email shortly</span>
            </div>
            <div className="flex items-center">
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              <span>We'll notify you when your order ships</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/orders/${order._id}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Order Details
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;