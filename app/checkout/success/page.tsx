'use client';

import { useSearchParams } from 'next/navigation';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');

  if (!reference) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reference</h1>
          <p className="text-gray-600 mb-4">No payment reference found.</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <OrderConfirmation reference={reference} />
      </div>
    </div>
  );
}

