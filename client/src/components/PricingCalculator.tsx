/**
 * Interactive Pricing Calculator Component
 * Provides real-time pricing calculations with material selection
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Calculator, Info, Zap } from 'lucide-react';
import { calculateFramingPrice, MATERIAL_PRICING } from '../../shared/pricing';

interface PricingCalculatorProps {
  onPriceCalculated?: (pricing: any) => void;
  initialSpecs?: Partial<OrderSpecs>;
}

interface OrderSpecs {
  imageWidth: number;
  imageHeight: number;
  matWidth: number;
  matHeight: number;
  frameStyle: string;
  matType: string;
  glassType: string;
  backingType: string;
  complexity: 'simple' | 'medium' | 'complex';
  rush: boolean;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  onPriceCalculated,
  initialSpecs
}) => {
  const [specs, setSpecs] = useState<OrderSpecs>({
    imageWidth: 16,
    imageHeight: 20,
    matWidth: 2,
    matHeight: 2,
    frameStyle: 'contemporary',
    matType: 'conservation',
    glassType: 'uv-protection',
    backingType: 'archival',
    complexity: 'medium',
    rush: false,
    ...initialSpecs
  });

  const [pricing, setPricing] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculate pricing whenever specs change
  useEffect(() => {
    if (specs.imageWidth > 0 && specs.imageHeight > 0) {
      const calculatedPricing = calculateFramingPrice(specs);
      setPricing(calculatedPricing);
      onPriceCalculated?.(calculatedPricing);
    }
  }, [specs, onPriceCalculated]);

  const updateSpec = (key: keyof OrderSpecs, value: any) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  };

  const frameOptions = Object.keys(MATERIAL_PRICING.frames).map(key => ({
    value: key,
    label: key.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    price: MATERIAL_PRICING.frames[key]
  }));

  const matOptions = Object.keys(MATERIAL_PRICING.mats).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    price: MATERIAL_PRICING.mats[key]
  }));

  const glassOptions = Object.keys(MATERIAL_PRICING.glass).map(key => ({
    value: key,
    label: key.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    price: MATERIAL_PRICING.glass[key]
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Framing Price Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Artwork Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imageWidth">Image Width (inches)</Label>
              <Input
                id="imageWidth"
                type="number"
                step="0.25"
                value={specs.imageWidth}
                onChange={(e) => updateSpec('imageWidth', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="imageHeight">Image Height (inches)</Label>
              <Input
                id="imageHeight"
                type="number"
                step="0.25"
                value={specs.imageHeight}
                onChange={(e) => updateSpec('imageHeight', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Mat Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="matWidth">Mat Width (inches)</Label>
              <Input
                id="matWidth"
                type="number"
                step="0.25"
                value={specs.matWidth}
                onChange={(e) => updateSpec('matWidth', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="matHeight">Mat Height (inches)</Label>
              <Input
                id="matHeight"
                type="number"
                step="0.25"
                value={specs.matHeight}
                onChange={(e) => updateSpec('matHeight', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Frame Selection */}
          <div>
            <Label>Frame Style</Label>
            <Select value={specs.frameStyle} onValueChange={(value) => updateSpec('frameStyle', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frameOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex justify-between items-center w-full">
                      <span>{option.label}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ${option.price}/linear inch
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mat Selection */}
          <div>
            <Label>Mat Board Type</Label>
            <Select value={specs.matType} onValueChange={(value) => updateSpec('matType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Mat</SelectItem>
                {matOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex justify-between items-center w-full">
                      <span>{option.label}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ${option.price}/sq inch
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Glass Selection */}
          <div>
            <Label>Glass Type</Label>
            <Select value={specs.glassType} onValueChange={(value) => updateSpec('glassType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {glassOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex justify-between items-center w-full">
                      <span>{option.label}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ${option.price}/sq inch
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Complexity and Rush Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Complexity</Label>
              <Select value={specs.complexity} onValueChange={(value: any) => updateSpec('complexity', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (1.0x)</SelectItem>
                  <SelectItem value="medium">Medium (1.3x)</SelectItem>
                  <SelectItem value="complex">Complex (1.7x)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="rush"
                checked={specs.rush}
                onChange={(e) => updateSpec('rush', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="rush" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Rush Order (+50%)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Display */}
      {pricing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pricing Estimate</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                <Info className="w-4 h-4 mr-2" />
                {showBreakdown ? 'Hide' : 'Show'} Breakdown
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Finished Size Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Finished Frame Size</h4>
                <p className="text-blue-800">
                  {pricing.finishedSize.width}" × {pricing.finishedSize.height}" 
                  ({pricing.finishedSize.area.toFixed(0)} square inches)
                </p>
              </div>

              {/* Price Breakdown */}
              {showBreakdown && (
                <div className="space-y-2">
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Base Price:</span>
                    <span className="text-right">${pricing.breakdown.basePrice}</span>
                    
                    <span>Frame:</span>
                    <span className="text-right">${pricing.breakdown.framePrice}</span>
                    
                    {pricing.breakdown.matPrice > 0 && (
                      <>
                        <span>Mat Board:</span>
                        <span className="text-right">${pricing.breakdown.matPrice}</span>
                      </>
                    )}
                    
                    <span>Glass:</span>
                    <span className="text-right">${pricing.breakdown.glassPrice}</span>
                    
                    <span>Backing:</span>
                    <span className="text-right">${pricing.breakdown.backingPrice}</span>
                    
                    <span>Labor:</span>
                    <span className="text-right">${pricing.breakdown.laborPrice}</span>
                    
                    {pricing.breakdown.rushFee > 0 && (
                      <>
                        <span className="text-orange-600">Rush Fee:</span>
                        <span className="text-right text-orange-600">
                          +${pricing.breakdown.rushFee}
                        </span>
                      </>
                    )}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Subtotal:</span>
                    <span className="text-right">${pricing.breakdown.subtotal}</span>
                    
                    <span>Tax:</span>
                    <span className="text-right">${pricing.breakdown.tax}</span>
                  </div>
                </div>
              )}

              <Separator />
              
              {/* Total Price */}
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Total:</span>
                <span className="text-green-600">${pricing.breakdown.total}</span>
              </div>

              {/* Rush Warning */}
              {specs.rush && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Rush Order</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Rush orders include a 50% surcharge and will be prioritized in production.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};