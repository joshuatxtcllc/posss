/**
 * Industry-Standard Frame Pricing Logic
 * Implements sliding scale pricing based on size, materials, and complexity
 */

export interface PricingTier {
  minSize: number; // square inches
  maxSize: number;
  basePrice: number;
  laborMultiplier: number;
}

export interface MaterialPricing {
  frames: Record<string, number>; // per linear inch
  mats: Record<string, number>; // per square inch
  glass: Record<string, number>; // per square inch
  backing: Record<string, number>; // per square inch
}

export interface OrderSpecs {
  imageWidth: number;
  imageHeight: number;
  matWidth?: number; // additional width for matting
  matHeight?: number; // additional height for matting
  frameStyle: string;
  matType?: string;
  glassType: string;
  backingType: string;
  complexity: 'simple' | 'medium' | 'complex';
  rush?: boolean;
}

// Industry-standard pricing tiers based on finished size
export const PRICING_TIERS: PricingTier[] = [
  { minSize: 0, maxSize: 64, basePrice: 45, laborMultiplier: 1.0 }, // 8x8 and smaller
  { minSize: 65, maxSize: 144, basePrice: 65, laborMultiplier: 1.2 }, // up to 12x12
  { minSize: 145, maxSize: 320, basePrice: 85, laborMultiplier: 1.4 }, // up to 16x20
  { minSize: 321, maxSize: 576, basePrice: 125, laborMultiplier: 1.6 }, // up to 24x24
  { minSize: 577, maxSize: 1024, basePrice: 185, laborMultiplier: 1.8 }, // up to 32x32
  { minSize: 1025, maxSize: 1600, basePrice: 265, laborMultiplier: 2.0 }, // up to 40x40
  { minSize: 1601, maxSize: Infinity, basePrice: 350, laborMultiplier: 2.5 } // larger
];

export const MATERIAL_PRICING: MaterialPricing = {
  frames: {
    'basic-wood': 2.50,
    'premium-wood': 4.50,
    'metal-standard': 3.25,
    'metal-premium': 5.75,
    'ornate-gold': 8.50,
    'contemporary': 6.25
  },
  mats: {
    'standard': 0.15,
    'conservation': 0.25,
    'fabric': 0.35,
    'specialty': 0.45
  },
  glass: {
    'regular': 0.08,
    'uv-protection': 0.18,
    'museum': 0.35,
    'anti-glare': 0.22
  },
  backing: {
    'standard': 0.05,
    'archival': 0.12,
    'foam-core': 0.08
  }
};

export function calculateFramingPrice(specs: OrderSpecs): {
  breakdown: {
    basePrice: number;
    framePrice: number;
    matPrice: number;
    glassPrice: number;
    backingPrice: number;
    laborPrice: number;
    rushFee: number;
    subtotal: number;
    tax: number;
    total: number;
  };
  finishedSize: { width: number; height: number; area: number };
} {
  // Calculate finished dimensions
  const finishedWidth = specs.imageWidth + (specs.matWidth || 0) * 2;
  const finishedHeight = specs.imageHeight + (specs.matHeight || 0) * 2;
  const finishedArea = finishedWidth * finishedHeight;
  const perimeter = (finishedWidth + finishedHeight) * 2;

  // Find appropriate pricing tier
  const tier = PRICING_TIERS.find(t => finishedArea >= t.minSize && finishedArea <= t.maxSize) 
    || PRICING_TIERS[PRICING_TIERS.length - 1];

  // Calculate component prices
  const basePrice = tier.basePrice;
  
  const framePrice = (MATERIAL_PRICING.frames[specs.frameStyle] || 3.0) * perimeter;
  
  const matPrice = specs.matType 
    ? (MATERIAL_PRICING.mats[specs.matType] || 0.15) * finishedArea
    : 0;
    
  const glassPrice = (MATERIAL_PRICING.glass[specs.glassType] || 0.08) * finishedArea;
  const backingPrice = (MATERIAL_PRICING.backing[specs.backingType] || 0.05) * finishedArea;

  // Labor calculation based on complexity and tier
  const complexityMultiplier = {
    simple: 1.0,
    medium: 1.3,
    complex: 1.7
  }[specs.complexity];

  const laborPrice = basePrice * tier.laborMultiplier * complexityMultiplier;

  // Rush fee (50% surcharge)
  const rushFee = specs.rush ? (framePrice + matPrice + glassPrice + laborPrice) * 0.5 : 0;

  const subtotal = basePrice + framePrice + matPrice + glassPrice + backingPrice + laborPrice + rushFee;
  const tax = subtotal * 0.0875; // 8.75% tax rate (adjust as needed)
  const total = subtotal + tax;

  return {
    breakdown: {
      basePrice,
      framePrice: Math.round(framePrice * 100) / 100,
      matPrice: Math.round(matPrice * 100) / 100,
      glassPrice: Math.round(glassPrice * 100) / 100,
      backingPrice: Math.round(backingPrice * 100) / 100,
      laborPrice: Math.round(laborPrice * 100) / 100,
      rushFee: Math.round(rushFee * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    },
    finishedSize: {
      width: finishedWidth,
      height: finishedHeight,
      area: finishedArea
    }
  };
}

export function calculateEstimatedCompletion(
  currentWorkload: number,
  orderComplexity: 'simple' | 'medium' | 'complex',
  priority: 'standard' | 'rush' | 'express'
): Date {
  const baseProcessingDays = {
    simple: 3,
    medium: 5,
    complex: 8
  }[orderComplexity];

  const priorityAdjustment = {
    standard: 1.0,
    rush: 0.5,
    express: 0.25
  }[priority];

  // Account for current workload (max 20 orders per week)
  const workloadDelay = Math.max(0, (currentWorkload - 15) * 0.5);
  
  const totalDays = Math.ceil((baseProcessingDays + workloadDelay) * priorityAdjustment);
  
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + totalDays);
  
  // Skip weekends
  while (completionDate.getDay() === 0 || completionDate.getDay() === 6) {
    completionDate.setDate(completionDate.getDate() + 1);
  }
  
  return completionDate;
}