import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { WHMCSApiResponse, WHMCSGetTLDPricingResponse, DomainSearchResult } from '@/types';
import crypto from 'crypto';

// WHMCS API configuration
const apiUrl = process.env.WHMCS_API_URL || '';
const apiIdentifier = process.env.WHMCS_API_IDENTIFIER || '';
const apiSecret = process.env.WHMCS_API_SECRET || '';
const apiAccessKey = process.env.WHMCS_API_ACCESS_KEY || '';

async function makeWHMCSRequest<T = any>(action: string, params: Record<string, any> = {}): Promise<T> {
  try {
    const queryParams = new URLSearchParams({
      action,
      identifier: apiIdentifier,
      secret: apiSecret,
      accesskey: apiAccessKey,
      responsetype: 'json',
      ...params,
    });

    const response = await axios.get(`${apiUrl}?${queryParams.toString()}`);
    return response.data as T;
  } catch (error) {
    console.error('WHMCS API Error:', error);
    throw new Error('Failed to connect to WHMCS API');
  }
}

async function getDomainPricing(domain: string): Promise<{ price: number; currency: string; renewalPrice?: number } | null> {
  try {
    // Extract TLD from domain (e.g., example.com -> com)
    const tld = domain.split('.').pop()?.toLowerCase();
    if (!tld) {
      console.error('Invalid domain format:', domain);
      return null;
    }

    // Call GetTLDPricing API
    const response = await makeWHMCSRequest<WHMCSGetTLDPricingResponse>('GetTLDPricing', {
      tld: tld,
    });

    if (response.result === 'success' && response.pricing) {
      const tldData = response.pricing[tld];
      
      if (tldData && tldData.register && tldData.register['1']) {
        // Get currency information from response
        const currency = response.currency?.code || 'USD';
        
        return {
          price: parseFloat(tldData.register['1']),
          currency: currency,
          renewalPrice: tldData.renew && tldData.renew['1'] ? parseFloat(tldData.renew['1']) : undefined,
        };
      } else {
        console.warn(`No pricing data found for TLD: ${tld}`);
        return null;
      }
    } else {
      console.error('GetTLDPricing API failed:', response);
      return null;
    }
  } catch (error) {
    console.error('Domain pricing fetch failed:', error);
    return null;
  }
}

async function checkDomainAvailability(domain: string): Promise<DomainSearchResult | null> {
  try {
    // Step 1: Call DomainWhois to check availability
    const response = await makeWHMCSRequest('DomainWhois', {
      domain,
    });

    if (response.result === 'success') {
      // Based on your API responses:
      // - whois: "" (empty) means domain is available for registration
      // - whois: contains data means domain exists (not available for registration)
      const isAvailable = !(response as any).whois || (response as any).whois === '';
      
      // Step 2: If domain is available, get pricing information
      let pricingInfo = null;
      if (isAvailable) {
        pricingInfo = await getDomainPricing(domain);
      }
      
      return {
        domain,
        available: isAvailable,
        price: pricingInfo?.price || 0,
        currency: pricingInfo?.currency || 'USD',
        registrationPeriod: 1,
        renewalPrice: pricingInfo?.renewalPrice,
      };
    }

    return {
      domain,
      available: false,
      price: 0,
      currency: 'USD',
      registrationPeriod: 1,
    };
  } catch (error) {
    console.error('Domain availability check failed:', error);
    return null;
  }
}

function createSignature(payload: string): string {
  const secret = process.env.CHALLENGE_SECRET || process.env.WHMCS_API_SECRET || 'domain-app-secret';
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const challengeId = crypto.randomBytes(8).toString('hex');
    const payload = `${a}:${b}:${challengeId}`;
    const sig = createSignature(payload);

    return NextResponse.json({ a, b, challengeId, sig });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, answer, challengeId, sig } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    // Validate simple challenge
    if (typeof answer !== 'number' || !challengeId || !sig) {
      return NextResponse.json(
        { error: 'Challenge validation failed' },
        { status: 400 }
      );
    }

    // Since we do not persist challenge server-side, verify HMAC signature
    // We will brute-force small a,b (1..9) to find a matching signature and ensure provided answer matches
    let valid = false;
    for (let x = 1; x <= 9 && !valid; x++) {
      for (let y = 1; y <= 9 && !valid; y++) {
        const payload = `${x}:${y}:${challengeId}`;
        const expectedSig = createSignature(payload);
        if (crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))) {
          valid = answer === x + y;
        }
      }
    }

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid challenge response' },
        { status: 400 }
      );
    }

    // Check domain availability
    const result = await checkDomainAvailability(domain);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to check domain availability' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Domain search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
