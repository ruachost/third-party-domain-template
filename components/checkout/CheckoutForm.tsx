'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, User, Mail, Phone, MapPin } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useUserStore from '@/store/userStore';

import { whmcsService } from '@/services/whmcs';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNaira } from '@/lib/utils';

const customerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phonenumber: z.string().min(10, 'Please enter a valid phone number'),
  companyname: z.string().optional(),
  address1: z.string().min(5, 'Please enter a valid address'),
  address2: z.string().optional(),
  city: z.string().min(2, 'Please enter a valid city'),
  state: z.string().min(2, 'Please enter a valid state'),
  country: z.string().min(2, 'Please select a country'),
  postcode: z.string().min(3, 'Please enter a valid zip code'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CheckoutFormProps {
  onSuccess: (orderId: string) => void;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, totalPrice, currency, clearCart } = useCartStore();
  const { user, isLoggedIn } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: isLoggedIn && user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phonenumber: user.phone,
      companyname: user.company || '',
      address1: user.address || '',
      address2: '',
      city: user.city || '',
      state: user.state || '',
      country: user.country,
      postcode: user.zipCode || '',
    } : {},
  });

  const onSubmit = async (data: CustomerFormData) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Generate unique reference
      const reference = `DOM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initialize payment with Paystack
      const paymentData = {
        amount: totalPrice,
        currency: currency,
        email: data.email,
        reference: reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?ref=${reference}`,
        metadata: {
          customer: data,
          domains: items.map(item => ({
            domain: item.domain.fullName,

            price: item.domain.price,
          })),
        },
      };

      // Call our API route to initialize payment
      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Redirect to Paystack payment page
        window.location.href = result.data.authorization_url;
      } else {
        throw new Error(result.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-4">Add some domains to proceed with checkout</p>
          <Button asChild>
            <a href="/">Continue Shopping</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Checkout</CardTitle>
          <CardDescription>Complete your domain purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
                {isLoggedIn && user && (
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    ✓ Logged in as {user.firstName} {user.lastName}
                  </span>
                )}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    First Name *
                  </label>
                  <Input
                    {...register('firstName')}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-destructive text-sm">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Last Name *
                  </label>
                  <Input
                    {...register('lastName')}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-destructive text-sm">{errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email Address *
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Phone Number *
                  </label>
                  <Input
                    {...register('phonenumber')}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phonenumber && (
                    <p className="text-destructive text-sm">{errors.phonenumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Company (Optional)
                  </label>
                  <Input
                    {...register('companyname')}
                    placeholder="Acme Inc."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Country *
                  </label>
                  <Select onValueChange={(value) => register('country').onChange({ target: { value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.country && (
                    <p className="text-destructive text-sm">{errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Street Address *
                  </label>
                  <Input
                    {...register('address1')}
                    placeholder="123 Main Street"
                  />
                  {errors.address1 && (
                    <p className="text-destructive text-sm">{errors.address1.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Address Line 2 (Optional)
                  </label>
                  <Input
                    {...register('address2')}
                    placeholder="Apartment, suite, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      City *
                    </label>
                    <Input
                      {...register('city')}
                      placeholder="New York"
                    />
                    {errors.city && (
                      <p className="text-destructive text-sm">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      State *
                    </label>
                    <Input
                      {...register('state')}
                      placeholder="NY"
                    />
                    {errors.state && (
                      <p className="text-destructive text-sm">{errors.state.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      ZIP Code *
                    </label>
                    <Input
                      {...register('postcode')}
                      placeholder="10001"
                    />
                    {errors.postcode && (
                      <p className="text-destructive text-sm">{errors.postcode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.domain.id} className="flex justify-between text-sm">
                      <span>{item.domain.fullName}</span>
                      <span>{formatNaira(item.totalPrice)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatNaira(totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {formatNaira(totalPrice)} with Paystack
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

