'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, 
  Calendar, 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  Server,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ManagedDomain, DomainStatus } from '@/types';
import toast from 'react-hot-toast';

export default function DomainManagementPage() {
  const [domains, setDomains] = useState<ManagedDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<ManagedDomain | null>(null);
  const [editingNameservers, setEditingNameservers] = useState(false);
  const [newNameservers, setNewNameservers] = useState<string[]>(['', '', '', '']);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [renewalPeriod, setRenewalPeriod] = useState(1);

  // Mock client ID - in real app, this would come from authentication
  const clientId = '527';

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/domains?clientId=${clientId}`);
      const data = await response.json();
      
      if (data.success) {
        setDomains(data.data);
      } else {
        toast.error('Failed to load domains');
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewDomain = async () => {
    if (!selectedDomain) return;

    try {
      const response = await fetch('/api/domains/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: selectedDomain.id,
          period: renewalPeriod
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Domain renewal order created successfully');
        setRenewalDialogOpen(false);
        loadDomains(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to renew domain');
      }
    } catch (error) {
      console.error('Error renewing domain:', error);
      toast.error('Failed to renew domain');
    }
  };



  const handleUpdateNameservers = async () => {
    if (!selectedDomain) return;

    try {
      const response = await fetch('/api/domains', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateNameservers',
          domainId: selectedDomain.id,
          nameservers: newNameservers.filter(ns => ns.trim())
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Nameservers updated successfully');
        setEditingNameservers(false);
        loadDomains(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to update nameservers');
      }
    } catch (error) {
      console.error('Error updating nameservers:', error);
      toast.error('Failed to update nameservers');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { status: 'expired', color: 'text-red-600' };
    if (days <= 30) return { status: 'expiring', color: 'text-yellow-600' };
    return { status: 'active', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading domains...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">Domain Management</h1>
            </div>
            <Button onClick={loadDomains} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {domains.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No domains found</h3>
                <p className="text-muted-foreground">
                  You don't have any domains registered yet.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Globe className="h-8 w-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Domains</p>
                      <p className="text-2xl font-bold">{domains.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold">
                        {domains.filter(d => d.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                      <p className="text-2xl font-bold">
                        {domains.filter(d => {
                          const days = getDaysUntilExpiry(d.expiryDate);
                          return days > 0 && days <= 30;
                        }).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Expired</p>
                      <p className="text-2xl font-bold">
                        {domains.filter(d => d.status === 'expired').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Domains List */}
            <div className="grid gap-4">
              {domains.map((domain) => {
                const daysUntilExpiry = getDaysUntilExpiry(domain.expiryDate);
                const expiryStatus = getExpiryStatus(daysUntilExpiry);
                
                return (
                  <Card key={domain.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{domain.domain}</h3>
                            <Badge className={getStatusColor(domain.status)}>
                              {getStatusIcon(domain.status)}
                              <span className="ml-1 capitalize">{domain.status}</span>
                            </Badge>

                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Expires: {new Date(domain.expiryDate).toLocaleDateString()}</span>
                              <span className={expiryStatus.color}>
                                ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'})
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>Renewal: {domain.currency} {domain.renewalPrice}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4" />
                              <span>Registrar: {domain.registrar}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDomain(domain);
                              setRenewalDialogOpen(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Renew
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDomain(domain);
                              setNewNameservers([...domain.nameservers, '', '', '']);
                              setEditingNameservers(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Renewal Dialog */}
      <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Domain</DialogTitle>
            <DialogDescription>
              Renew {selectedDomain?.domain} for additional time
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Renewal Period</label>
              <Select value={renewalPeriod.toString()} onValueChange={(value) => setRenewalPeriod(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="10">10 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            

            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRenewalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenewDomain}>
                Renew Domain
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nameserver Management Dialog */}
      <Dialog open={editingNameservers} onOpenChange={setEditingNameservers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Nameservers</DialogTitle>
            <DialogDescription>
              Update nameservers for {selectedDomain?.domain}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {newNameservers.map((ns, index) => (
              <div key={index}>
                <label className="text-sm font-medium">Nameserver {index + 1}</label>
                <Input
                  value={ns}
                  onChange={(e) => {
                    const updated = [...newNameservers];
                    updated[index] = e.target.value;
                    setNewNameservers(updated);
                  }}
                  placeholder={`ns${index + 1}.example.com`}
                />
              </div>
            ))}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingNameservers(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNameservers}>
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
