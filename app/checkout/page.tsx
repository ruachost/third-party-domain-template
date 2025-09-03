'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function CheckoutPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const router = useRouter();

  const handleSuccess = (orderId: string) => {
    setOrderId(orderId);
    // Redirect to success page
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CheckoutForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

