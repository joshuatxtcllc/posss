import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const materialsToSeed = [
  // Frame styles
  { category: 'frames', name: 'Classic Oak Frame', sku: 'FRAME-OAK-001', unit_cost: 15.00, unit_price: 28.50, unit: 'linear_foot', specifications: { "width": "1.5", "profile": "traditional", "finish": "natural" } },
  { category: 'frames', name: 'Modern Metal Frame', sku: 'FRAME-MTL-001', unit_cost: 18.00, unit_price: 35.00, unit: 'linear_foot', specifications: { "width": "1.0", "profile": "contemporary", "finish": "matte_black" } },
  { category: 'frames', name: 'Premium Gold Frame', sku: 'FRAME-GLD-001', unit_cost: 25.00, unit_price: 45.00, unit: 'linear_foot', specifications: { "width": "2.0", "profile": "ornate", "finish": "antique_gold" } },
  { category: 'frames', name: 'Rustic Pine Frame', sku: 'FRAME-PIN-001', unit_cost: 12.00, unit_price: 32.00, unit: 'linear_foot', specifications: { "width": "1.75", "profile": "rustic", "finish": "distressed" } },
  { category: 'frames', name: 'Elegant Silver Frame', sku: 'FRAME-SLV-001', unit_cost: 20.00, unit_price: 38.00, unit: 'linear_foot', specifications: { "width": "1.25", "profile": "elegant", "finish": "brushed_silver" } },

  // Mat boards
  { category: 'mats', name: 'White Core Mat', sku: 'MAT-WHT-001', unit_cost: 8.00, unit_price: 15.00, unit: 'square_foot', specifications: { "color": "white", "core": "white", "thickness": "4_ply" } },
  { category: 'mats', name: 'Cream Core Mat', sku: 'MAT-CRM-001', unit_cost: 8.00, unit_price: 15.00, unit: 'square_foot', specifications: { "color": "cream", "core": "cream", "thickness": "4_ply" } },
  { category: 'mats', name: 'Black Core Mat', sku: 'MAT-BLK-001', unit_cost: 10.00, unit_price: 18.00, unit: 'square_foot', specifications: { "color": "black", "core": "black", "thickness": "4_ply" } },
  { category: 'mats', name: 'Double Mat Special', sku: 'MAT-DBL-001', unit_cost: 15.00, unit_price: 25.00, unit: 'square_foot', specifications: { "type": "double", "colors": "custom", "thickness": "8_ply" } },
  { category: 'mats', name: 'Conservation Mat', sku: 'MAT-CON-001', unit_cost: 12.00, unit_price: 22.00, unit: 'square_foot', specifications: { "type": "conservation", "acid_free": true, "lignin_free": true } },

  // Glass types
  { category: 'glass', name: 'Regular Glass', sku: 'GLS-REG-001', unit_cost: 6.00, unit_price: 12.00, unit: 'square_foot', specifications: { "type": "regular", "thickness": "2mm", "uv_protection": false } },
  { category: 'glass', name: 'UV Protection Glass', sku: 'GLS-UV-001', unit_cost: 12.00, unit_price: 25.00, unit: 'square_foot', specifications: { "type": "uv_protection", "thickness": "2mm", "uv_protection": true } },
  { category: 'glass', name: 'Museum Quality Glass', sku: 'GLS-MUS-001', unit_cost: 25.00, unit_price: 45.00, unit: 'square_foot', specifications: { "type": "museum", "thickness": "2mm", "uv_protection": true, "anti_reflective": true } },
  { category: 'glass', name: 'Anti-Glare Glass', sku: 'GLS-AG-001', unit_cost: 15.00, unit_price: 30.00, unit: 'square_foot', specifications: { "type": "anti_glare", "thickness": "2mm", "uv_protection": false } },

  // Backing materials
  { category: 'backing', name: 'Standard Backing', sku: 'BCK-STD-001', unit_cost: 3.00, unit_price: 8.00, unit: 'square_foot', specifications: { "type": "standard", "material": "corrugated" } },
  { category: 'backing', name: 'Archival Backing', sku: 'BCK-ARC-001', unit_cost: 6.00, unit_price: 12.00, unit: 'square_foot', specifications: { "type": "archival", "material": "acid_free", "ph_neutral": true } },
  { category: 'backing', name: 'Foam Core Backing', sku: 'BCK-FCR-001', unit_cost: 4.00, unit_price: 10.00, unit: 'square_foot', specifications: { "type": "foam_core", "thickness": "3/16", "acid_free": true } }
];

async function seedMaterials() {
  console.log('Attempting to seed materials into Supabase...');
  try {
    const { data, error } = await supabase
      .from('materials')
      .upsert(materialsToSeed, { onConflict: 'sku', ignoreDuplicates: false });

    if (error) {
      console.error('Error seeding materials:', error);
    } else {
      console.log(`Successfully seeded ${materialsToSeed.length} materials.`);
    }
  } catch (e) {
    console.error('An unexpected error occurred during seeding:', e);
  }
}

seedMaterials();