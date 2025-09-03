# Domain Management System

This document describes the domain management system that allows users to view, manage, and renew their domains.

## Features

### 1. Domain Overview
- **Dashboard View**: See all domains with status indicators
- **Summary Statistics**: Total domains, active domains, expiring domains, expired domains
- **Status Tracking**: Real-time domain status (active, expired, suspended, pending)

### 2. Domain Management
- **Renewal Management**: Renew domains for 1-10 years
- **Auto-renewal**: Enable/disable automatic renewal
- **Nameserver Management**: Update domain nameservers
- **DNS Records**: View current DNS configuration

### 3. Expiry Monitoring
- **Expiry Alerts**: Visual indicators for domains expiring soon
- **Status Colors**: Color-coded status indicators
- **Urgency Levels**: Critical (≤7 days), Warning (≤30 days), Normal (>30 days)

## API Endpoints

### Get Domains
```
GET /api/domains?clientId={clientId}
GET /api/domains?domainId={domainId}
```

### Renew Domain
```
POST /api/domains/renew
{
  "domainId": "123",
  "period": 1,
  "autoRenew": true
}
```

### Update Domain Settings
```
PUT /api/domains
{
  "action": "updateAutoRenewal",
  "domainId": "123",
  "autoRenew": true
}

PUT /api/domains
{
  "action": "updateNameservers",
  "domainId": "123",
  "nameservers": ["ns1.example.com", "ns2.example.com"]
}
```

### Get Domain Status
```
GET /api/domains/status?domain={domain.com}
```

### Get Renewal Pricing
```
GET /api/domains/pricing?domain={domain.com}
```

## Components

### DomainManagementPage (`/app/domains/page.tsx`)
Main page component that displays:
- Domain summary cards
- List of all domains with management options
- Renewal dialog
- Nameserver management dialog

### DomainStatusBadge (`/components/domain/DomainStatusBadge.tsx`)
Reusable component for displaying domain status with appropriate icons and colors.

## Services

### DomainManagementService (`/services/domainManagementService.ts`)
Core service that handles:
- WHMCS API integration
- Domain data retrieval
- Renewal processing
- Nameserver updates
- DNS record fetching

## Utilities

### Domain Utils (`/lib/domainUtils.ts`)
Utility functions for:
- Calculating expiry status
- Formatting dates
- Getting renewal recommendations
- Checking urgency levels

## Usage

### Accessing Domain Management
1. Navigate to the main page
2. Click "Manage Domains" button in the header
3. View your domain dashboard

### Renewing a Domain
1. Click "Renew" button on any domain
2. Select renewal period (1-10 years)
3. Choose auto-renewal option
4. Confirm renewal

### Managing Nameservers
1. Click "Manage" button on any domain
2. Update nameserver entries
3. Save changes

### Monitoring Expiry
- Red indicators: Expired or expiring within 7 days
- Yellow indicators: Expiring within 30 days
- Green indicators: Active and healthy

## Environment Variables

Ensure these WHMCS environment variables are set:
```
WHMCS_API_URL=https://your-whmcs.com/includes/api.php
WHMCS_API_IDENTIFIER=your_api_identifier
WHMCS_API_SECRET=your_api_secret
WHMCS_API_ACCESS_KEY=your_access_key
```

## Error Handling

The system includes comprehensive error handling:
- API failures are caught and displayed to users
- Network errors show appropriate messages
- Invalid data is validated before processing
- WHMCS API errors are properly formatted

## Security

- All API calls are server-side only
- Client ID validation prevents unauthorized access
- Input sanitization for all user inputs
- Secure API key handling

## Future Enhancements

Potential improvements:
- Bulk domain operations
- Domain transfer functionality
- Advanced DNS management
- Email notifications for expiry
- Domain analytics and reporting
- Integration with external DNS providers
