import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Payment initialize request received');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { amount, email, reference, callback_url, metadata, currency } = body;

    // Validate required fields
    if (!amount || !email || !reference) {
      console.log('Missing required fields:', { amount: !!amount, email: !!email, reference: !!reference });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Paystack secret key
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error('Paystack secret key not configured');
      return NextResponse.json(
        { success: false, error: 'Paystack secret key not configured' },
        { status: 500 }
      );
    }

    console.log('Initializing payment with Paystack...');
    
    // Initialize payment with Paystack directly
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Paystack expects amount in kobo (smallest currency unit) and must be an integer
        email,
        reference,
        callback_url: callback_url,
        metadata,
        currency: 'NGN', // Force NGN as merchant only supports Nigerian Naira
      }),
    });

    console.log('Paystack response status:', paystackResponse.status);
    
    const paystackData = await paystackResponse.json();
    console.log('Paystack response data:', paystackData);

    if (paystackData.status && paystackData.data) {
      return NextResponse.json({
        success: true,
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference: paystackData.data.reference,
        },
      });
    } else {
      console.error('Paystack initialization failed:', paystackData);
      return NextResponse.json(
        { 
          success: false, 
          error: paystackData.message || 'Failed to initialize payment',
          details: paystackData 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

