// Domain related types
export interface Domain {
  id: string;
  name: string;
  tld: string;
  fullName: string;
  isAvailable: boolean;
  price: number;
  currency: string;
  registrationPeriod: number;
  renewalPrice?: number;
}

// Domain order types
export interface DomainOrder {
  name: string;
  domaintype: 'register' | 'transfer';
  regperiod: number;
  nameserver1?: string;
  nameserver2?: string;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
  registrationPeriod: number;
  renewalPrice?: number;
}

// Cart related types
export interface CartItem {
  domain: Domain;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  currency: string;
}

// User types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  zipCode?: string;
  isLoggedIn: boolean;
}

// Customer types
export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phonenumber: string;
  companyname?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
}

// Order types
export interface Order {
  id: string;
  customer: Customer;
  items: CartItem[];
  domains: DomainOrder[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'failed';
  paymentReference?: string;
  whmcsOrderId?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export interface PaymentData {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  callback_url: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

// WHMCS API types
export interface WHMCSApiResponse<T = any> {
  result: 'success' | 'error';
  status?: 'unavailable' | 'error';
  message?: string;
  data?: T;
  whois?: string;
  // GetClientsDetails response fields
  userid?: number;
  client_id?: number;
  id?: number;
  owner_user_id?: number;
  uuid?: string;
  firstname?: string;
  lastname?: string;
  fullname?: string;
  companyname?: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  fullstate?: string;
  state?: string;
  postcode?: string;
  countrycode?: string;
  country?: string;
  phonenumber?: string;
  tax_id?: string;
  email_preferences?: any;
  statecode?: string;
  countryname?: string;
  phonecc?: string;
  phonenumberformatted?: string;
  telephoneNumber?: string;
  billingcid?: number;
  notes?: string;
  currency?: number;
  defaultgateway?: string;
  cctype?: any;
  cclastfour?: any;
  gatewayid?: any;
  groupid?: number;
  status?: string;
  credit?: string;
  taxexempt?: boolean;
  latefeeoveride?: boolean;
  overideduenotices?: boolean;
  separateinvoices?: boolean;
  disableautocc?: boolean;
  emailoptout?: boolean;
  marketing_emails_opt_in?: boolean;
  overrideautoclose?: boolean;
  allowSingleSignOn?: number;
  email_verified?: boolean;
  language?: string;
  isOptedInToMarketingEmails?: boolean;
  tax_state?: string;
  tax_countrycode?: string;
  lastlogin?: string;
  currency_code?: string;
  users?: any;
  client?: any;
}

export interface WHMCSGetTLDPricingResponse {
  result: 'success' | 'error';
  currency: {
    id: number;
    code: string;
    prefix: string;
    suffix: string;
    format: number;
    rate: string;
  };
  pricing: Record<string, {
    categories: string[];
    addons: {
      dns: boolean;
      email: boolean;
      idprotect: boolean;
    };
    group: string;
    register: Record<string, string>;
    transfer: Record<string, string>;
    renew: Record<string, string>;
    grace_period: any;
    redemption_period: any;
  }>;
}

export interface WHMCSDomainAvailability {
  domain: string;
  status: 'available' | 'unavailable' | 'invalid';
  price?: number;
  currency?: string;
}

// Domain connection types
export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phonenumber: string;
  companyname?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
}

export interface ConnectionResult {
  success: boolean;
  domain: string;
  nameservers?: string[];
  aRecords?: Array<{ name: string; value: string }>;
  cnameRecords?: Array<{ name: string; value: string }>;
  instructions: string[];
  verificationStatus: 'pending' | 'verified' | 'failed';
  error?: string;
  currentDnsStatus?: {
    nameservers: string[];
    aRecords: Array<{ name: string; value: string }>;
    cnameRecords: Array<{ name: string; value: string }>;
    timestamp: string;
    error?: string;
  };
}

export interface DNSRecord {
  name: string;
  value: string;
}

export interface DNSInstructions {
  nameservers: string[];
  aRecords: DNSRecord[];
  cnameRecords: DNSRecord[];
  instructions: string[];
}

// Domain Management types
export interface ManagedDomain {
  id: string;
  domain: string;
  status: 'active' | 'expired' | 'suspended' | 'pending';
  registrationDate: string;
  expiryDate: string;
  autoRenew: boolean;
  nameservers: string[];
  registrar: string;
  renewalPrice: number;
  currency: string;
  dnsRecords?: DNSRecord[];
  lastChecked?: string;
}

export interface DomainRenewalRequest {
  domainId: string;
  period: number; // years
  autoRenew?: boolean;
}

export interface DomainRenewalResponse {
  success: boolean;
  orderId?: string;
  message: string;
  error?: string;
}

export interface DomainStatus {
  domain: string;
  status: 'active' | 'expired' | 'suspended' | 'pending';
  expiryDate: string;
  daysUntilExpiry: number;
  autoRenew: boolean;
  nameservers: string[];
  lastChecked: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

