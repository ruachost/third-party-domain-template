'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Mail, Calendar, CreditCard, Globe } from 'lucide-react';


import useCartStore from '@/store/cartStore';
import toast from 'react-hot-toast';
import { formatNaira } from '@/lib/utils';

interface OrderConfirmationProps {
  reference: string;
}

export default function OrderConfirmation({ reference }: OrderConfirmationProps) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const { items, totalPrice, currency, clearCart } = useCartStore();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Call our API route to verify payment
        const response = await fetch(`/api/payment/verify?reference=${reference}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setVerificationResult(result.data);
          
          // Create order in WHMCS
          await createWHMCSOrder(result.data);
        } else {
          toast.error('Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Failed to verify payment');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [reference]);

  const createWHMCSOrder = async (paymentData: any) => {
    try {
      // Extract customer data from payment metadata
      const customerData = paymentData.metadata?.customer;
      const domains = paymentData.metadata?.domains || items.map(item => ({
        name: item.domain.fullName,
        registrationPeriod: item.domain.registrationPeriod,
        price: item.domain.price,
      }));

      if (customerData) {
        // Create order using the new API endpoint
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerData,
            domains,
          }),
        });

        const orderResult = await response.json();
        
        if (orderResult.success) {
          setOrderCreated(true);
          // Clear cart after successful order
          clearCart();
          toast.success('Order created successfully!');
        } else {
          toast.error('Failed to create order in WHMCS');
        }
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to create order');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2); // Paystack returns amount in kobo
  };

  if (isVerifying) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
        <p className="text-gray-600">Please wait while we verify your payment...</p>
      </div>
    );
  }

  if (!verificationResult) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Verification Failed</h2>
        <p className="text-gray-600 mb-4">We couldn't verify your payment. Please contact support.</p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Success Header */}
        <div className="bg-green-50 px-6 py-8 text-center border-b border-green-200">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h1>
          <p className="text-green-700">Your domain purchase has been completed successfully.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Reference:</span>
                <span className="font-mono text-sm">{verificationResult.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold">
                  {formatAmount(verificationResult.amount)} {verificationResult.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span>{verificationResult.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Date:</span>
                <span>{formatDate(verificationResult.paid_at)}</span>
              </div>
            </div>
          </div>

          {/* Domain Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Details
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.domain.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.domain.fullName}</h3>
                      <p className="text-sm text-gray-600">
                        {item.domain.registrationPeriod} year registration
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatNaira(item.totalPrice)}
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Status */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Order Status
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-900">Payment Confirmed</span>
              </div>
              {orderCreated ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">Order Created in WHMCS</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700">Creating order in WHMCS...</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Notification */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">Email Confirmation</span>
            </div>
            <p className="text-yellow-800 text-sm">
              A confirmation email has been sent to {verificationResult.customer?.email || 'your email address'} 
              with your order details and next steps.
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You will receive an email confirmation within 5 minutes</li>
              <li>• Domain registration will be processed within 24 hours</li>
              <li>• You'll receive DNS management details via email</li>
              <li>• Contact support if you have any questions</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <a
              href="/"
              className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </a>
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

