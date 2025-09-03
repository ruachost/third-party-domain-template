# New Domain Connection Flow - Ruachost Integration

## Overview
The domain connection flow has been completely overhauled to provide a streamlined experience for connecting domains to Ruachost services. The new flow focuses on DNS verification and real-time status checking.

## New Flow Architecture

### 1. **User Input**
- User enters their domain name (e.g., "ruachost.com")
- Selects service type (hosting, website_builder, ecommerce)
- Provides contact information

### 2. **DNS Instructions Generation**
- System generates specific DNS instructions based on service type
- Instructions are tailored for Ruachost infrastructure
- Clear, step-by-step guidance provided

### 3. **Real-time DNS Verification**
- System checks current DNS configuration
- Verifies if domain points to Ruachost servers
- Provides immediate feedback on connection status

## DNS Configuration Options

### **Option 1: Nameservers (Recommended for Hosting)**
```
nsa.ruachost.com
nsb.ruachost.com
```

### **Option 2: A Records (For Website Builder)**
```
@ (root domain) → 185.199.108.153
www → 185.199.108.153
```

### **Option 3: CNAME Records (For E-commerce)**
```
@ (root domain) → 185.199.108.153
www → yourdomain.ruachost.com
shop → shop.ruachost.com
```

## Service Types & Instructions

### **Web Hosting**
- **Method**: Nameserver update
- **Instructions**: Update nameservers to `nsa.ruachost.com` and `nsb.ruachost.com`
- **Benefits**: Full DNS control, automatic configuration

### **Website Builder**
- **Method**: A records
- **Instructions**: Point @ and www to Ruachost IP
- **Benefits**: Keep existing nameservers, simple setup

### **E-commerce**
- **Method**: Mixed (A + CNAME)
- **Instructions**: Root domain via A record, subdomains via CNAME
- **Benefits**: Flexible subdomain management

## DNS Verification Logic

The system checks if a domain is connected by verifying:

1. **Nameserver Check**: Are nameservers pointing to `nsa.ruachost.com` or `nsb.ruachost.com`?
2. **A Record Check**: Are A records pointing to `185.199.108.153`?
3. **CNAME Check**: Are CNAME records pointing to `*.ruachost.com`?

**Connection Status**: Domain is considered "connected" if ANY of these conditions are met.

## API Endpoints

### **POST /api/connect-domain**
```json
{
  "domain": "example.com",
  "serviceType": "hosting",
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "nameservers": ["nsa.ruachost.com", "nsb.ruachost.com"],
  "aRecords": [{"name": "@", "value": "185.199.108.153"}],
  "cnameRecords": [],
  "instructions": [
    "1. Log in to your domain registrar",
    "2. Find the DNS or Nameserver settings",
    "3. Update nameservers to:",
    "   nsa.ruachost.com",
    "   nsb.ruachost.com",
    "4. Save changes and wait 24-48 hours for DNS propagation"
  ],
  "verificationStatus": "pending",
  "currentDnsStatus": {
    "nameservers": ["ns1.oldprovider.com", "ns2.oldprovider.com"],
    "aRecords": [{"name": "@", "value": "192.168.1.1"}],
    "cnameRecords": [],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### **GET /api/verify-domain?domain=example.com**
**Response:**
```json
{
  "success": true,
  "status": "verified",
  "domain": "example.com",
  "dnsStatus": {
    "nameservers": ["nsa.ruachost.com", "nsb.ruachost.com"],
    "aRecords": [],
    "cnameRecords": [],
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}
```

## User Experience Flow

### **Step 1: Form Submission**
1. User fills out domain connection form
2. Clicks "Connect My Domain"
3. Form submits to `/api/connect-domain`

### **Step 2: Instructions Display**
1. System shows current DNS status
2. Displays step-by-step instructions
3. Shows required DNS records
4. Status indicator shows "pending"

### **Step 3: Real-time Verification**
1. System polls `/api/verify-domain` every 30 seconds
2. Checks if DNS changes have propagated
3. Updates status indicator
4. Stops polling after 1 hour or when verified

### **Step 4: Completion**
1. Green status indicates successful connection
2. User can now use their domain with Ruachost services
3. No further action required

## Technical Implementation

### **DNS Checking Methods**
- **Google DNS API**: Uses `https://dns.google/resolve` for DNS lookups
- **Real-time Verification**: Checks NS, A, and CNAME records
- **Multiple Validation**: Accepts any valid connection method

### **Error Handling**
- **Network Issues**: Graceful fallback for DNS lookup failures
- **Invalid Domains**: Clear error messages for malformed domains
- **Timeout Handling**: Proper timeout for DNS queries

### **Performance**
- **Caching**: DNS results cached for 30 seconds
- **Async Operations**: Non-blocking DNS lookups
- **Efficient Polling**: Smart polling intervals

## Configuration

### **Server IP Address**
Update the IP address in `services/domainConnectionService.ts`:
```typescript
const ruachostIP = '185.199.108.153'; // Update with actual Ruachost IP
```

### **Nameservers**
Current configuration:
```typescript
const ruachostNameservers = ['nsa.ruachost.com', 'nsb.ruachost.com'];
```

### **Service Types**
Available options:
- `hosting`: Full nameserver delegation
- `website_builder`: A record configuration
- `ecommerce`: Mixed A/CNAME setup

## Benefits of New Flow

### **For Users**
✅ **Immediate Feedback**: See current DNS status instantly
✅ **Clear Instructions**: Step-by-step guidance
✅ **Real-time Updates**: Live status monitoring
✅ **Multiple Options**: Choose best connection method

### **For Administrators**
✅ **No WHMCS Dependency**: Works without external APIs
✅ **Real DNS Verification**: Actual DNS checking
✅ **Flexible Configuration**: Easy to update settings
✅ **Better Error Handling**: Clear error messages

### **For Developers**
✅ **Clean Architecture**: Separated concerns
✅ **Type Safety**: Full TypeScript coverage
✅ **Testable Code**: Modular design
✅ **Extensible**: Easy to add new service types

## Testing the New Flow

### **Test Domain Connection**
1. Go to domain connection tab
2. Enter any domain (e.g., "ruachost.com")
3. Select service type
4. Submit form
5. Observe DNS status and instructions

### **Test DNS Verification**
1. Use a domain that points to Ruachost servers
2. Submit connection form
3. Should show "verified" status immediately

### **Test Real-time Updates**
1. Submit form with non-Ruachost domain
2. Update DNS settings at registrar
3. Watch status change from "pending" to "verified"

## Next Steps

1. **Update IP Address**: Set correct Ruachost server IP
2. **Test with Real Domains**: Verify with actual domains
3. **Monitor Performance**: Check DNS lookup speeds
4. **User Feedback**: Gather feedback on new flow
5. **Documentation**: Update user guides

The new domain connection flow provides a much more robust and user-friendly experience for connecting domains to Ruachost services!
