import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

interface DomainStatusBadgeProps {
  status: 'active' | 'expired' | 'suspended' | 'pending';
  className?: string;
}

export function DomainStatusBadge({ status, className }: DomainStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          label: 'Active'
        };
      case 'expired':
        return {
          icon: <XCircle className="h-3 w-3" />,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          label: 'Expired'
        };
      case 'suspended':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          label: 'Suspended'
        };
      case 'pending':
        return {
          icon: <Clock className="h-3 w-3" />,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          label: 'Pending'
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge className={`${config.className} ${className || ''}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </Badge>
  );
}
