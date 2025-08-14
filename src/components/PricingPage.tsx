import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStripe } from '../hooks/useStripe';
import { stripeProducts } from '../stripe-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Check, Star, Zap } from 'lucide-react';

export function PricingPage() {
  const { user } = useAuth();
  const { createCheckoutSession, loading: stripeLoading, getSubscription } = useStripe();
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const sub = await getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handlePurchase = async (priceId: string, mode: 'payment' | 'subscription' = 'payment') => {
    if (!user) {
      setError('Please sign in to make a purchase');
      return;
    }

    try {
      setError('');
      await createCheckoutSession(priceId, mode);
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout process');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getProductCategory = (name: string) => {
    if (name.toLowerCase().includes('labor')) return 'labor';
    if (name.toLowerCase().includes('canvas')) return 'canvas';
    if (name.toLowerCase().includes('deposit')) return 'deposit';
    return 'framing';
  };

  const groupedProducts = stripeProducts.reduce((acc, product) => {
    const category = getProductCategory(product.name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof stripeProducts>);

  const categoryTitles = {
    framing: 'Custom Framing Services',
    labor: 'Labor Services',
    canvas: 'Canvas Services',
    deposit: 'Deposit Payments'
  };

  const categoryDescriptions = {
    framing: 'Professional custom framing for your artwork and memorabilia',
    labor: 'Hourly labor services for custom projects',
    canvas: 'Canvas stretching and framing services',
    deposit: 'Partial payments for larger projects'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view our pricing and make purchases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <a href="/login">Sign In</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/signup">Create Account</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Jay's Frames Services
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional custom framing services for your precious artwork and memories
          </p>
          
          {loadingSubscription ? (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading account information...</span>
            </div>
          ) : subscription?.subscription_status === 'active' && (
            <div className="mt-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                Active Subscription
              </Badge>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-12">
          {Object.entries(groupedProducts).map(([category, products]) => (
            <div key={category} className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {categoryTitles[category as keyof typeof categoryTitles]}
                </h2>
                <p className="text-gray-600">
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`relative transition-all duration-200 hover:shadow-lg ${
                      product.price && product.price > 1000 ? 'border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' : ''
                    }`}
                  >
                    {product.price && product.price > 1000 && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-yellow-500 text-yellow-900">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">{product.name}</span>
                        {category === 'labor' && (
                          <Zap className="w-5 h-5 text-blue-500" />
                        )}
                      </CardTitle>
                      {product.description && (
                        <CardDescription className="text-sm">
                          {product.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {product.price ? formatPrice(product.price) : 'Custom Quote'}
                        </div>
                        <div className="text-sm text-gray-500">
                          One-time payment
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handlePurchase(product.priceId, product.mode)}
                        disabled={stripeLoading}
                        className="w-full"
                        size="lg"
                      >
                        {stripeLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {product.price ? `Purchase for ${formatPrice(product.price)}` : 'Get Quote'}
                          </>
                        )}
                      </Button>
                      
                      {category === 'deposit' && (
                        <p className="text-xs text-center text-gray-500">
                          Remaining balance due upon completion
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Need a Custom Quote?</h3>
              <p className="text-blue-100 mb-6">
                Have a unique project or need personalized assistance? Our team is here to help 
                create the perfect framing solution for your specific needs.
              </p>
              <Button variant="secondary" size="lg">
                Contact Us for Custom Quote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}