import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Paystack webhook secret not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const hash = crypto
      .createHmac('sha512', webhookSecret)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle successful payment
    if (event.event === 'charge.success') {
      const { data } = event;
      
      // Extract customer and domain information from metadata
      const customerData = data.metadata?.customer;
      const domains = data.metadata?.domains;

      if (customerData && domains) {
        try {
          // Create order using the new API endpoint
          const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orders/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerData,
              domains,
            }),
          });

          const orderResult = await orderResponse.json();
          
          if (orderResult.success) {
            console.log('Order created successfully in WHMCS:', orderResult.data.orderId);
            
            // Here you could also:
            // - Send confirmation email
            // - Update database
            // - Trigger domain registration process
            
            return NextResponse.json({ success: true });
          } else {
            console.error('Failed to create order in WHMCS:', orderResult.error);
            return NextResponse.json(
              { success: false, error: 'Failed to create order' },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error('Order creation error:', error);
          return NextResponse.json(
            { success: false, error: 'Order creation failed' },
            { status: 500 }
          );
        }
      }
    }

    // Handle other events if needed
    console.log('Received Paystack webhook event:', event.event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

