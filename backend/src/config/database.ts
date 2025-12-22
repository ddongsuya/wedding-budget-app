import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Render와 Neon은 DATABASE_URL을 사용
const connectionString = process.env.DATABASE_URL;

// Pool configuration with connection management
const poolConfig = connectionString
  ? {
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Neon/Render SSL 연결
      },
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      min: 2, // Minimum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
      maxUses: 7500, // Close a connection after it has been used 7500 times
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'wedding_budget',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      maxUses: 7500,
    };

export const pool = new Pool(poolConfig);

// Track connection state
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 5000;

/**
 * Handle pool errors - log but don't exit process
 * This allows the application to attempt recovery
 */
pool.on('error', (err: Error, client: PoolClient) => {
  console.error('Unexpected error on idle client:', err.message);
  isConnected = false;
  
  // Don't exit process, let the pool handle reconnection
  // The pool will automatically remove the errored client
});

/**
 * Log when a client is acquired from the pool
 */
pool.on('connect', () => {
  if (!isConnected) {
    console.log('Database connection established');
    isConnected = true;
    reconnectAttempts = 0;
  }
});

/**
 * Log when a client is removed from the pool
 */
pool.on('remove', () => {
  console.log('Client removed from pool');
});

/**
 * Test database connection with retry logic
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    isConnected = true;
    reconnectAttempts = 0;
    console.log('Database connection test successful');
    return true;
  } catch (error: any) {
    console.error('Database connection test failed:', error.message);
    isConnected = false;
    return false;
  }
};

/**
 * Attempt to reconnect to the database with exponential backoff
 */
export const attemptReconnect = async (): Promise<boolean> => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
    return false;
  }

  reconnectAttempts++;
  const delay = RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1);
  
  console.log(`Attempting database reconnection (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return testConnection();
};

/**
 * Execute a query with automatic retry on connection failure
 */
export const queryWithRetry = async (
  text: string,
  params?: any[],
  maxRetries: number = 2
): Promise<QueryResult> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error that might be recoverable
      const isConnectionError = 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.code === '57P01' || // admin_shutdown
        error.code === '57P02' || // crash_shutdown
        error.code === '57P03' || // cannot_connect_now
        error.message?.includes('Connection terminated') ||
        error.message?.includes('connection refused');
      
      if (isConnectionError && attempt < maxRetries) {
        console.warn(`Database query failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
        isConnected = false;
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Get a client from the pool with error handling
 */
export const getClient = async (): Promise<PoolClient> => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error: any) {
    console.error('Failed to get database client:', error.message);
    
    // Attempt reconnection
    const reconnected = await attemptReconnect();
    if (reconnected) {
      return pool.connect();
    }
    
    throw error;
  }
};

/**
 * Execute a transaction with automatic rollback on error
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Check if the database is currently connected
 */
export const isDbConnected = (): boolean => isConnected;

/**
 * Get pool statistics for monitoring
 */
export const getPoolStats = () => ({
  totalCount: pool.totalCount,
  idleCount: pool.idleCount,
  waitingCount: pool.waitingCount,
  isConnected,
  reconnectAttempts,
});

/**
 * Gracefully close the pool
 */
export const closePool = async (): Promise<void> => {
  console.log('Closing database pool...');
  await pool.end();
  isConnected = false;
  console.log('Database pool closed');
};

// Handle process termination gracefully
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});
