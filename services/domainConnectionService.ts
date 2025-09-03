import { ConnectionResult, DNSRecord, DNSInstructions } from '../types';

interface DomainConnectionData {
    domain: string;
  }
  
  class DomainConnectionService {
  
        async connectExistingDomain(connectionData: DomainConnectionData): Promise<ConnectionResult> {
      try {
        console.log('Starting domain connection process for:', connectionData.domain);
        
        // Step 1: Generate DNS instructions for the user (default to hosting)
        const dnsInstructions = await this.generateDNSInstructions(connectionData.domain, 'hosting');
        
        // Step 2: Check current DNS status
        const currentDnsStatus = await this.checkCurrentDNSStatus(connectionData.domain);
        
        // Step 3: Determine if domain is already pointing to our servers
        const isAlreadyConnected = this.isDomainConnected(currentDnsStatus);
        
        return {
          success: true,
          domain: connectionData.domain,
          nameservers: dnsInstructions.nameservers,
          aRecords: dnsInstructions.aRecords,
          cnameRecords: dnsInstructions.cnameRecords,
          instructions: dnsInstructions.instructions,
          verificationStatus: isAlreadyConnected ? 'verified' : 'pending',
          currentDnsStatus: currentDnsStatus
        };

      } catch (error) {
        console.error('Domain connection failed:', error);
        return {
          success: false,
          domain: connectionData.domain,
          instructions: [],
          verificationStatus: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    }
  
    private async validateDomainOwnership(domain: string): Promise<boolean> {
      try {
        // Check if domain exists and is accessible
        const whoisData = await this.whmcsApi({
          action: 'DomainWhois',
          domain: domain
        });
  
        // Domain should exist (not available for registration)
        return whoisData.status !== 'available';
  
      } catch (error) {
        console.error('Domain validation error:', error);
        return false;
      }
    }
  

  
    private async generateDNSInstructions(domain: string, serviceType: string) {
      // Ruachost DNS settings
      const platformConfig = {
        nameservers: [
          'nsa.ruachost.com',
          'nsb.ruachost.com'
        ],
        ipAddress: '185.199.108.153', // Ruachost server IP (update with actual IP)
        cdnEndpoint: 'cdn.ruachost.com'
      };
  
      const instructions: string[] = [];
      let aRecords: DNSRecord[] = [];
      let cnameRecords: DNSRecord[] = [];
  
            switch (serviceType) {
        case 'hosting':
          // For web hosting - use nameservers
          instructions.push(
            '1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)',
            '2. Find the DNS or Nameserver settings',
            '3. Update nameservers to:',
            `   ${platformConfig.nameservers[0]}`,
            `   ${platformConfig.nameservers[1]}`,
            '4. Save changes and wait 24-48 hours for DNS propagation',
            '5. Your domain will be automatically configured once DNS propagates'
          );
          break;

        case 'website_builder':
          // For website builder - use A records
          aRecords = [
            { name: '@', value: platformConfig.ipAddress },
            { name: 'www', value: platformConfig.ipAddress }
          ];
          
          instructions.push(
            '1. Log in to your domain registrar',
            '2. Go to DNS settings',
            '3. Add these A records:',
            `   @ (root domain) points to ${platformConfig.ipAddress}`,
            `   www points to ${platformConfig.ipAddress}`,
            '4. Save changes and wait for propagation (up to 48 hours)',
            '5. Your website will be accessible once DNS propagates'
          );
          break;

        case 'ecommerce':
          // For e-commerce platform - use CNAME
          cnameRecords = [
            { name: 'www', value: `${domain}.ruachost.com` },
            { name: 'shop', value: `shop.ruachost.com` }
          ];
          
          aRecords = [
            { name: '@', value: platformConfig.ipAddress }
          ];

          instructions.push(
            '1. Access your domain\'s DNS settings',
            '2. Add these records:',
            `   A record: @ (root domain) points to ${platformConfig.ipAddress}`,
            `   CNAME: www points to ${domain}.ruachost.com`,
            `   CNAME: shop points to shop.ruachost.com`,
            '3. Save and wait for DNS propagation (up to 48 hours)',
            '4. Your e-commerce store will be accessible once DNS propagates'
          );
          break;
      }
  
      return {
        nameservers: platformConfig.nameservers,
        aRecords,
        cnameRecords,
        instructions
      };
    }
  
    private async setupDomainVerification(domain: string, serviceId: string) {
      // Create a verification token
      const verificationToken = this.generateVerificationToken();
  
      // Store verification data
      await this.storeVerificationData({
        domain,
        serviceId,
        token: verificationToken,
        status: 'pending',
        createdAt: new Date()
      });
  
      return verificationToken;
    }
  
        private async checkCurrentDNSStatus(domain: string) {
      try {
        console.log('Checking DNS status for:', domain);
        
        // Check nameservers
        const nameservers = await this.getNameservers(domain);
        
        // Check A records
        const aRecords = await this.getARecords(domain);
        
        // Check CNAME records
        const cnameRecords = await this.getCNAMERecords(domain);
        
        return {
          nameservers,
          aRecords,
          cnameRecords,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        console.error('DNS status check failed:', error);
        return {
          nameservers: [],
          aRecords: [],
          cnameRecords: [],
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    private isDomainConnected(dnsStatus: any): boolean {
      const ruachostNameservers = ['nsa.ruachost.com', 'nsb.ruachost.com'];
      const ruachostIP = '185.199.108.153'; // Update with actual IP
      
      // Check if nameservers are pointing to Ruachost
      const hasCorrectNameservers = ruachostNameservers.every(ns => 
        dnsStatus.nameservers.some((domainNs: string) => 
          domainNs.toLowerCase().includes(ns.toLowerCase())
        )
      );
      
      // Check if A records are pointing to Ruachost IP
      const hasCorrectARecords = dnsStatus.aRecords.some((record: any) => 
        record.value === ruachostIP
      );
      
      // Check if CNAME records are pointing to Ruachost
      const hasCorrectCNAME = dnsStatus.cnameRecords.some((record: any) => 
        record.value.includes('ruachost.com')
      );
      
      return hasCorrectNameservers || hasCorrectARecords || hasCorrectCNAME;
    }

    private async getNameservers(domain: string): Promise<string[]> {
      try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=NS`);
        const data = await response.json();
        
        if (data.Answer) {
          return data.Answer.map((record: any) => record.data);
        }
        return [];
      } catch (error) {
        console.error('Failed to get nameservers:', error);
        return [];
      }
    }

    private async getARecords(domain: string): Promise<Array<{name: string, value: string}>> {
      try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
        const data = await response.json();
        
        if (data.Answer) {
          return data.Answer.map((record: any) => ({
            name: record.name,
            value: record.data
          }));
        }
        return [];
      } catch (error) {
        console.error('Failed to get A records:', error);
        return [];
      }
    }

    private async getCNAMERecords(domain: string): Promise<Array<{name: string, value: string}>> {
      try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
        const data = await response.json();
        
        if (data.Answer) {
          return data.Answer.map((record: any) => ({
            name: record.name,
            value: record.data
          }));
        }
        return [];
      } catch (error) {
        console.error('Failed to get CNAME records:', error);
        return [];
      }
    }
  
    
  

  
    private generateVerificationToken(): string {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  
    private async storeVerificationData(data: any) {
      // Store in database for verification tracking
      // This could be in WHMCS custom fields or separate database
      console.log('Storing verification data:', data);
    }
  
        private async whmcsApi(params: any) {
      // Check if environment variables are set
      if (!process.env.WHMCS_API_URL || !process.env.WHMCS_API_IDENTIFIER || !process.env.WHMCS_API_SECRET) {
        throw new Error('WHMCS API credentials not configured. Please set WHMCS_API_URL, WHMCS_API_IDENTIFIER, and WHMCS_API_SECRET environment variables.');
      }

      const postFields = {
        identifier: process.env.WHMCS_API_IDENTIFIER,
        secret: process.env.WHMCS_API_SECRET,
        responsetype: 'json',
        ...params
      };

      console.log('WHMCS API call:', { action: params.action, domain: params.domain });

      const response = await fetch(process.env.WHMCS_API_URL, {
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
      console.log('WHMCS API response:', data);
      
      if (data.result === 'error') {
        throw new Error(data.message || 'WHMCS API error');
      }

      return data;
    }
  

  }

export default DomainConnectionService;