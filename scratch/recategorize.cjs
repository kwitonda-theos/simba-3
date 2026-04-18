const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/simba_products.json'));

const keywords = {
  'Alcoholic Drinks': ['cognac', 'wine', 'whisky', 'beer', 'vodka', 'gin', 'rum', 'liqueur', 'champagne', 'cabernet', 'sauvignon', 'bordeaux', 'merlot', 'shiraz', 'syrah', 'chardonnay', 'prosecco', 'tequila', 'cider', 'stout', 'ale'],
  'Food Products': ['rice', 'burger', 'sausage', 'beef', 'chicken', 'pork', 'fish', 'meat', 'cheese', 'milk', 'butter', 'bread', 'sugar', 'salt', 'flour', 'pasta', 'spaghetti', 'macaroni', 'noodles', 'oil', 'vinegar', 'sauce', 'ketchup', 'mayo', 'mustard', 'honey', 'jam', 'chocolate', 'candy', 'biscuit', 'cookie', 'chips', 'snack', 'water', 'juice', 'soda', 'coke', 'pepsi', 'fanta', 'sprite', 'coffee', 'tea', 'milk', 'yogurt', 'ice cream', 'vegetable', 'fruit', 'apple', 'banana', 'orange', 'potato', 'tomato', 'onion', 'garlic', 'ginger', 'pepper', 'spice', 'herb', 'nut', 'seed', 'bean', 'lentil', 'pea', 'corn', 'oat', 'cereal', 'soup', 'broth', 'stock', 'canned', 'frozen', 'fresh', 'dried', 'baked', 'roasted', 'fried', 'grilled', 'smoked', 'boiled', 'steamed', 'raw', 'organic', 'vegan', 'gluten-free', 'dairy-free', 'sugar-free', 'low-fat', 'low-carb', 'high-protein', 'healthy', 'natural', 'fresh', 'premium', 'gourmet', 'artisan', 'local', 'imported', 'authentic', 'traditional', 'classic', 'original', 'spicy', 'sweet', 'sour', 'salty', 'bitter', 'savory', 'umami', 'delicious', 'tasty', 'yummy', 'mouth-watering', 'appetizing', 'flavorful', 'aromatic', 'fragrant', 'crispy', 'crunchy', 'chewy', 'soft', 'fluffy', 'creamy', 'smooth', 'rich', 'thick', 'thin', 'light', 'heavy', 'hearty', 'filling', 'satisfying', 'nutritious', 'wholesome', 'nourishing', 'energizing', 'refreshing', 'cooling', 'warming', 'comforting', 'soothing', 'invigorating', 'stimulating', 'relaxing', 'calming', 'uplifting', 'inspiring', 'delightful', 'enjoyable', 'pleasurable', 'wonderful', 'amazing', 'fantastic', 'fabulous', 'awesome', 'incredible', 'unbelievable', 'bites', 'minced', 'fillet', 'steak', 'chop', 'rib', 'wing', 'leg', 'breast', 'thigh', 'drumstick', 'liver', 'kidney', 'heart', 'tongue', 'tail', 'bone', 'skin', 'fat', 'suet', 'lard', 'tallow', 'marrow', 'cartilage', 'gelatin', 'collagen', 'broth', 'stock', 'bouillon', 'consomme', 'gravy', 'sauce', 'glaze', 'marinade', 'rub', 'spice', 'herb', 'seasoning', 'condiment', 'dressing', 'vinegar', 'oil', 'butter', 'margarine', 'shortening', 'lard', 'spray', 'baking', 'cooking', 'frying', 'roasting', 'grilling', 'smoking', 'boiling', 'steaming', 'poaching', 'simmering', 'stewing', 'braising', 'basting', 'marinating', 'seasoning', 'flavoring', 'coloring', 'thickening', 'sweetening', 'souring', 'salting', 'preserving', 'canning', 'pickling', 'fermenting', 'brewing', 'distilling', 'baking', 'pastry', 'dough', 'batter', 'crust', 'crumb', 'filling', 'topping', 'icing', 'frosting', 'glaze', 'syrup', 'jam', 'jelly', 'marmalade', 'preserve', 'conserve', 'compote', 'curd', 'custard', 'pudding', 'mousse', 'souffle', 'tart', 'pie', 'cake', 'brownie', 'cookie', 'biscuit', 'cracker', 'bread', 'roll', 'bun', 'bagel', 'muffin', 'scone', 'croissant', 'danish', 'pastry', 'strudel', 'turnover', 'empanada', 'samosa', 'spring roll', 'egg roll', 'dumpling', 'potsticker', 'wonton', 'ravioli', 'tortellini', 'pierogi', 'pelmeni', 'varenyky', 'khinkali', 'manti', 'bao', 'bun', 'dim sum', 'sushi', 'sashimi', 'nigiri', 'maki', 'roll', 'cone', 'bowl', 'salad', 'soup', 'stew', 'curry', 'chili', 'gumbo', 'jambalaya', 'paella', 'risotto', 'pilaf', 'biryani', 'fried', 'roasted', 'baked', 'grilled', 'smoked', 'boiled', 'steamed', 'raw', 'organic', 'farmers', 'farmer', 'cow', 'goat', 'pork'],
  'Cosmetics & Personal Care': ['lotion', 'cream', 'soap', 'shampoo', 'conditioner', 'deodorant', 'perfume', 'cologne', 'makeup', 'lipstick', 'mascara', 'foundation', 'powder', 'blush', 'eyeshadow', 'eyeliner', 'nail', 'polish', 'remover', 'cotton', 'swab', 'pad', 'tissue', 'wipe', 'razor', 'blade', 'shave', 'gel', 'foam', 'aftershave', 'toothpaste', 'toothbrush', 'floss', 'mouthwash', 'hair', 'brush', 'comb', 'clip', 'tie', 'band', 'spray', 'gel', 'mousse', 'wax', 'pomade', 'color', 'dye', 'bleach', 'relaxer', 'perm', 'extension', 'wig', 'weave', 'braid', 'twist', 'loc', 'dread', 'skin', 'care', 'cleanser', 'toner', 'moisturizer', 'serum', 'mask', 'scrub', 'peel', 'exfoliator', 'sun', 'screen', 'block', 'tan', 'burn', 'anti', 'aging', 'wrinkle', 'acne', 'pimple', 'blemish', 'spot', 'dark', 'circle', 'eye', 'lip', 'balm', 'gloss', 'liner', 'plumper', 'stain', 'tint', 'color', 'palette', 'brush', 'sponge', 'applicator', 'tool', 'tweezer', 'scissor', 'clipper', 'file', 'buffer', 'pusher', 'nipper', 'glue', 'remover', 'artificial', 'fake', 'false', 'lash', 'brow', 'pencil', 'powder', 'gel', 'pomade', 'stencil', 'tint', 'dye', 'bleach', 'relaxer', 'perm', 'extension', 'wig', 'weave', 'braid', 'twist', 'loc', 'dread', 'skin', 'care', 'cleanser', 'toner', 'moisturizer', 'serum', 'mask', 'scrub', 'peel', 'exfoliator', 'sun', 'screen', 'block', 'tan', 'burn', 'anti', 'aging', 'wrinkle', 'acne', 'pimple', 'blemish', 'spot', 'dark', 'circle', 'eye', 'lip', 'balm', 'gloss', 'liner', 'plumper', 'stain', 'tint', 'color', 'palette', 'brush', 'sponge', 'applicator', 'tool', 'tweezer', 'scissor', 'clipper', 'file', 'buffer', 'pusher', 'nipper', 'glue', 'remover', 'artificial', 'fake', 'false', 'lash', 'brow', 'pencil', 'powder', 'gel', 'pomade', 'stencil', 'tint', 'dye', 'bleach', 'relaxer', 'perm', 'extension', 'wig', 'weave', 'braid', 'twist', 'loc', 'dread', 'skin', 'care', 'cleanser', 'toner', 'moisturizer'],
  'Kitchenware & Electronics': ['heater', 'scoop', 'shovel', 'pan', 'iron', 'pot', 'kettle', 'blender', 'mixer', 'toaster', 'microwave', 'oven', 'stove', 'fridge', 'freezer', 'dishwasher', 'washing', 'machine', 'dryer', 'vacuum', 'cleaner', 'fan', 'air', 'conditioner', 'purifier', 'humidifier', 'dehumidifier', 'tv', 'television', 'radio', 'speaker', 'headphone', 'earphone', 'microphone', 'camera', 'phone', 'tablet', 'computer', 'laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'printer', 'scanner', 'copier', 'fax', 'projector', 'router', 'modem', 'switch', 'hub', 'cable', 'wire', 'cord', 'plug', 'socket', 'adapter', 'charger', 'battery', 'power', 'bank', 'bank', 'solar', 'panel', 'generator', 'inverter', 'ups', 'stabilizer', 'surge', 'protector', 'extension', 'lead', 'strip', 'light', 'bulb', 'lamp', 'tube', 'led', 'fluorescent', 'incandescent', 'halogen', 'neon', 'laser', 'torch', 'flashlight', 'lantern', 'candle', 'match', 'lighter', 'fire', 'extinguisher', 'alarm', 'detector', 'sensor', 'camera', 'cctv', 'security', 'system', 'lock', 'key', 'safe', 'box', 'cabinet', 'drawer', 'shelf', 'rack', 'stand', 'table', 'desk', 'chair', 'stool', 'sofa', 'couch', 'bed', 'mattress', 'pillow', 'blanket', 'sheet', 'towel', 'curtain', 'blind', 'shade', 'rug', 'carpet', 'mat', 'doormat', 'welcome', 'sign', 'board', 'plate', 'bowl', 'mug', 'cup', 'glass', 'fork', 'spoon', 'knife', 'cutlery', 'utensil', 'saucepan', 'skillet', 'wok', 'grill', 'roaster', 'baker', 'steamer', 'cooker', 'fryer', 'juicer', 'extractor', 'processor', 'chopper', 'slicer', 'grater', 'peeler', 'masher', 'whisk', 'spatula', 'tongs', 'ladle', 'skimmer', 'strainer', 'colander', 'sieve', 'funnel', 'measuring', 'scale', 'thermometer', 'timer', 'clock', 'watch', 'opener', 'corkscrew', 'nutcracker', 'garlic', 'press', 'rolling', 'pin', 'board', 'tray', 'platter', 'dish', 'bowl', 'basket', 'bin', 'can', 'bag', 'wrap', 'foil', 'paper', 'parchment', 'wax', 'filter', 'coffee', 'tea', 'infuser', 'maker', 'press', 'pot', 'cup', 'mug', 'glass', 'bottle', 'flask', 'jug', 'pitcher', 'decanter', 'carafe', 'tumbler', 'goblet', 'flute', 'snifter', 'stein', 'tankard', 'shot', 'cooler', 'bucket', 'ice', 'cube', 'tray', 'crusher', 'shaver', 'maker', 'tongs', 'scoop', 'bucket', 'cooler', 'chest', 'bag', 'pack', 'box', 'carrier', 'cart', 'trolley', 'barrow', 'wagon', 'truck', 'van', 'car', 'bike', 'motorcycle', 'scooter', 'skateboard', 'roller', 'skate', 'shoe', 'boot', 'sandal', 'slipper', 'flip', 'flop', 'sock', 'stocking', 'tights', 'leggings', 'pants', 'jeans', 'trousers', 'shorts', 'skirt', 'dress', 'gown', 'suit', 'jacket', 'coat', 'sweater', 'cardigan', 'pullover', 'shirt', 'blouse', 't-shirt', 'polo', 'top', 'tank', 'camisole', 'bra', 'underwear', 'panties', 'briefs', 'boxers', 'thong', 'swimwear', 'bikini', 'swimsuit', 'trunks', 'boardshorts', 'wetsuit', 'rashguard', 'cover-up', 'sarong', 'pareo', 'towel', 'robe', 'pajamas', 'nightgown', 'nightshirt', 'sleepwear', 'loungewear', 'activewear', 'sportswear', 'gymwear', 'yoga', 'running', 'cycling', 'swimming', 'hiking', 'camping', 'fishing', 'hunting', 'climbing', 'skiing', 'snowboarding', 'skating', 'surfing', 'sailing', 'boating', 'kayaking', 'canoeing', 'rafting', 'diving', 'snorkeling', 'swimming'],
  'Cleaning & Sanitary': ['cloth', 'microfiber', 'sponge', 'cleaner', 'detergent', 'soap', 'bleach', 'disinfectant', 'sanitizer', 'wipe', 'mop', 'broom', 'brush', 'dustpan', 'duster', 'bucket', 'bin', 'bag', 'trash', 'garbage', 'waste', 'recycle', 'compost', 'toilet', 'paper', 'tissue', 'napkin', 'towel', 'roll', 'dispenser', 'holder', 'brush', 'plunger', 'bowl', 'seat', 'cover', 'cleaner', 'deodorizer', 'freshener', 'spray', 'block', 'gel', 'liquid', 'powder', 'tablet', 'capsule', 'pod', 'pac', 'sheet', 'strip', 'bar', 'cake', 'flake', 'crystal', 'bead', 'pearl', 'drop', 'spray', 'pump', 'bottle', 'can', 'tube', 'jar', 'tub', 'box', 'carton', 'pack', 'pouch', 'sachet', 'bag', 'wrap', 'foil', 'paper', 'plastic', 'glass', 'metal', 'wood', 'bamboo'],
  'Stationery': ['paper', 'copy', 'book', 'pen', 'pencil', 'marker', 'highlighter', 'eraser', 'sharpener', 'ruler', 'compass', 'protractor', 'calculator', 'tape', 'glue', 'scissor', 'stapler', 'staple', 'clip', 'pin', 'tack', 'board', 'chalk', 'whiteboard', 'eraser', 'cleaner', 'folder', 'file', 'binder', 'divider', 'label', 'tag', 'sticker', 'note', 'pad', 'book', 'diary', 'journal', 'planner', 'calendar', 'envelope', 'card', 'letter', 'stamp', 'ink', 'cartridge', 'refill', 'ribbon', 'toner', 'printer', 'scanner', 'copier', 'fax', 'machine', 'shredder', 'laminator', 'binder', 'punch', 'cutter', 'trimmer', 'guillotine', 'mat', 'knife', 'blade', 'scissor', 'tape', 'scoth'],
  'Baby Products': ['baby', 'toy', 'plane', 'blocks', 'drawing', 'diaper', 'wipe', 'cream', 'lotion', 'oil', 'powder', 'soap', 'shampoo', 'conditioner', 'wash', 'bath', 'tub', 'sponge', 'towel', 'cloth', 'bib', 'bottle', 'nipple', 'pacifier', 'soother', 'teether', 'ring', 'cup', 'bowl', 'plate', 'spoon', 'fork', 'food', 'formula', 'milk', 'cereal', 'snack', 'juice', 'water', 'warmer', 'sterilizer', 'brush', 'rack', 'carrier', 'sling', 'wrap', 'stroller', 'pram', 'buggy', 'car', 'seat', 'booster', 'high', 'chair', 'bouncer', 'rocker', 'swing', 'walker', 'jumper', 'playpen', 'crib', 'cot', 'bassinet', 'cradle', 'bed', 'mattress', 'sheet', 'blanket', 'quilt', 'pillow', 'bumper', 'mobile', 'monitor', 'thermometer', 'aspirator', 'clipper', 'file', 'brush', 'comb', 'tweezer', 'scissor', 'medicine', 'dropper', 'syringe', 'dispenser', 'humidifier', 'purifier', 'vaporizer', 'inhaler', 'nebulizer', 'pump', 'pad', 'shield', 'cream', 'bag', 'bib', 'burp', 'cloth', 'blanket', 'swaddle', 'sleep', 'sack', 'bag', 'suit', 'romper', 'bodysuit', 'onesie', 'shirt', 'pant', 'short', 'skirt', 'dress', 'sweater', 'jacket', 'coat', 'snowsuit', 'hat', 'cap', 'beanie', 'mitten', 'glove', 'sock', 'bootie', 'shoe', 'sandal', 'slipper', 'swim', 'diaper', 'suit', 'rashguard', 'towel', 'robe'],
  'Sports & Fitness': ['roller', 'massage', 'yoga', 'mat', 'block', 'strap', 'ball', 'band', 'tube', 'rope', 'jump', 'skip', 'weight', 'dumbbell', 'barbell', 'kettlebell', 'plate', 'bar', 'collar', 'bench', 'rack', 'stand', 'machine', 'treadmill', 'elliptical', 'bike', 'cycle', 'rower', 'stepper', 'climber', 'glider', 'trainer', 'monitor', 'tracker', 'watch', 'band', 'clock', 'timer', 'stopwatch', 'pedometer', 'heart', 'rate', 'blood', 'pressure', 'scale', 'fat', 'analyzer', 'bottle', 'shaker', 'cup', 'mug', 'flask', 'jug', 'cooler', 'bag', 'pack', 'backpack', 'duffel', 'tote', 'sack', 'cinch', 'drawstring', 'waist', 'belt', 'fanny', 'pack', 'pouch', 'wallet', 'phone', 'armband', 'case', 'cover', 'holder', 'mount', 'stand', 'tripod', 'selfie', 'stick', 'lens', 'filter', 'light', 'flash', 'camera', 'action', 'gopro', 'drone', 'gimbal', 'stabilizer', 'battery', 'charger', 'cable', 'cord', 'wire', 'plug', 'adapter', 'power', 'bank', 'solar', 'panel', 'generator', 'inverter', 'ups', 'surge', 'protector', 'extension', 'lead', 'strip', 'headphone', 'earphone', 'speaker', 'microphone', 'radio', 'tv', 'television', 'monitor', 'computer', 'laptop', 'tablet', 'phone', 'smartwatch', 'tracker', 'band', 'app', 'software', 'game', 'console', 'controller', 'joystick', 'wheel', 'pedal', 'seat', 'cockpit', 'simulator', 'vr', 'ar', 'headset', 'glasses', 'goggles', 'helmet', 'pad', 'guard', 'brace', 'support', 'wrap', 'tape', 'bandage', 'spray', 'ice', 'pack', 'heat', 'rub', 'balm', 'cream', 'ointment', 'gel', 'lotion', 'oil', 'powder', 'salt', 'soak', 'bath', 'shower', 'soap', 'shampoo', 'conditioner', 'deodorant', 'antiperspirant', 'perfume', 'cologne', 'spray', 'body', 'wash', 'scrub', 'lotion', 'cream', 'butter', 'oil'],
};

// Also default fallback map for remaining
const fallback = 'General';

let changedCount = 0;

data.products.forEach(p => {
  const nameLower = p.name.toLowerCase();
  
  // Specific literal overrides for tricky ones
  if (nameLower.includes('basmati') || nameLower.includes('rice') || nameLower.includes('burger') || nameLower.includes('sausage') || nameLower.includes('bottel') || nameLower.includes('bottle')) {
    if (nameLower.includes('bottle') && !nameLower.includes('water')) {
      // Could be anything, usually general
    } else if (nameLower.includes('water') && nameLower.includes('bottle')) {
      p.category = 'Kitchenware & Electronics';
    } else {
      p.category = 'Food Products';
    }
  }

  // Iterate categories and check keywords
  let found = false;
  
  // Specifically force these items
  if (nameLower.includes('scoth') || nameLower.includes('paper')) {
    p.category = 'Stationery';
    found = true;
  }
  if (nameLower.includes('heater') || nameLower.includes('pan ') || nameLower.includes('iron') || nameLower.includes('scoop') || nameLower.includes('shovel')) {
    p.category = 'Kitchenware & Electronics';
    found = true;
  }
  if (nameLower.includes('roller')) {
    p.category = 'Sports & Fitness';
    found = true;
  }
  if (nameLower.includes('cognac') || nameLower.includes('wine')) {
    p.category = 'Alcoholic Drinks';
    found = true;
  }
  if (nameLower.includes('cloth')) {
    p.category = 'Cleaning & Sanitary';
    found = true;
  }
  if (nameLower.includes('toy') || nameLower.includes('blocks') || nameLower.includes('drawing')) {
    p.category = 'Baby Products';
    found = true;
  }

  if (!found) {
    for (const [cat, words] of Object.entries(keywords)) {
      if (words.some(w => nameLower.includes(w))) {
        p.category = cat;
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    if (p.category === 'Pet Care' || p.category === 'Kitchen Storage' || p.category === 'Sports & Wellness') {
       p.category = 'General'; // Normalize weird ones
    }
  }

  // Clean old categories
  const valid = ['Cosmetics & Personal Care', 'Alcoholic Drinks', 'Food Products', 'Kitchenware & Electronics', 'General', 'Cleaning & Sanitary', 'Sports & Fitness', 'Stationery', 'Baby Products'];
  
  if (!valid.includes(p.category)) {
      p.category = 'General';
  }
});

fs.writeFileSync('public/simba_products.json', JSON.stringify(data, null, 2));

console.log('Recategorized and saved!');
