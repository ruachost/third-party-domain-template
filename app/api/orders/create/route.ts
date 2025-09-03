import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { WHMCSApiResponse } from '@/types';

// WHMCS API configuration
const WHMCS_CONFIG = {
  apiUrl: process.env.WHMCS_API_URL || '',
  apiIdentifier: process.env.WHMCS_API_IDENTIFIER || '',
  apiSecret: process.env.WHMCS_API_SECRET || '',
  apiAccessKey: process.env.WHMCS_API_ACCESS_KEY || '',
};

async function makeWHMCSRequest(action: string, params: Record<string, any> = {}): Promise<WHMCSApiResponse> {
  try {
    const queryParams = new URLSearchParams({
      action,
      identifier: WHMCS_CONFIG.apiIdentifier,
      secret: WHMCS_CONFIG.apiSecret,
      accesskey: WHMCS_CONFIG.apiAccessKey,
      responsetype: 'json',
      ...params,
    });

    const response = await axios.get(`${WHMCS_CONFIG.apiUrl}?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('WHMCS API Error:', error);
    return {
      result: 'error',
      message: 'Failed to connect to WHMCS API',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerData, domains, paymentMethod = 'paystack' } = body;

    if (!customerData || !domains || !Array.isArray(domains)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customerData and domains' },
        { status: 400 }
      );
    }

    // Validate customer data - all fields are required for WHMCS client creation
    const requiredFields = [
      'firstName', 
      'lastName', 
      'email', 
      'address1', 
      'city', 
      'state', 
      'postcode', 
      'country', 
      'phonenumber'
    ];
    
    for (const field of requiredFields) {
      if (!customerData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required customer field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate and normalize domains
    let normalizedDomains;
    try {
      normalizedDomains = domains.map((domain, index) => {
        // Handle different possible field names from frontend
        const domainName = domain.name || domain.domain || domain.fullName;
        const domainType = domain.domaintype || domain.domainType || 'register'; // Default to register
        const regPeriod = domain.regperiod || domain.registrationPeriod || domain.regPeriod || 1; // Default to 1 year

        if (!domainName) {
          throw new Error(`Domain name is required for domain at index ${index}`);
        }

        // Validate domain type
        if (!['register', 'transfer'].includes(domainType)) {
          throw new Error(`Domain type must be either "register" or "transfer" for domain: ${domainName}`);
        }

        // Validate registration period
        if (typeof regPeriod !== 'number' || regPeriod < 1) {
          throw new Error(`Registration period must be a number greater than 0 for domain: ${domainName}`);
        }

        return {
          name: domainName,
          domaintype: domainType,
          regperiod: regPeriod,
          nameserver1: domain.nameserver1,
          nameserver2: domain.nameserver2,
        };
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Invalid domain data' },
        { status: 400 }
      );
    }

    // Create order in WHMCS
    try {
      let clientId: string;
      let isNewClient = false;

      // First, check if client already exists by email
      const existingClientResponse = await makeWHMCSRequest('GetClientsDetails', {
        email: customerData.email,
      });

      if (existingClientResponse.result === 'success' && (existingClientResponse as any).id) {
        // Client exists, use existing client ID
        clientId = (existingClientResponse as any).id.toString();
        console.log('Found existing client:', existingClientResponse);
        console.log(`Using existing client ID: ${clientId}`);
      } else {
        // Client doesn't exist, create new client
        const clientResponse = await makeWHMCSRequest('AddClient', {
          firstname: customerData.firstName,
          lastname: customerData.lastName,
          email: customerData.email,
          phonenumber: customerData.phonenumber,
          companyname: customerData.companyname || '',
          address1: customerData.address1,
          address2: customerData.address2 || '',
          city: customerData.city,
          state: customerData.state,
          country: customerData.country,
          postcode: customerData.postcode,
        });

        if (clientResponse.result !== 'success') {
          throw new Error('Failed to create client');
        }

        clientId = clientResponse.data.clientid;
        isNewClient = true;
        console.log(`Created new client ID: ${clientId}`);
      }

      // Prepare domain data for WHMCS
      const domainData = normalizedDomains.map(domain => ({
        domain: domain.name,
        domaintype: domain.domaintype,
        regperiod: domain.regperiod,
        nameserver1: domain.nameserver1 || 'nsa.ruachost.com',
        nameserver2: domain.nameserver2 || 'nsb.ruachost.com',
      }));

      // Create order with all required parameters
      const orderResponse = await makeWHMCSRequest('AddOrder', {
        clientid: clientId,
        paymentmethod: paymentMethod,
        domains: domainData,
      });

      if (orderResponse.result === 'success') {
        return NextResponse.json({
          success: true,
          data: {
            orderId: orderResponse.data.orderid,
            clientId: clientId,
            isNewClient: isNewClient,
            domains: domainData,
            paymentMethod: paymentMethod,
          },
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create order in WHMCS',
            details: orderResponse.message || 'Unknown error'
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
