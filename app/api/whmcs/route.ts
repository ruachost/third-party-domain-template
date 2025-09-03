import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params = {} } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required'
      } as ApiResponse, { status: 400 });
    }

    const apiUrl = process.env.WHMCS_API_URL;
    const apiIdentifier = process.env.WHMCS_API_IDENTIFIER;
    const apiSecret = process.env.WHMCS_API_SECRET;
    const apiAccessKey = process.env.WHMCS_API_ACCESS_KEY;

    if (!apiUrl || !apiIdentifier || !apiSecret || !apiAccessKey) {
      return NextResponse.json({
        success: false,
        error: 'WHMCS API configuration is missing'
      } as ApiResponse, { status: 500 });
    }

    const postFields = {
      identifier: apiIdentifier,
      secret: apiSecret,
      accesskey: apiAccessKey,
      responsetype: 'json',
      action,
      ...params
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(postFields)
    });

    if (!response.ok) {
      throw new Error(`WHMCS API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result === 'error') {
      throw new Error(data.message || 'WHMCS API error');
    }

    return NextResponse.json({
      success: true,
      data
    } as ApiResponse);

  } catch (error) {
    console.error('WHMCS API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse, { status: 500 });
  }
}
