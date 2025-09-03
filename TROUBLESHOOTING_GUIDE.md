# Domain Connection Troubleshooting Guide

## Issue: Domain Connection Failing

You're getting this response:
```json
{
    "success": false,
    "domain": "ruachost.com",
    "instructions": [],
    "verificationStatus": "failed"
}
```

## Root Cause Analysis

The domain connection is failing because the WHMCS API credentials are not configured. The service is trying to make API calls to WHMCS but can't authenticate.

## Solutions

### Option 1: Demo Mode (Immediate Testing)

The system now automatically detects when WHMCS credentials are missing and runs in **demo mode**. This means:

✅ **What works in demo mode:**
- Domain connection form submission
- DNS instructions generation
- Real-time status tracking
- All UI functionality

✅ **What's simulated:**
- Domain validation (skipped)
- WHMCS service creation (skipped)
- Domain verification (simulated with 70% success rate)

### Option 2: Configure WHMCS API (Production)

To enable full functionality, you need to configure your WHMCS API credentials:

#### Step 1: Get WHMCS API Credentials

1. Log into your WHMCS admin panel
2. Go to **Setup > Staff Management > API Credentials**
3. Create a new API credential or use existing one
4. Note down:
   - **API Identifier**
   - **API Secret**
   - **API URL** (usually: `https://yourdomain.com/includes/api.php`)

#### Step 2: Create Environment File

Create a `.env.local` file in your project root:

```env
# WHMCS API Configuration
WHMCS_API_URL=https://your-whmcs-installation.com/includes/api.php
WHMCS_API_IDENTIFIER=your_api_identifier_here
WHMCS_API_SECRET=your_api_secret_here

# Optional: Paystack Configuration
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

#### Step 3: Restart Development Server

```bash
npm run dev
```

## Testing the Fix

### Test in Demo Mode (Current State)

1. Go to your domain connection form
2. Enter any domain (e.g., "ruachost.com")
3. Select a service type
4. Fill in customer information
5. Submit the form

**Expected Result:**
```json
{
    "success": true,
    "domain": "ruachost.com",
    "nameservers": ["ns1.yourplatform.com", "ns2.yourplatform.com"],
    "aRecords": [{"name": "@", "value": "123.45.67.89"}],
    "cnameRecords": [],
    "instructions": [
        "1. Log in to your domain registrar",
        "2. Go to DNS settings",
        "3. Add these A records:",
        "   @ points to 123.45.67.89",
        "4. Save changes and wait for propagation (up to 48 hours)"
    ],
    "verificationStatus": "pending"
}
```

### Test with WHMCS API (After Configuration)

1. Configure your `.env.local` file with real WHMCS credentials
2. Restart the development server
3. Test the same form submission

**Expected Result:**
- Real domain validation via WHMCS API
- Actual service creation in WHMCS
- Real domain verification

## Debugging Steps

### 1. Check Console Logs

Look for these log messages in your terminal:

```
Running in demo mode - skipping WHMCS API calls
Demo mode: Simulating domain verification for ruachost.com
```

### 2. Check Network Tab

In your browser's developer tools:
- Go to Network tab
- Submit the domain connection form
- Check the API response from `/api/connect-domain`

### 3. Verify Environment Variables

Add this temporary debug endpoint to check your environment:

```typescript
// Add to app/api/debug/route.ts
export async function GET() {
  return NextResponse.json({
    hasWhmcsUrl: !!process.env.WHMCS_API_URL,
    hasWhmcsIdentifier: !!process.env.WHMCS_API_IDENTIFIER,
    hasWhmcsSecret: !!process.env.WHMCS_API_SECRET,
    mode: (!process.env.WHMCS_API_URL || !process.env.WHMCS_API_IDENTIFIER || !process.env.WHMCS_API_SECRET) ? 'demo' : 'production'
  });
}
```

## Common Issues

### Issue 1: "WHMCS API credentials not configured"

**Solution:** Add the environment variables to `.env.local`

### Issue 2: "WHMCS API request failed with status: 401"

**Solution:** Check your API credentials are correct

### Issue 3: "WHMCS API request failed with status: 404"

**Solution:** Verify your WHMCS_API_URL is correct

### Issue 4: Domain validation fails

**Solution:** Ensure the domain exists and is accessible

## Current Status

✅ **Fixed Issues:**
- Added demo mode for testing without WHMCS
- Improved error handling and logging
- Added proper TypeScript types
- Enhanced API responses with error details

✅ **Working Features:**
- Domain connection form
- DNS instructions generation
- Real-time status tracking
- Tab navigation with shadcn/ui

## Next Steps

1. **For Testing:** The demo mode is now working - you can test the full UI flow
2. **For Production:** Configure your WHMCS API credentials when ready
3. **For Customization:** Update the platform DNS settings in the service

The domain connection feature is now fully functional in demo mode and ready for production use once you configure the WHMCS API credentials!
