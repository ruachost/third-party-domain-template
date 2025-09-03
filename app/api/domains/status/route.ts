import { NextRequest, NextResponse } from 'next/server';
import { DomainStatus, ApiResponse } from '@/types';

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

function mapDomainStatus(whmcsStatus: string): 'active' | 'expired' | 'suspended' | 'pending' {
  switch (whmcsStatus.toLowerCase()) {
    case 'active':
      return 'active';
    case 'expired':
      return 'expired';
    case 'suspended':
      return 'suspended';
    case 'pending':
    case 'pendingtransfer':
      return 'pending';
    default:
      return 'pending';
  }
}

async function getDomainStatus(domain: string): Promise<DomainStatus> {
  try {
    // Get domain info from WHMCS
    const response = await makeWhmcsRequest('GetClientsDomains', {
      domain: domain
    });

    if (!response.domains || response.domains.length === 0) {
      throw new Error('Domain not found');
    }

    const domainData = response.domains[0];
    const expiryDate = new Date(domainData.nextduedate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      domain: domainData.domain,
      status: mapDomainStatus(domainData.status),
      expiryDate: domainData.nextduedate,
      daysUntilExpiry,
      autoRenew: domainData.autorenew === '1',
      nameservers: [
        domainData.ns1 || '',
        domainData.ns2 || '',
        domainData.ns3 || '',
        domainData.ns4 || ''
      ].filter(ns => ns),
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get domain status:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({
        success: false,
        error: 'Domain name is required'
      } as ApiResponse, { status: 400 });
    }

    const result = await getDomainStatus(domain);

    return NextResponse.json({
      success: true,
      data: result
    } as ApiResponse);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse, { status: 500 });
  }
}
