import { NextRequest, NextResponse } from 'next/server';
import { DomainRenewalRequest, DomainRenewalResponse, ApiResponse } from '@/types';

async function makeWhmcsRequest(action: string, params: Record<string, any> = {}): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whmcs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, params })
    });

    if (!response.ok) {
      throw new Error(`WHMCS API request failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'WHMCS API error');
    }

    return result.data;
  } catch (error) {
    console.error('WHMCS API Error:', error);
    throw error;
  }
}

async function renewDomain(renewalRequest: DomainRenewalRequest): Promise<DomainRenewalResponse> {
  try {
    const response = await makeWhmcsRequest('DomainRenew', {
      domainid: renewalRequest.domainId,
      regperiod: renewalRequest.period,
      autorenew: renewalRequest.autoRenew ? '1' : '0'
    });

    return {
      success: true,
      orderId: response.orderid,
      message: 'Domain renewal order created successfully'
    };
  } catch (error) {
    console.error('Failed to renew domain:', error);
    return {
      success: false,
      message: 'Failed to renew domain',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DomainRenewalRequest = await request.json();
    const { domainId, period, autoRenew } = body;

    if (!domainId || !period) {
      return NextResponse.json({
        success: false,
        error: 'Domain ID and renewal period are required'
      } as ApiResponse, { status: 400 });
    }

    if (period < 1 || period > 10) {
      return NextResponse.json({
        success: false,
        error: 'Renewal period must be between 1 and 10 years'
      } as ApiResponse, { status: 400 });
    }

    const result = await renewDomain({
      domainId,
      period,
      autoRenew: autoRenew || false
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse, { status: 500 });
  }
}
