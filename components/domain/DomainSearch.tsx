'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, Plus, CheckCircle, XCircle } from 'lucide-react';
import { DomainSearchResult } from '@/types';
import useCartStore from '@/store/cartStore';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNaira } from '@/lib/utils';

interface DomainSearchProps {
  onSearchComplete?: (results: DomainSearchResult[]) => void;
}

export default function DomainSearch({ onSearchComplete }: DomainSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasTLD, setHasTLD] = useState(false);
  const [baseDomainName, setBaseDomainName] = useState<string>('');
  const [challenge, setChallenge] = useState<{ a: number; b: number; challengeId: string; sig: string } | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const { addItem } = useCartStore();

  const fetchChallenge = async () => {
    try {
      const res = await fetch('/api/domains/search');
      if (res.ok) {
        const data = await res.json();
        setChallenge(data);
        setAnswer('');
      }
    } catch (err) {
      // no-op
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  const handleSearch = async (domain: string) => {
    if (!domain.trim()) return;
    if (!challenge) {
      toast.error('Challenge unavailable. Please try again.');
      await fetchChallenge();
      return;
    }
    const numericAnswer = Number(answer);
    if (!answer || Number.isNaN(numericAnswer)) {
      toast.error('Please solve the challenge question.');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Clean the domain name
      const cleanDomain = domain.toLowerCase().replace(/[^a-z0-9.-]/g, '');
      
      // Check if it's a full domain or just a name
      const domainHasTLD = cleanDomain.includes('.');
      setHasTLD(domainHasTLD);
      let domainsToCheck: string[] = [];
      let baseName = '';

      if (domainHasTLD) {
        domainsToCheck = [cleanDomain];
        // Extract base name for suggestions
        baseName = cleanDomain.split('.')[0];
        setBaseDomainName(baseName);
      } else {
        // Generate suggestions locally for popular TLDs
        const popularTlds = ['.com', '.net', '.org', '.ng', '.com.ng', '.co.uk', '.info', '.biz'];
        const tldSuggestions = popularTlds.map(tld => `${cleanDomain}${tld}`);
        domainsToCheck = tldSuggestions.slice(0, 6); // Check top 6 suggestions
        setSuggestions(tldSuggestions);
        baseName = cleanDomain;
        setBaseDomainName(baseName);
      }

      // Check availability for each domain
      const results: DomainSearchResult[] = [];
      for (const domainToCheck of domainsToCheck) {
        const searchResponse = await fetch('/api/domains/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: domainToCheck,
            answer: numericAnswer,
            challengeId: challenge.challengeId,
            sig: challenge.sig,
          }),
        });
        if (searchResponse.ok) {
          const result = await searchResponse.json();
          results.push(result);
        }
      }

      setSearchResults(results);
      onSearchComplete?.(results);
      // rotate challenge after a search
      await fetchChallenge();
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCart = (result: DomainSearchResult) => {
    if (!result.available) {
      toast.error('This domain is not available');
      return;
    }

    const domain = {
      id: result.domain,
      name: result.domain.split('.')[0],
      tld: '.' + result.domain.split('.').slice(1).join('.'),
      fullName: result.domain,
      isAvailable: result.available,
      price: result.price,
      currency: result.currency,
      registrationPeriod: result.registrationPeriod,
      renewalPrice: result.renewalPrice,
    };

    addItem(domain);
    toast.success(`${result.domain} added to cart!`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
  };

  const generateAlternativeSuggestions = () => {
    if (!baseDomainName) return [];
    
    const allTlds = ['.com', '.net', '.org', '.ng', '.com.ng', '.co.uk', '.info', '.biz', '.io', '.co', '.me', '.tv', '.cc', '.online', '.store', '.tech'];
    const searchedDomains = searchResults.map(result => result.domain);
    
    // Generate suggestions that haven't been searched yet
    const alternativeSuggestions = allTlds
      .map(tld => `${baseDomainName}${tld}`)
      .filter(domain => !searchedDomains.includes(domain))
      .slice(0, 12); // Show up to 12 alternative suggestions
    
    return alternativeSuggestions;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Search</CardTitle>
          <CardDescription>
            Enter a domain name to check availability and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                placeholder="Enter domain name (e.g., example.com or just example)"
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-44">
              <Input
                type="text"
                inputMode="numeric"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                placeholder={challenge ? `What is ${challenge.a} + ${challenge.b}?` : 'Loading...'}
              />
            </div>
            <Button
              onClick={() => handleSearch(searchTerm)}
              disabled={isSearching || !searchTerm.trim()}
              className="px-6 w-full sm:w-auto bg-black hover:bg-gray-800 text-white"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && !hasTLD && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular TLDs for "{searchTerm}"</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 8).map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rounded-full text-xs sm:text-sm"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div
                  key={result.domain}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex items-center gap-3">
                    {result.available ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{result.domain}</div>
                      <Badge variant={result.available ? "default" : "destructive"}>
                        {result.available ? 'Available' : 'Not Available'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {result.available && (
                      <div className="text-left sm:text-right">
                        <div className="font-semibold">
                          {formatNaira(result.price)}
                        </div>
                        <div className="text-sm text-muted-foreground">per year</div>
                      </div>
                    )}
                    
                    {result.available && (
                      <Button
                        onClick={() => handleAddToCart(result)}
                        className="flex items-center gap-2 w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative Suggestions */}
      {searchResults.length > 0 && generateAlternativeSuggestions().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">More Options for "{baseDomainName}"</CardTitle>
            <CardDescription>
              Try these alternative TLDs for your domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {generateAlternativeSuggestions().map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rounded-full text-xs sm:text-sm"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !isSearching && searchTerm && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No domains found. Try a different search term.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

