export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price?: number;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SrWi4G2WPTT7qM',
    priceId: 'price_1RvnfXLuhYFyRBQAbY5yLkI6',
    name: 'Framing',
    description: 'Professional custom framing service',
    mode: 'payment',
    price: 1600.00
  },
  {
    id: 'prod_Spb6nbBv6QxnEO',
    priceId: 'price_1RtvuhLuhYFyRBQA6ehh0AxQ',
    name: 'Framing',
    description: 'Standard framing service',
    mode: 'payment',
    price: 80.00
  },
  {
    id: 'prod_SpFLdQAcTtKHWs',
    priceId: 'price_1RtaqcLuhYFyRBQAYbO2Hymn',
    name: 'Custom Frame',
    description: 'Custom frame design and creation',
    mode: 'payment',
    price: 75.00
  },
  {
    id: 'prod_SmxcA2QgS2Oogt',
    priceId: 'price_1RrNhGLuhYFyRBQAkrRAHWZB',
    name: '3 Large canvases',
    description: 'This is a half down payment on the stretching and framing of three large canvases.',
    mode: 'payment',
    price: 1974.56
  },
  {
    id: 'prod_SkU5leb6841DPI',
    priceId: 'price_1Roz7ULuhYFyRBQA5CbMxs1Y',
    name: 'Custom framing half deposit',
    description: 'Half deposit for custom framing project',
    mode: 'payment',
    price: 248.78
  },
  {
    id: 'prod_SZ2cC3ZdrdYo94',
    priceId: 'price_1RduXFLuhYFyRBQAclXql6FA',
    name: '1/2 hour labor',
    description: 'Half hour of professional labor service',
    mode: 'payment',
    price: 20.00
  },
  {
    id: 'prod_SYiiRwmBgkEF5f',
    priceId: 'price_1RdbHDLuhYFyRBQALwvQxVtC',
    name: '1 hour Labor',
    description: 'One hour of professional labor service',
    mode: 'payment',
    price: 40.00
  },
  {
    id: 'prod_SWwHWDFFsNmyAG',
    priceId: 'price_1RbsP1LuhYFyRBQA2neykLzE',
    name: 'Custom Frames For Disney Cells, Tiger Woods, Picasso',
    description: 'Specialized custom framing for collectible artwork',
    mode: 'payment',
    price: 1459.85
  },
  {
    id: 'prod_SWwDPEaOBG1Fu2',
    priceId: 'price_1RbsL1LuhYFyRBQAH3kbUu7M',
    name: '7 custom 30X30" frames',
    description: 'Seven custom 30x30 inch frames',
    mode: 'payment',
    price: 1628.36
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function getProductById(productId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === productId);
}