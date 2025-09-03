import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

async function getDomainDNSRecords(domain: string): Promise<any[]> {
  try {
    const records: any[] = [];
    
    // Get A records
    try {
      const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const aData = await aResponse.json();
      if (aData.Answer) {
        aData.Answer.forEach((record: any) => {
          records.push({
            type: 'A',
            name: record.name,
            value: record.data,
            ttl: record.TTL
          });
        });
      }
    } catch (error) {
      console.error('Failed to get A records:', error);
    }

    // Get CNAME records
    try {
      const cnameResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
      const cnameData = await cnameResponse.json();
      if (cnameData.Answer) {
        cnameData.Answer.forEach((record: any) => {
          records.push({
            type: 'CNAME',
            name: record.name,
            value: record.data,
            ttl: record.TTL
          });
        });
      }
    } catch (error) {
      console.error('Failed to get CNAME records:', error);
    }

    // Get MX records
    try {
      const mxResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const mxData = await mxResponse.json();
      if (mxData.Answer) {
        mxData.Answer.forEach((record: any) => {
          records.push({
            type: 'MX',
            name: record.name,
            value: record.data,
            ttl: record.TTL
          });
        });
      }
    } catch (error) {
      console.error('Failed to get MX records:', error);
    }

    return records;
  } catch (error) {
    console.error('Failed to get DNS records:', error);
    return [];
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

    const result = await getDomainDNSRecords(domain);

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
