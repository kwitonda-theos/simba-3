import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a special admin client for migration to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function migrateData() {
  console.log('🚀 Starting admin migration for v2 dataset...');

  // 1. Read JSON file
  const filePath = path.join(__dirname, '../simba_products (2).json');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at ${filePath}`);
    return;
  }
  
  const rawData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawData);
  const products = data.products;

  console.log(`📦 Found ${products.length} products in JSON.`);

  // 2. Ensure Branches exist (just in case)
  const BRANCH_NAMES = [
    "Main Branch", "Simba Centenary", "Simba Gishushu", "Simba Kimironko",
    "Simba Kicukiro", "Simba Kigali Height", "Simba UTC", "Simba Gacuriro",
    "Simba Gikondo", "Simba sonatube", "Simba Kisimenti", "Simba Rebero"
  ];

  console.log('🏥 Checking branches...');
  const { data: existingBranches } = await supabaseAdmin.from('branches').select('*');
  const existingBranchNames = new Set(existingBranches?.map(b => b.name) || []);
  
  const branchesToInsert = BRANCH_NAMES
    .filter(name => !existingBranchNames.has(name))
    .map(name => ({ name }));

  if (branchesToInsert.length > 0) {
    const { error: branchError } = await supabaseAdmin.from('branches').insert(branchesToInsert);
    if (branchError) {
      console.error('❌ Error inserting branches:', branchError.message);
      return;
    }
  }
  
  const { data: allBranches } = await supabaseAdmin.from('branches').select('*');
  console.log(`✅ ${allBranches.length} branches ready.`);

  // 3. Migrate Products
  console.log('🛒 Migrating products...');
  
  const formattedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    subcategory_id: p.subcategoryId,
    unit: p.unit,
    image_url: p.image,
    is_active: true
  }));

  // Upsert products to update existing ones and add new ones
  const { error: productError } = await supabaseAdmin.from('products').upsert(formattedProducts, { onConflict: 'id' });

  if (productError) {
    console.error('❌ Error migrating products:', productError.message);
    return;
  }
  console.log('✅ Products migrated successfully.');

  // 4. Initialize Inventory for NEW products or ensure all products have inventory
  console.log('📦 Updating inventory...');
  
  // Get all inventory to see what's already there
  const { data: existingInventory } = await supabaseAdmin.from('inventory').select('branch_id, product_id');
  const inventorySet = new Set(existingInventory?.map(i => `${i.branch_id}-${i.product_id}`) || []);

  const inventoryItemsToInsert = [];
  for (const branch of allBranches) {
    for (const product of formattedProducts) {
      if (!inventorySet.has(`${branch.id}-${product.id}`)) {
        inventoryItemsToInsert.push({
          branch_id: branch.id,
          product_id: product.id,
          stock_quantity: Math.floor(Math.random() * 100) + 10 
        });
      }
    }
  }

  if (inventoryItemsToInsert.length > 0) {
    console.log(`📥 Inserting ${inventoryItemsToInsert.length} new inventory records...`);
    const chunkSize = 1000;
    for (let i = 0; i < inventoryItemsToInsert.length; i += chunkSize) {
      const chunk = inventoryItemsToInsert.slice(i, i + chunkSize);
      const { error: invError } = await supabaseAdmin.from('inventory').upsert(chunk, { onConflict: 'branch_id,product_id' });
      if (invError) {
        console.error(`❌ Error in inventory chunk ${i / chunkSize}:`, invError.message);
      }
    }
    console.log('✅ Inventory updated.');
  } else {
    console.log('✅ Inventory already up to date.');
  }

  console.log('🎉 Migration Complete!');
}

migrateData().catch(err => {
  console.error('💥 Critical Migration Failure:', err);
});
