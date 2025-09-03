/**
 * Utility functions for domain management
 */

export interface ExpiryStatus {
  daysUntilExpiry: number;
  status: 'expired' | 'expiring' | 'active';
  color: string;
  urgency: 'critical' | 'warning' | 'normal';
}

/**
 * Calculate domain expiry status based on expiry date
 */
export function calculateExpiryStatus(expiryDate: string): ExpiryStatus {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return {
      daysUntilExpiry,
      status: 'expired',
      color: 'text-red-600',
      urgency: 'critical'
    };
  }

  if (daysUntilExpiry <= 7) {
    return {
      daysUntilExpiry,
      status: 'expiring',
      color: 'text-red-600',
      urgency: 'critical'
    };
  }

  if (daysUntilExpiry <= 30) {
    return {
      daysUntilExpiry,
      status: 'expiring',
      color: 'text-yellow-600',
      urgency: 'warning'
    };
  }

  return {
    daysUntilExpiry,
    status: 'active',
    color: 'text-green-600',
    urgency: 'normal'
  };
}

/**
 * Format domain expiry date for display
 */
export function formatExpiryDate(expiryDate: string): string {
  return new Date(expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get relative expiry text (e.g., "expires in 15 days", "expired 5 days ago")
 */
export function getRelativeExpiryText(expiryDate: string): string {
  const { daysUntilExpiry, status } = calculateExpiryStatus(expiryDate);
  
  if (status === 'expired') {
    return `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago`;
  }
  
  if (daysUntilExpiry === 0) {
    return 'Expires today';
  }
  
  if (daysUntilExpiry === 1) {
    return 'Expires tomorrow';
  }
  
  return `Expires in ${daysUntilExpiry} days`;
}

/**
 * Check if domain needs urgent attention
 */
export function needsUrgentAttention(expiryDate: string): boolean {
  const { urgency } = calculateExpiryStatus(expiryDate);
  return urgency === 'critical';
}

/**
 * Get renewal recommendation based on expiry status
 */
export function getRenewalRecommendation(expiryDate: string): string {
  const { daysUntilExpiry, status } = calculateExpiryStatus(expiryDate);
  
  if (status === 'expired') {
    return 'Domain has expired. Renew immediately to avoid losing it.';
  }
  
  if (daysUntilExpiry <= 7) {
    return 'Domain expires very soon. Renew now to avoid service interruption.';
  }
  
  if (daysUntilExpiry <= 30) {
    return 'Domain expires soon. Consider renewing to avoid last-minute issues.';
  }
  
  return 'Domain is active and healthy.';
}
