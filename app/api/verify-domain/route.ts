import { NextRequest, NextResponse } from 'next/server';
import DomainConnectionService from '@/services/domainConnectionService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    console.log('Verifying domain connection for:', domain);

    // Create domain connection service instance
    const domainService = new DomainConnectionService();
    
    // Check current DNS status
    const dnsStatus = await (domainService as any).checkCurrentDNSStatus(domain);
    
    // Determine if domain is connected
    const isVerified = (domainService as any).isDomainConnected(dnsStatus);

    return NextResponse.json({
      success: true,
      status: isVerified ? 'verified' : 'pending',
      domain,
      dnsStatus: dnsStatus
    });

  } catch (error) {
    console.error('Domain verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'failed',
        error: 'Failed to verify domain',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
