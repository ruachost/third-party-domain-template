import { NextRequest, NextResponse } from 'next/server';
import { ManagedDomain, ApiResponse } from '@/types';

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

async function getClientDomains(clientId: string): Promise<ManagedDomain[]> {
  try {
    const response = await makeWhmcsRequest('GetClientsDomains', {
      clientid: clientId,
      limitnum: 1000
    });

    // Handle both response structures: domains.domain (array) or domains (array)
    let domainsArray: any[] = [];
    
    if (response.domains) {
      if (Array.isArray(response.domains)) {
        domainsArray = response.domains;
      } else if (response.domains.domain && Array.isArray(response.domains.domain)) {
        domainsArray = response.domains.domain;
      }
    }

    if (domainsArray.length === 0) {
      return [];
    }

    return domainsArray.map((domain: any) => ({
      id: domain.id.toString(),
      domain: domain.domainname || domain.domain,
      status: mapDomainStatus(domain.status),
      registrationDate: domain.regdate,
      expiryDate: domain.nextduedate || domain.expirydate,
      autoRenew: domain.donotrenew === '0', // donotrenew = 0 means auto-renew is enabled
      nameservers: [
        domain.ns1 || '',
        domain.ns2 || '',
        domain.ns3 || '',
        domain.ns4 || ''
      ].filter(ns => ns),
      registrar: domain.registrar || 'Unknown',
      renewalPrice: parseFloat(domain.recurringamount || '0'),
      currency: 'NGN', // Always use NGN as per memory
      lastChecked: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to get client domains:', error);
    throw error;
  }
}

async function getDomainDetails(domainId: string): Promise<ManagedDomain | null> {
  try {
    const response = await makeWhmcsRequest('GetClientsDomains', {
      domainid: domainId
    });

    // Handle both response structures: domains.domain (array) or domains (array)
    let domainsArray: any[] = [];
    
    if (response.domains) {
      if (Array.isArray(response.domains)) {
        domainsArray = response.domains;
      } else if (response.domains.domain && Array.isArray(response.domains.domain)) {
        domainsArray = response.domains.domain;
      }
    }

    if (domainsArray.length === 0) {
      return null;
    }

    const domain = domainsArray[0];
    
    // Get DNS records
    const dnsRecords = await getDomainDNSRecords(domain.domainname || domain.domain);

    return {
      id: domain.id.toString(),
      domain: domain.domainname || domain.domain,
      status: mapDomainStatus(domain.status),
      registrationDate: domain.regdate,
      expiryDate: domain.nextduedate || domain.expirydate,
      autoRenew: domain.donotrenew === '0', // donotrenew = 0 means auto-renew is enabled
      nameservers: [
        domain.ns1 || '',
        domain.ns2 || '',
        domain.ns3 || '',
        domain.ns4 || ''
      ].filter(ns => ns),
      registrar: domain.registrar || 'Unknown',
      renewalPrice: parseFloat(domain.recurringamount || '0'),
      currency: 'NGN', // Always use NGN as per memory
      dnsRecords,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get domain details:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const domainId = searchParams.get('domainId');

    if (!clientId && !domainId) {
      return NextResponse.json({
        success: false,
        error: 'Client ID or Domain ID is required'
      } as ApiResponse, { status: 400 });
    }

    let result;

    if (domainId) {
      // Get specific domain details
      result = await getDomainDetails(domainId);
      if (!result) {
        return NextResponse.json({
          success: false,
          error: 'Domain not found'
        } as ApiResponse, { status: 404 });
      }
    } else {
      // Get all domains for client
      result = await getClientDomains(clientId!);
    }

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

async function updateAutoRenewal(domainId: string, autoRenew: boolean): Promise<ApiResponse> {
  try {
    await makeWhmcsRequest('UpdateClientDomain', {
      domainid: domainId,
      autorenew: autoRenew ? '1' : '0'
    });

    return {
      success: true,
      message: 'Auto-renewal setting updated successfully'
    };
  } catch (error) {
    console.error('Failed to update auto-renewal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function updateNameservers(domainId: string, nameservers: string[]): Promise<ApiResponse> {
  try {
    const params: Record<string, any> = { domainid: domainId };
    
    nameservers.forEach((ns, index) => {
      if (ns) {
        params[`ns${index + 1}`] = ns;
      }
    });

    await makeWhmcsRequest('UpdateClientDomain', params);

    return {
      success: true,
      message: 'Nameservers updated successfully'
    };
  } catch (error) {
    console.error('Failed to update nameservers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, domainId, ...params } = body;

    let result;

    switch (action) {
      case 'updateAutoRenewal':
        result = await updateAutoRenewal(domainId, params.autoRenew);
        break;
      
      case 'updateNameservers':
        result = await updateNameservers(domainId, params.nameservers);
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        } as ApiResponse, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse, { status: 500 });
  }
}
