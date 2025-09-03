import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ConnectionResult } from '../../types';

interface DomainConnectionFormData {
  domain: string;
  serviceType: 'hosting' | 'website_builder' | 'ecommerce';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function DomainConnectionForm() {
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<DomainConnectionFormData>();

  const onSubmit = async (data: DomainConnectionFormData) => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/connect-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: data.domain,
          serviceType: data.serviceType,
          customer: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone
          }
        })
      });

      const result = await response.json();
      setConnectionResult(result);

      if (result.success) {
        // Start verification polling
        startVerificationPolling(data.domain);
      }

    } catch (error) {
      console.error('Domain connection failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startVerificationPolling = (domain: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/verify-domain?domain=${domain}`);
        const result = await response.json();
        
        setVerificationStatus(result.status);
        
        if (result.status === 'verified' || result.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Verification polling error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Stop polling after 1 hour
    setTimeout(() => clearInterval(pollInterval), 3600000);
  };

  if (connectionResult && connectionResult.success) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-600">Domain Connection Setup</h2>
          <p className="text-gray-600">Follow these steps to connect your domain</p>
        </div>

        {/* Verification Status */}
        <div className="mb-6 p-4 rounded-md bg-blue-50">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              verificationStatus === 'verified' ? 'bg-green-500' :
              verificationStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`}></div>
            <span className="font-medium">
              {verificationStatus === 'verified' && 'Domain Connected Successfully!'}
              {verificationStatus === 'failed' && 'Domain Connection Failed'}
              {verificationStatus === 'pending' && 'Waiting for DNS Changes...'}
            </span>
          </div>
        </div>

        {/* DNS Instructions */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">DNS Configuration Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {connectionResult.instructions.map((instruction, index) => (
                <li key={index} className="leading-relaxed">{instruction}</li>
              ))}
            </ol>
          </div>

          {/* DNS Records */}
          {connectionResult.aRecords && connectionResult.aRecords.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">A Records to Add:</h4>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                {connectionResult.aRecords.map((record, index) => (
                  <div key={index}>
                    <strong>{record.name}</strong> → {record.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {connectionResult.cnameRecords && connectionResult.cnameRecords.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">CNAME Records to Add:</h4>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                {connectionResult.cnameRecords.map((record, index) => (
                  <div key={index}>
                    <strong>{record.name}</strong> → {record.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nameservers */}
          {connectionResult.nameservers && (
            <div>
              <h4 className="font-medium mb-2">Or Update Nameservers:</h4>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                {connectionResult.nameservers.map((ns, index) => (
                  <div key={index}>{ns}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-md">
          <h4 className="font-medium text-yellow-800 mb-2">Need Help?</h4>
          <p className="text-yellow-700 text-sm">
            DNS changes can take up to 48 hours to propagate. If you need assistance,
            contact your domain registrar's support team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Connect Your Existing Domain</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Domain Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Your Domain Name</label>
          <input
            {...register('domain', { 
              required: 'Domain is required',
              pattern: {
                value: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
                message: 'Please enter a valid domain name'
              }
            })}
            type="text"
            placeholder="yourdomain.com"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.domain && (
            <p className="text-red-500 text-sm mt-1">{errors.domain.message}</p>
          )}
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium mb-1">What do you want to use it for?</label>
          <select
            {...register('serviceType', { required: 'Please select a service type' })}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select service type</option>
            <option value="hosting">Web Hosting</option>
            <option value="website_builder">Website Builder</option>
            <option value="ecommerce">E-commerce Store</option>
          </select>
          {errors.serviceType && (
            <p className="text-red-500 text-sm mt-1">{errors.serviceType.message}</p>
          )}
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              {...register('firstName', { required: 'First name is required' })}
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              {...register('lastName', { required: 'Last name is required' })}
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email'
              }
            })}
            type="email"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            {...register('phone', { required: 'Phone is required' })}
            type="tel"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Connecting Domain...' : 'Connect My Domain'}
        </button>
      </form>

      {/* Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-900 mb-2">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• You keep ownership of your domain</li>
          <li>• We provide DNS instructions to point it to our servers</li>
          <li>• Changes take 24-48 hours to take effect</li>
          <li>• No transfer fees or ownership changes</li>
        </ul>
      </div>
    </div>
  );
}