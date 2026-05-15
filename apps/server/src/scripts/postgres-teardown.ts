import pool from "../lib/db.js"

async function teardown() {
  const client = await pool.connect()
  try {
    console.log("Tearing down database schema...")

    await client.query("DROP TABLE IF EXISTS sessions CASCADE;")
    console.log('Table "sessions" dropped.')

    await client.query("DROP TABLE IF EXISTS rooms CASCADE;")
    console.log('Table "rooms" dropped.')

    await client.query("DROP TABLE IF EXISTS users CASCADE;")
    console.log('Table "users" dropped.')

    console.log("Database teardown completed successfully.")
  } catch (err) {
    console.error("Error tearing down database:", err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

teardown()
