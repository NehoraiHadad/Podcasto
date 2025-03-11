import { config } from 'dotenv';
import { join } from 'path';
import { db } from './index';
import { podcasts } from './schema';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    const result = await db.select().from(podcasts).limit(1);
    console.log('Connection successful!');
    console.log('Sample data:', result);
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    // Close the database connection
    await db.$client.end();
  }
}

// Run the test
testConnection(); 