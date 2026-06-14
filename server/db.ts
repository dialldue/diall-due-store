import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

// Interface matching DB schema models
export interface DBProduct {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  stock: number;
  description: string;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  features: string[];
}

export interface DBMedia {
  type: 'image' | 'video';
  data: string;
}

export interface DBUser {
  email: string;
  name: string;
  password?: string;
  isAdmin: boolean;
}

export interface DBReview {
  user: string;
  rating: number;
  text: string;
  date: string;
}

const DB_DIR = path.join(process.cwd(), '.data');
const JSON_DB_PATH = path.join(DB_DIR, 'watch_store_db.json');

// Memory/JSON DB persistent store as fallback
const initialProducts = [
  { id: 1, name: "Royal Chronograph", brand: "RoyalCraft", price: 24999, originalPrice: 32999, stock: 15, description: "Classic chronograph with a genuine leather strap and reliable automatic movement.", features: ["Automatic Movement", "Sapphire Glass", "Water Resistant"], image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600", category: "For Him", rating: 4.8, reviews: 156 },
  { id: 2, name: "Sport Elite Titanium", brand: "EliteTime", price: 15999, originalPrice: 19999, stock: 8, description: "Durable sports watch with fitness tracking and a lightweight titanium body.", features: ["AMOLED Display", "Heart Rate Monitor", "Built-in GPS"], image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", category: "For Him", rating: 4.5, reviews: 98 },
  { id: 3, name: "Imperial Diamond Edition", brand: "Imperial", price: 49999, originalPrice: 65999, stock: 0, description: "Luxury timepiece featuring a diamond-studded bezel and premium alligator leather strap.", features: ["Tourbillon Engine", "Diamond Bezel", "Alligator Leather Strap"], image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600", category: "For Her", rating: 4.9, reviews: 67 },
  { id: 4, name: "Minimalist Platinum", brand: "PlatinumWear", price: 12999, originalPrice: 15999, stock: 3, description: "An ultra-thin, sleek watch with a polished platinum finish for everyday wear.", features: ["6mm Ultra-Thin Case", "Platinum Finish", "Quartz Movement"], image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600", category: "Unisex", rating: 4.6, reviews: 234 }
];

interface JSONStoreSchema {
  products: any[];
  users: any[];
  wishlists: any[];
  reviews: any[];
  categories?: string[];
}

let pool: pg.Pool | null = null;
let useFallback = false;
let lastError: string | null = null;

export function getDbStatus() {
  const uri = process.env.DATABASE_URL || process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.MONGODB_URI;
  const masked = uri ? uri.replace(/:([^@]+)@/, (match, p1) => `:${p1.substring(0, 3)}***@`) : 'None';
  return {
    useFallback,
    connected: !!pool && !useFallback,
    provider: 'PostgreSQL',
    maskedUri: masked,
    error: lastError
  };
}

// Initialize PostgreSQL client or fallback to JSON engine
export async function initializeDatabase() {
  let uri = process.env.DATABASE_URL || process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.MONGODB_URI;

  if (uri) {
    uri = uri.trim().replace(/^['"]|['"]$/g, '');
  }

  // Prevent MongoDB URIs from being processed by the postgres driver
  if (uri && (uri.startsWith('mongodb:') || uri.startsWith('mongodb+srv:'))) {
    console.warn('⚠️ MongoDB connection URI detected in env, but application has migrated to PostgreSQL. Operating in LOCAL fallback mode until a PostgreSQL URI is provided.');
    useFallback = true;
    lastError = 'MongoDB URI provided, but PostgreSQL is required.';
    initializeLocalJSONDB();
    return;
  }

  if (!uri) {
    console.warn('⚠️ PostgreSQL connection URL not detected in environment. Operating in LOCAL persistent SQL fallback mode.');
    useFallback = true;
    initializeLocalJSONDB();
    return;
  }

  try {
    const masked = uri.replace(/:([^@]+)@/, (match, p1) => `:${p1.substring(0, 3)}***@`);
    console.log(`🔌 Attempting PostgreSQL connection with: ${masked}`);
    
    pool = new Pool({
      connectionString: uri,
      ssl: uri.includes('localhost') || uri.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    // Run connection probe
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL successfully!');
    
    await bootstrapPostgresSchema();
    useFallback = false; // Successfully connected, make sure fallback is disabled!
    lastError = null;
  } catch (error: any) {
    lastError = error.message;
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    console.warn('⚠️ Fallback initiated: Running in local persistent JSON engine.');
    useFallback = true;
    initializeLocalJSONDB();
  }
}

// Ensure local fallback store has layout and structure correctly
function initializeLocalJSONDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(JSON_DB_PATH)) {
    const defaultData: JSONStoreSchema = {
      products: initialProducts.map(p => ({
        ...p,
        media: [{ type: 'image', data: p.image }],
        reviewsList: []
      })),
      users: [
        { name: 'Admin', email: 'dialldue@gmail.com', password: 'dialldue123###123', isAdmin: true },
        { name: 'VIP Customer', email: 'customer@gmail.com', password: 'customer123###123', isAdmin: false }
      ],
      wishlists: [],
      reviews: [],
      categories: ['For Him', 'For Her', 'Unisex', 'Couples']
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
  } else {
    try {
      const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
      const data = JSON.parse(raw) as JSONStoreSchema;
      let modified = false;
      const categoryMapping: Record<string, string> = {
        'Classic': 'For Him',
        'Sports': 'For Him',
        'Luxury': 'For Her',
        'Minimalist': 'Unisex'
      };
      if (data.products) {
        data.products.forEach(p => {
          if (categoryMapping[p.category]) {
            p.category = categoryMapping[p.category];
            modified = true;
          }
        });
      }
      if (!data.categories) {
        data.categories = ['For Him', 'For Her', 'Unisex', 'Couples'];
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
        console.log('🔄 Local JSON database categories migrated to modern collection standards.');
      }
    } catch {
      // ignore
    }
  }
}

function getLocalData(): JSONStoreSchema {
  initializeLocalJSONDB();
  try {
    const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { products: [], users: [], wishlists: [], reviews: [] };
  }
}

function writeLocalData(data: JSONStoreSchema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Bootstrap table structures and initial seeds for PostgreSQL
async function bootstrapPostgresSchema() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE
      )
    `);

    // 1.5. Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        name VARCHAR(100) PRIMARY KEY
      )
    `);

    // 2. Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC NOT NULL,
        stock INT DEFAULT 0,
        description TEXT,
        category VARCHAR(100),
        rating NUMERIC DEFAULT 0,
        reviews INT DEFAULT 0,
        image TEXT,
        features JSONB,
        media JSONB,
        reviews_list JSONB
      )
    `);

    // 3. Wishlists table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        product_id BIGINT,
        PRIMARY KEY (email, product_id)
      )
    `);

    // Seed default admin
    const adminCheck = await client.query('SELECT * FROM users WHERE email = $1', ['dialldue@gmail.com']);
    if (adminCheck.rowCount === 0) {
      await client.query(
        'INSERT INTO users (email, name, password, is_admin) VALUES ($1, $2, $3, $4)',
        ['dialldue@gmail.com', 'Admin', 'dialldue123###123', true]
      );
      console.log('👑 Default PostgreSQL admin user seeded.');
    }

    // Seed default customer login
    const customerCheck = await client.query('SELECT * FROM users WHERE email = $1', ['customer@gmail.com']);
    if (customerCheck.rowCount === 0) {
      await client.query(
        'INSERT INTO users (email, name, password, is_admin) VALUES ($1, $2, $3, $4)',
        ['customer@gmail.com', 'VIP Customer', 'customer123###123', false]
      );
      console.log('🛍️ Default PostgreSQL customer user seeded.');
    }

    // Seed default categories
    const catCheck = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(catCheck.rows[0].count, 10) === 0) {
      const defaultCats = ['For Him', 'For Her', 'Unisex', 'Couples'];
      for (const cat of defaultCats) {
        await client.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [cat]);
      }
      console.log('🏷️ Default PostgreSQL categories seeded.');
    }

    // Seed products
    const productsCheck = await client.query('SELECT COUNT(*) FROM products');
    const count = parseInt(productsCheck.rows[0].count, 10);
    if (count === 0) {
      for (const p of initialProducts) {
        await client.query(`
          INSERT INTO products (
            id, name, brand, price, original_price, stock, description, category, rating, reviews, image, features, media, reviews_list
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          p.id,
          p.name,
          p.brand,
          p.price,
          p.originalPrice,
          p.stock,
          p.description,
          p.category,
          p.rating,
          p.reviews,
          p.image,
          JSON.stringify(p.features),
          JSON.stringify([{ type: 'image', data: p.image }]),
          JSON.stringify([])
        ]);
      }
      console.log('⌚ Default PostgreSQL watch catalog products seeded.');
    } else {
      // Migrate legacy categories to new collections (For Him, For Her, Unisex)
      await client.query(`
        UPDATE products SET category = 'For Him' WHERE category IN ('Classic', 'Sports');
      `);
      await client.query(`
        UPDATE products SET category = 'For Her' WHERE category = 'Luxury';
      `);
      await client.query(`
        UPDATE products SET category = 'Unisex' WHERE category = 'Minimalist';
      `);
      console.log('⌚ PostgreSQL categories migrated to digital boutique collections.');
    }
  } catch (err: any) {
    console.error('Error bootstrapping PostgreSQL schema & seeds:', err.message);
  } finally {
    client.release();
  }
}

// Domain operation handlers mapped to PostgreSQL or local JSON file fallback

export async function getProducts(): Promise<any[]> {
  if (useFallback) {
    const data = getLocalData();
    return data.products.map(p => ({
      ...p,
      reviewsList: (p.reviewsList || []).map((rev: any, idx: number) => ({
        id: rev.id !== undefined ? Number(rev.id) : (100000 + idx + (Number(p.id) % 1000) * 1000),
        ...rev
      }))
    }));
  }

  if (!pool) return [];
  const res = await pool.query('SELECT * FROM products ORDER BY id DESC');
  return res.rows.map(p => {
    const pId = Number(p.id);
    const rawList = Array.isArray(p.reviews_list) ? p.reviews_list : (typeof p.reviews_list === 'string' ? JSON.parse(p.reviews_list) : []);
    const processedReviews = rawList.map((rev: any, idx: number) => ({
      id: rev.id !== undefined ? Number(rev.id) : (100000 + idx + (pId % 1000) * 1000),
      ...rev
    }));

    return {
      id: pId,
      name: p.name,
      brand: p.brand,
      price: Number(p.price),
      originalPrice: Number(p.original_price),
      stock: Number(p.stock),
      description: p.description,
      category: p.category,
      rating: Number(p.rating),
      reviews: Number(p.reviews),
      image: p.image,
      features: Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features) : []),
      media: Array.isArray(p.media) ? p.media : (typeof p.media === 'string' ? JSON.parse(p.media) : [{ type: 'image', data: p.image }]),
      reviewsList: processedReviews
    };
  });
}

export async function createProduct(p: {
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  stock: number;
  description: string;
  category: string;
  rating: number;
  reviews?: number;
  image: string;
  features: string[];
  media: Array<{ type: 'image' | 'video'; data: string }>;
}): Promise<any> {
  if (useFallback) {
    const data = getLocalData();
    const newId = Date.now();
    const newProduct = {
      ...p,
      id: newId,
      reviews: p.reviews || 0,
      media: p.media.map(m => ({ type: m.type, data: m.data })),
      reviewsList: []
    };
    data.products.unshift(newProduct);
    writeLocalData(data);
    return newProduct;
  }

  if (!pool) throw new Error('Database is offline');
  const newId = Date.now();
  await pool.query(`
    INSERT INTO products (
      id, name, brand, price, original_price, stock, description, category, rating, reviews, image, features, media, reviews_list
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  `, [
    newId,
    p.name,
    p.brand,
    p.price,
    p.originalPrice,
    p.stock,
    p.description,
    p.category,
    p.rating,
    p.reviews || 0,
    p.image,
    JSON.stringify(p.features),
    JSON.stringify(p.media),
    JSON.stringify([])
  ]);

  return {
    id: newId,
    name: p.name,
    brand: p.brand,
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    description: p.description,
    category: p.category,
    rating: p.rating,
    reviews: p.reviews || 0,
    image: p.image,
    features: p.features,
    media: p.media,
    reviewsList: []
  };
}

export async function updateProduct(id: number, p: {
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  stock: number;
  description: string;
  category: string;
  rating: number;
  reviews: number;
  features: string[];
  media: Array<{ type: 'image' | 'video'; data: string }>;
}): Promise<void> {
  if (useFallback) {
    const data = getLocalData();
    const idx = data.products.findIndex(x => x.id === id);
    if (idx !== -1) {
      data.products[idx] = {
        ...data.products[idx],
        name: p.name,
        brand: p.brand,
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock,
        description: p.description,
        category: p.category,
        rating: p.rating,
        reviews: p.reviews,
        features: p.features,
        image: p.media.length > 0 ? p.media[0].data : data.products[idx].image,
        media: p.media
      };
      writeLocalData(data);
    }
    return;
  }

  if (!pool) throw new Error('Database is offline');
  const primaryImg = p.media.length > 0 ? p.media[0].data : '';
  await pool.query(`
    UPDATE products
    SET name = $1, brand = $2, price = $3, original_price = $4, stock = $5,
        description = $6, category = $7, rating = $8, reviews = $9,
        image = $10, features = $11, media = $12
    WHERE id = $13
  `, [
    p.name,
    p.brand,
    p.price,
    p.originalPrice,
    p.stock,
    p.description,
    p.category,
    p.rating,
    p.reviews,
    primaryImg,
    JSON.stringify(p.features),
    JSON.stringify(p.media),
    id
  ]);
}

export async function deleteProduct(id: number): Promise<void> {
  if (useFallback) {
    const data = getLocalData();
    data.products = data.products.filter(x => x.id !== id);
    data.wishlists = data.wishlists.filter(w => w.productId !== id);
    data.reviews = data.reviews.filter(r => r.productId !== id);
    writeLocalData(data);
    return;
  }

  if (!pool) throw new Error('Database is offline');
  // Delete wishlists references first to avoid foreign-key constraints
  await pool.query('DELETE FROM wishlists WHERE product_id = $1', [id]);
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
}

export async function findUserByEmail(email: string): Promise<DBUser | null> {
  if (useFallback) {
    const data = getLocalData();
    const match = data.users.find(u => u.email === email);
    return match || null;
  }

  if (!pool) return null;
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (res.rowCount === 0) return null;
  const u = res.rows[0];
  return {
    email: u.email,
    name: u.name,
    password: u.password,
    isAdmin: Boolean(u.is_admin)
  };
}

export async function createUser(email: string, name: string, passwordHashed: string, isAdmin: boolean = false): Promise<DBUser> {
  if (useFallback) {
    const data = getLocalData();
    const newUser = { email, name, password: passwordHashed, isAdmin };
    data.users.push(newUser);
    writeLocalData(data);
    return newUser;
  }

  if (!pool) throw new Error('Database is offline');
  const newUser = { email, name, password: passwordHashed, isAdmin };
  await pool.query(`
    INSERT INTO users (email, name, password, is_admin)
    VALUES ($1, $2, $3, $4)
  `, [email, name, passwordHashed, isAdmin]);
  return { email, name, isAdmin };
}

export async function getWishlist(email: string): Promise<number[]> {
  if (useFallback) {
    const data = getLocalData();
    return data.wishlists.filter(w => w.email === email).map(w => w.productId);
  }

  if (!pool) return [];
  const res = await pool.query('SELECT product_id FROM wishlists WHERE email = $1', [email]);
  return res.rows.map(r => Number(r.product_id));
}

export async function toggleWishlist(email: string, productId: number): Promise<{ isAdded: boolean }> {
  if (useFallback) {
    const data = getLocalData();
    const idx = data.wishlists.findIndex(w => w.email === email && w.productId === productId);
    let isAdded = false;
    if (idx !== -1) {
      data.wishlists.splice(idx, 1);
    } else {
      data.wishlists.push({ email, productId });
      isAdded = true;
    }
    writeLocalData(data);
    return { isAdded };
  }

  if (!pool) throw new Error('Database is offline');
  const existingCheck = await pool.query('SELECT * FROM wishlists WHERE email = $1 AND product_id = $2', [email, productId]);
  
  if (existingCheck.rowCount !== null && existingCheck.rowCount > 0) {
    await pool.query('DELETE FROM wishlists WHERE email = $1 AND product_id = $2', [email, productId]);
    return { isAdded: false };
  } else {
    // Make sure user exists in Postgres so foreign key doesn't fail
    await pool.query(`
      INSERT INTO wishlists (email, product_id)
      VALUES ($1, $2)
    `, [email, productId]);
    return { isAdded: true };
  }
}

export async function createReview(productId: number, r: { user: string; rating: number; text: string; date: string }): Promise<void> {
  const reviewWithId = {
    id: Date.now() + Math.floor(Math.random() * 100000),
    ...r
  };

  if (useFallback) {
    const data = getLocalData();
    const prod = data.products.find(p => p.id === productId);
    if (prod) {
      if (!prod.reviewsList) prod.reviewsList = [];
      prod.reviewsList.unshift(reviewWithId);
      const oldRating = prod.rating || 0;
      const oldReviewsCount = prod.reviews || 0;
      prod.rating = parseFloat((((oldRating * oldReviewsCount) + r.rating) / (oldReviewsCount + 1)).toFixed(1));
      prod.reviews = oldReviewsCount + 1;
      writeLocalData(data);
    }
    return;
  }

  if (!pool) throw new Error('Database is offline');
  const res = await pool.query('SELECT rating, reviews, reviews_list FROM products WHERE id = $1', [productId]);
  if (res.rowCount !== null && res.rowCount > 0) {
    const prod = res.rows[0];
    const oldRating = Number(prod.rating || 0);
    const oldRC = Number(prod.reviews || 0);
    const updatedRating = parseFloat((((oldRating * oldRC) + r.rating) / (oldRC + 1)).toFixed(1));
    const updatedCount = oldRC + 1;
    
    // Deserialize, prepend and update JSON list
    let reviewsList: any[] = [];
    if (prod.reviews_list) {
      try {
        reviewsList = Array.isArray(prod.reviews_list) ? prod.reviews_list : JSON.parse(prod.reviews_list);
      } catch {
        reviewsList = [];
      }
    }
    reviewsList.unshift(reviewWithId);
    
    await pool.query(`
      UPDATE products
      SET reviews_list = $1, rating = $2, reviews = $3
      WHERE id = $4
    `, [JSON.stringify(reviewsList), updatedRating, updatedCount, productId]);
  }
}

export async function deleteReview(productId: number, reviewId: number): Promise<void> {
  if (useFallback) {
    const data = getLocalData();
    const prod = data.products.find(p => p.id === productId);
    if (prod) {
      if (!prod.reviewsList) prod.reviewsList = [];
      
      // Ensure existing ones have IDs for deterministic filtering
      const mapped = prod.reviewsList.map((rev: any, idx: number) => ({
        id: rev.id !== undefined ? Number(rev.id) : (100000 + idx + (Number(productId) % 1000) * 1000),
        ...rev
      }));

      prod.reviewsList = mapped.filter(r => Number(r.id) !== Number(reviewId));
      
      const newReviewsCount = prod.reviewsList.length;
      if (newReviewsCount > 0) {
        const sumRating = prod.reviewsList.reduce((sum, rev) => sum + Number(rev.rating || 0), 0);
        prod.rating = parseFloat((sumRating / newReviewsCount).toFixed(1));
      } else {
        prod.rating = 5.0; // default rating if there are no reviews
      }
      prod.reviews = newReviewsCount;
      writeLocalData(data);
    }
    return;
  }

  if (!pool) throw new Error('Database is offline');
  const res = await pool.query('SELECT rating, reviews, reviews_list FROM products WHERE id = $1', [productId]);
  if (res.rowCount !== null && res.rowCount > 0) {
    const prod = res.rows[0];
    let reviewsList: any[] = [];
    if (prod.reviews_list) {
      try {
        reviewsList = Array.isArray(prod.reviews_list) ? prod.reviews_list : JSON.parse(prod.reviews_list);
      } catch {
        reviewsList = [];
      }
    }

    // Ensure all have mapped IDs and filter out
    const mapped = reviewsList.map((rev: any, idx: number) => ({
      id: rev.id !== undefined ? Number(rev.id) : (100000 + idx + (Number(productId) % 1000) * 1000),
      ...rev
    }));

    const filtered = mapped.filter(r => Number(r.id) !== Number(reviewId));
    const newReviewsCount = filtered.length;
    let newRating = 5.0;
    if (newReviewsCount > 0) {
      const sumRating = filtered.reduce((sum, rev) => sum + Number(rev.rating || 0), 0);
      newRating = parseFloat((sumRating / newReviewsCount).toFixed(1));
    }

    await pool.query(`
      UPDATE products
      SET reviews_list = $1, rating = $2, reviews = $3
      WHERE id = $4
    `, [JSON.stringify(filtered), newRating, newReviewsCount, productId]);
  }
}

export async function getCategories(): Promise<string[]> {
  if (useFallback) {
    const data = getLocalData();
    if (!data.categories || data.categories.length === 0) {
      return ['For Him', 'For Her', 'Unisex', 'Couples'];
    }
    return data.categories;
  }

  if (!pool) return ['For Him', 'For Her', 'Unisex', 'Couples'];
  try {
    const res = await pool.query('SELECT name FROM categories ORDER BY name ASC');
    if (res.rowCount === 0) {
      return ['For Him', 'For Her', 'Unisex', 'Couples'];
    }
    return res.rows.map(r => r.name);
  } catch (err) {
    console.error('Error fetching categories from Postgres:', err);
    return ['For Him', 'For Her', 'Unisex', 'Couples'];
  }
}

export async function createCategory(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be empty');

  if (useFallback) {
    const data = getLocalData();
    if (!data.categories) data.categories = ['For Him', 'For Her', 'Unisex', 'Couples'];
    if (!data.categories.includes(trimmed)) {
      data.categories.push(trimmed);
      writeLocalData(data);
    }
    return trimmed;
  }

  if (!pool) throw new Error('Database is offline');
  await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [trimmed]);
  return trimmed;
}

export async function deleteCategory(name: string): Promise<void> {
  const trimmed = name.trim();
  if (useFallback) {
    const data = getLocalData();
    if (data.categories) {
      data.categories = data.categories.filter(c => c !== trimmed);
      // Cascadingly clean up products belonging to this category in Local Storage as well
      data.products = data.products.filter(p => p.category !== trimmed);
      writeLocalData(data);
    }
    return;
  }

  if (!pool) throw new Error('Database is offline');
  // First, clear wishlists for all products in this category to satisfy foreign-key constraints
  await pool.query(`
    DELETE FROM wishlists WHERE product_id IN (
      SELECT id FROM products WHERE category = $1
    )
  `, [trimmed]);
  
  // Second, remove products belonging to this category
  await pool.query('DELETE FROM products WHERE category = $1', [trimmed]);
  
  // Finally, delete the category itself
  await pool.query('DELETE FROM categories WHERE name = $1', [trimmed]);
}

