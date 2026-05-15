import pkg from "pg"
const { Pool } = pkg

import { DATABASE_URL } from "../env.js"

const pool = new Pool({
  connectionString: DATABASE_URL,
})

export const query = (text: string, params?: any[]) => pool.query(text, params)

// --- User Logic ---

export async function getUserByName(name: string) {
  const res = await query(
    "SELECT id, name, password, current_room_id FROM users WHERE name = $1",
    [name]
  )
  return res.rows[0]
}

export async function getUserById(id: string) {
  const res = await query(
    "SELECT id, name, current_room_id FROM users WHERE id = $1",
    [id]
  )
  return res.rows[0]
}

export async function createUser(id: string, name: string, password: string) {
  await query("INSERT INTO users (id, name, password) VALUES ($1, $2, $3)", [
    id,
    name,
    password,
  ])
}

export async function updateUserCurrentRoom(
  userId: string,
  roomId: string | null
) {
  await query("UPDATE users SET current_room_id = $1 WHERE id = $2", [
    roomId,
    userId,
  ])
}

// --- Session Logic ---

export async function createSession(
  userId: string,
  token: string,
  expiresAt: Date
) {
  await query(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  )
}

export async function deleteSession(token: string) {
  await query("DELETE FROM sessions WHERE token = $1", [token])
}

export async function validateSession(token: string) {
  const res = await query(
    `SELECT u.id, u.name, u.current_room_id 
     FROM users u
     JOIN sessions s ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  )
  return res.rows[0]
}

export async function validateAccounts(
  accounts: { id: string; token: string }[]
) {
  const validAccounts = []
  for (const acc of accounts) {
    const result = await query(
      `SELECT u.id, u.name 
       FROM users u
       JOIN sessions s ON u.id = s.user_id
       WHERE u.id = $1 AND s.token = $2 AND s.expires_at > NOW()`,
      [acc.id, acc.token]
    )
    if (result.rows.length > 0) {
      validAccounts.push(acc)
    }
  }
  return validAccounts
}

// --- Room Logic ---

export async function getAllRooms() {
  const res = await query("SELECT id, name, status, is_private FROM rooms")
  return res.rows
}

export async function getRoomById(id: string) {
  const res = await query("SELECT * FROM rooms WHERE id = $1", [id])
  return res.rows[0]
}

export async function saveRoom(room: any, password?: string) {
  await query(
    `INSERT INTO rooms (id, name, creator_id, is_private, password, status, current_player_index, winner, board, scores, reset_votes, is_ai_game)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO UPDATE SET
     name = EXCLUDED.name,
     status = EXCLUDED.status,
     current_player_index = EXCLUDED.current_player_index,
     winner = EXCLUDED.winner,
     board = EXCLUDED.board,
     scores = EXCLUDED.scores,
     reset_votes = EXCLUDED.reset_votes,
     is_ai_game = EXCLUDED.is_ai_game`,
    [
      room.id,
      room.name,
      room.creatorId,
      room.isPrivate,
      password,
      room.status,
      room.currentPlayerIndex,
      room.winner,
      room.board,
      JSON.stringify(room.scores),
      room.resetVotes,
      room.isAiGame || false,
    ]
  )
}

export async function deleteRoom(roomId: string) {
  await query("DELETE FROM rooms WHERE id = $1", [roomId])
}

export default pool
