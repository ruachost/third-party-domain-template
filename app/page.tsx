'use client';

import { useState } from 'react';
import { ShoppingCart, Globe, Shield, Zap, Link as LinkIcon, Settings } from 'lucide-react';
import DomainSearch from '@/components/domain/DomainSearch';
import ShoppingCartComponent from '@/components/cart/ShoppingCart';
import { DomainConnectionForm } from '@/components/domainConnection/domainConnection';
import useCartStore from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalItems } = useCartStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold hidden sm:block">Ruachost DomainHub</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Link href="/domains">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Domains
                </Button>
              </Link>
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-primary-foreground/10">
              <TabsTrigger value="search" className="text-primary-foreground data-[state=active]:bg-primary-foreground/20">
                <Globe className="h-4 w-4 mr-2" />
                Search Domains
              </TabsTrigger>
              <TabsTrigger value="connect" className="text-primary-foreground data-[state=active]:bg-primary-foreground/20">
                <LinkIcon className="h-4 w-4 mr-2" />
                Connect Domain
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-0 md:px-24">
              <h1 className="text-4xl lg:text-5xl font-semibold lg:font-bold mb-6">
                Find Your Perfect Domain
              </h1>
              <p className="text-lg md:text-2xl mb-8 text-primary-foreground/90">
                Search, compare, and purchase domains with ease. Integrated with WHMCS and secure Paystack payments.
              </p>
              <div className="max-w-3xl mx-auto">
                <DomainSearch />
              </div>
            </TabsContent>

            <TabsContent value="connect" className="mt-0 md:px-24">
              <h1 className="text-4xl lg:text-5xl font-semibold lg:font-bold mb-6">
                Connect Your Existing Domain
              </h1>
              <p className="text-lg md:text-2xl mb-8 text-primary-foreground/90">
                Connect your existing domain to our hosting services. Keep ownership while getting professional hosting.
              </p>
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <DomainConnectionForm />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <Card className="bg-primary-foreground/10 border-primary-foreground/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Zap className="h-12 w-12 mb-4 text-primary-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Instant Search</h3>
                  <p className="text-primary-foreground/80">Check domain availability in real-time</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary-foreground/10 border-primary-foreground/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <LinkIcon className="h-12 w-12 mb-4 text-primary-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Domain Connection</h3>
                  <p className="text-primary-foreground/80">Connect your existing domain to our services</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary-foreground/10 border-primary-foreground/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Shield className="h-12 w-12 mb-4 text-primary-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
                  <p className="text-primary-foreground/80">Protected by Paystack payment processing</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary-foreground/10 border-primary-foreground/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Globe className="h-12 w-12 mb-4 text-primary-foreground" />
                  <h3 className="text-lg font-semibold mb-2">WHMCS Integration</h3>
                  <p className="text-primary-foreground/80">Seamless domain provisioning and management</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      

      {/* Popular TLDs Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Popular Domain Extensions
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose from our most popular TLDs
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['.com', '.net', '.org', '.ng', '.com.ng', '.co.uk'].map((tld) => (
              <Card key={tld} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{tld}</div>
                  <div className="text-sm text-muted-foreground">Starting from $12.99</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Ruachost DomainHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Shopping Cart */}
      <ShoppingCartComponent isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
