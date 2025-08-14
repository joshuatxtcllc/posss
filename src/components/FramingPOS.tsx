import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Calculator, 
  User, 
  Package, 
  CreditCard, 
  FileText, 
  Clock,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Camera,
  Palette,
  Ruler,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface Material {
  id: string;
  category: string;
  name: string;
  sku: string;
  unit_cost: number;
  unit_price: number;
  unit: string;
  specifications: any;
  current_stock: number;
}

interface OrderSpecs {
  customerId?: string;
  artworkDescription: string;
  imageWidth: number;
  imageHeight: number;
  matWidth: number;
  matHeight: number;
  frameStyle: string;
  matType: string;
  glassType: string;
  backingType: string;
  complexity: 'simple' | 'medium' | 'complex';
  priority: 'standard' | 'rush' | 'express';
  specialInstructions: string;
}

export function FramingPOS() {
  const [activeTab, setActiveTab] = useState('new-order');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  
  // Order form state
  const [orderSpecs, setOrderSpecs] = useState<OrderSpecs>({
    artworkDescription: '',
    imageWidth: 16,
    imageHeight: 20,
    matWidth: 2,
    matHeight: 2,
    frameStyle: '',
    matType: '',
    glassType: '',
    backingType: '',
    complexity: 'medium',
    priority: 'standard',
    specialInstructions: ''
  });

  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadCustomers();
    loadMaterials();
    loadOrders();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('category, name');
      
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  // Calculate pricing based on specifications
  const calculatePricing = () => {
    if (!orderSpecs.imageWidth || !orderSpecs.imageHeight) return;

    const finishedWidth = orderSpecs.imageWidth + (orderSpecs.matWidth * 2);
    const finishedHeight = orderSpecs.imageHeight + (orderSpecs.matHeight * 2);
    const finishedArea = finishedWidth * finishedHeight;
    const perimeter = (finishedWidth + finishedHeight) * 2;

    // Get material prices
    const frameMaterial = materials.find(m => m.sku === orderSpecs.frameStyle);
    const matMaterial = materials.find(m => m.sku === orderSpecs.matType);
    const glassMaterial = materials.find(m => m.sku === orderSpecs.glassType);
    const backingMaterial = materials.find(m => m.sku === orderSpecs.backingType);

    const framePrice = frameMaterial ? frameMaterial.unit_price * perimeter : 0;
    const matPrice = (matMaterial && orderSpecs.matType !== 'none') ? matMaterial.unit_price * finishedArea : 0;
    const glassPrice = glassMaterial ? glassMaterial.unit_price * finishedArea : 0;
    const backingPrice = backingMaterial ? backingMaterial.unit_price * finishedArea : 0;

    // Base labor calculation
    const baseLabor = 35.00;
    const complexityMultiplier = {
      simple: 1.0,
      medium: 1.3,
      complex: 1.7
    }[orderSpecs.complexity];

    const laborPrice = baseLabor * complexityMultiplier;

    // Rush fee calculation
    const rushFee = orderSpecs.priority === 'rush' ? (framePrice + matPrice + glassPrice + laborPrice) * 0.5 :
                   orderSpecs.priority === 'express' ? (framePrice + matPrice + glassPrice + laborPrice) * 1.0 : 0;

    const subtotal = framePrice + matPrice + glassPrice + backingPrice + laborPrice + rushFee;
    const tax = subtotal * 0.0875; // 8.75% tax
    const total = subtotal + tax;

    setPricing({
      finishedSize: { width: finishedWidth, height: finishedHeight, area: finishedArea },
      breakdown: {
        framePrice: Math.round(framePrice * 100) / 100,
        matPrice: Math.round(matPrice * 100) / 100,
        glassPrice: Math.round(glassPrice * 100) / 100,
        backingPrice: Math.round(backingPrice * 100) / 100,
        laborPrice: Math.round(laborPrice * 100) / 100,
        rushFee: Math.round(rushFee * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100
      }
    });
  };

  // Recalculate pricing when specs change
  useEffect(() => {
    calculatePricing();
  }, [orderSpecs, materials]);

  const createOrder = async () => {
    if (!selectedCustomer || !pricing) return;

    setLoading(true);
    try {
      const orderNumber = `JF-${Date.now().toString().slice(-8)}`;
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: selectedCustomer.id,
          order_number: orderNumber,
          artwork_description: orderSpecs.artworkDescription,
          image_width: orderSpecs.imageWidth,
          image_height: orderSpecs.imageHeight,
          mat_width: orderSpecs.matWidth,
          mat_height: orderSpecs.matHeight,
          frame_style: orderSpecs.frameStyle,
          mat_type: orderSpecs.matType,
          glass_type: orderSpecs.glassType,
          backing_type: orderSpecs.backingType,
          complexity: orderSpecs.complexity,
          priority: orderSpecs.priority,
          special_instructions: orderSpecs.specialInstructions,
          frame_price: pricing.breakdown.framePrice,
          mat_price: orderSpecs.matType === 'none' ? 0 : pricing.breakdown.matPrice,
          glass_price: pricing.breakdown.glassPrice,
          backing_price: pricing.breakdown.backingPrice,
          labor_price: pricing.breakdown.laborPrice,
          rush_fee: pricing.breakdown.rushFee,
          subtotal: pricing.breakdown.subtotal,
          tax: pricing.breakdown.tax,
          total: pricing.breakdown.total,
          status: 'quote'
        })
        .select()
        .single();

      if (error) throw error;

      alert(`Order created successfully! Order #${orderNumber} for ${selectedCustomer.name} - Total: $${pricing.breakdown.total}`);
      
      // Reset form
      setOrderSpecs({
        artworkDescription: '',
        imageWidth: 16,
        imageHeight: 20,
        matWidth: 2,
        matHeight: 2,
        frameStyle: '',
        matType: '',
        glassType: '',
        backingType: '',
        complexity: 'medium',
        priority: 'standard',
        specialInstructions: ''
      });
      setSelectedCustomer(null);
      setPricing(null);
      
      // Reload orders
      loadOrders();
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) throw error;
      
      setCustomers(prev => [...prev, data]);
      setSelectedCustomer(data);
      setShowNewCustomer(false);
      
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer. Please try again.');
    }
  };

  const getMaterialsByCategory = (category: string) => {
    return materials.filter(m => m.category === category);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Jay's Frames POS System</h1>
          <p className="text-gray-600">Professional Custom Framing Management</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new-order" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              New Order
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Materials
            </TabsTrigger>
          </TabsList>

          {/* New Order Tab */}
          <TabsContent value="new-order" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedCustomer ? (
                    <div className="space-y-3">
                      <Select onValueChange={(value) => {
                        if (value === 'new') {
                          setShowNewCustomer(true);
                        } else {
                          const customer = customers.find(c => c.id === value);
                          setSelectedCustomer(customer || null);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">+ Add New Customer</SelectItem>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} {customer.phone && `(${customer.phone})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {showNewCustomer && (
                        <Card className="border-blue-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">New Customer</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label>Name *</Label>
                              <Input 
                                placeholder="Customer name"
                                id="newCustomerName"
                              />
                            </div>
                            <div>
                              <Label>Phone *</Label>
                              <Input 
                                placeholder="(555) 123-4567"
                                id="newCustomerPhone"
                              />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input 
                                placeholder="customer@email.com"
                                id="newCustomerEmail"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  const name = (document.getElementById('newCustomerName') as HTMLInputElement)?.value;
                                  const phone = (document.getElementById('newCustomerPhone') as HTMLInputElement)?.value;
                                  const email = (document.getElementById('newCustomerEmail') as HTMLInputElement)?.value;
                                  
                                  if (name && phone) {
                                    createCustomer({ name, phone, email });
                                  }
                                }}
                              >
                                Create
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowNewCustomer(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium">{selectedCustomer.name}</div>
                        {selectedCustomer.phone && (
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedCustomer.phone}
                          </div>
                        )}
                        {selectedCustomer.email && (
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedCustomer.email}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        Change Customer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="w-5 h-5" />
                    Artwork Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Artwork Description *</Label>
                    <Textarea
                      placeholder="Describe the artwork to be framed..."
                      value={orderSpecs.artworkDescription}
                      onChange={(e) => setOrderSpecs(prev => ({ ...prev, artworkDescription: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Image Width (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={orderSpecs.imageWidth}
                        onChange={(e) => setOrderSpecs(prev => ({ ...prev, imageWidth: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Image Height (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={orderSpecs.imageHeight}
                        onChange={(e) => setOrderSpecs(prev => ({ ...prev, imageHeight: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Mat Width (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={orderSpecs.matWidth}
                        onChange={(e) => setOrderSpecs(prev => ({ ...prev, matWidth: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Mat Height (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={orderSpecs.matHeight}
                        onChange={(e) => setOrderSpecs(prev => ({ ...prev, matHeight: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Complexity</Label>
                    <Select value={orderSpecs.complexity} onValueChange={(value: any) => setOrderSpecs(prev => ({ ...prev, complexity: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple (1.0x labor)</SelectItem>
                        <SelectItem value="medium">Medium (1.3x labor)</SelectItem>
                        <SelectItem value="complex">Complex (1.7x labor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select value={orderSpecs.priority} onValueChange={(value: any) => setOrderSpecs(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="rush">Rush (+50% fee)</SelectItem>
                        <SelectItem value="express">Express (+100% fee)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Material Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Materials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Frame Style *</Label>
                    <Select value={orderSpecs.frameStyle} onValueChange={(value) => setOrderSpecs(prev => ({ ...prev, frameStyle: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frame..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getMaterialsByCategory('frames').map(frame => (
                          <SelectItem key={frame.id} value={frame.sku}>
                            {frame.name} - {formatCurrency(frame.unit_price)}/ft
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Mat Board</Label>
                    <Select value={orderSpecs.matType} onValueChange={(value) => setOrderSpecs(prev => ({ ...prev, matType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mat..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Mat</SelectItem>
                        {getMaterialsByCategory('mats').map(mat => (
                          <SelectItem key={mat.id} value={mat.sku}>
                            {mat.name} - {formatCurrency(mat.unit_price)}/sq ft
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Glass Type *</Label>
                    <Select value={orderSpecs.glassType} onValueChange={(value) => setOrderSpecs(prev => ({ ...prev, glassType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select glass..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getMaterialsByCategory('glass').map(glass => (
                          <SelectItem key={glass.id} value={glass.sku}>
                            {glass.name} - {formatCurrency(glass.unit_price)}/sq ft
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Backing *</Label>
                    <Select value={orderSpecs.backingType} onValueChange={(value) => setOrderSpecs(prev => ({ ...prev, backingType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select backing..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getMaterialsByCategory('backing').map(backing => (
                          <SelectItem key={backing.id} value={backing.sku}>
                            {backing.name} - {formatCurrency(backing.unit_price)}/sq ft
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Special Instructions</Label>
                    <Textarea
                      placeholder="Any special requests or notes..."
                      value={orderSpecs.specialInstructions}
                      onChange={(e) => setOrderSpecs(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Display */}
            {pricing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Pricing Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Finished Frame Size</h4>
                        <p className="text-blue-800">
                          {pricing.finishedSize.width}" × {pricing.finishedSize.height}" 
                          ({pricing.finishedSize.area.toFixed(1)} sq in)
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Frame:</span>
                          <span>{formatCurrency(pricing.breakdown.framePrice)}</span>
                        </div>
                        {pricing.breakdown.matPrice > 0 && orderSpecs.matType !== 'none' && (
                          <div className="flex justify-between">
                            <span>Mat Board:</span>
                            <span>{formatCurrency(pricing.breakdown.matPrice)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Glass:</span>
                          <span>{formatCurrency(pricing.breakdown.glassPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Backing:</span>
                          <span>{formatCurrency(pricing.breakdown.backingPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Labor:</span>
                          <span>{formatCurrency(pricing.breakdown.laborPrice)}</span>
                        </div>
                        {pricing.breakdown.rushFee > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Rush Fee:</span>
                            <span>+{formatCurrency(pricing.breakdown.rushFee)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(pricing.breakdown.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(pricing.breakdown.tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-green-600">{formatCurrency(pricing.breakdown.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button
                        onClick={createOrder}
                        disabled={!selectedCustomer || !orderSpecs.artworkDescription || !orderSpecs.frameStyle || !orderSpecs.glassType || !orderSpecs.backingType || loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? 'Creating Order...' : 'Create Order'}
                      </Button>

                      {orderSpecs.priority !== 'standard' && (
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-800">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {orderSpecs.priority === 'rush' ? 'Rush Order' : 'Express Order'}
                            </span>
                          </div>
                          <p className="text-sm text-orange-700 mt-1">
                            {orderSpecs.priority === 'rush' 
                              ? 'Rush orders include a 50% surcharge and will be completed in half the standard time.'
                              : 'Express orders include a 100% surcharge and will be completed as quickly as possible.'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No orders yet. Create your first order!</p>
                  ) : (
                    orders.map(order => (
                      <Card key={order.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{order.order_number}</span>
                                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                  {order.status}
                                </Badge>
                                {order.priority !== 'standard' && (
                                  <Badge variant="outline" className="text-orange-600">
                                    {order.priority}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{order.customer?.name}</p>
                              <p className="text-sm">{order.artwork_description}</p>
                              <p className="text-xs text-gray-500">
                                {order.image_width}" × {order.image_height}" 
                                {order.mat_width > 0 && ` (with ${order.mat_width}" mat)`}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(parseFloat(order.total))}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString()}
                              </div>
                              <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {order.payment_status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map(customer => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">{customer.name}</h4>
                          {customer.phone && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.address && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['frames', 'mats', 'glass', 'backing'].map(category => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getMaterialsByCategory(category).map(material => (
                        <div key={material.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-gray-600">{material.sku}</div>
                            <div className="text-xs text-gray-500">Stock: {material.current_stock}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(material.unit_price)}</div>
                            <div className="text-xs text-gray-500">per {material.unit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}