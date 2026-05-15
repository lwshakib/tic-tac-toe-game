import pool from "../lib/db.js"

async function setup() {
  const client = await pool.connect()
  try {
    console.log("Setting up database schema...")

    // Create rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        creator_id TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        password TEXT,
        status TEXT DEFAULT 'waiting',
        current_player_index INTEGER DEFAULT 0,
        winner TEXT,
        board TEXT[] DEFAULT ARRAY[NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL],
        scores JSONB DEFAULT '{}'::jsonb,
        reset_votes TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('Table "rooms" ensured.')

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        current_room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('Table "users" ensured.')

    // Add back the FK from rooms to users now that users exists
    await client
      .query(
        `
      ALTER TABLE rooms ADD CONSTRAINT fk_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL;
    `
      )
      .catch(() => {}) // Catch if already exists

    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('Table "sessions" ensured.')

    console.log("Database setup completed successfully.")
  } catch (err) {
    console.error("Error setting up database:", err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

setup()
