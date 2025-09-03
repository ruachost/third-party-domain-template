import { NextRequest, NextResponse } from 'next/server';
import DomainConnectionService from '@/services/domainConnectionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    // Validate required fields
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Create domain connection service instance
    const domainService = new DomainConnectionService();
    
    // Connect the domain
    const result = await domainService.connectExistingDomain({
      domain
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Domain connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect domain',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
