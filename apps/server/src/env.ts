export const NODE_ENV = process.env.NODE_ENV || "development"
export const PORT = process.env.PORT || 4000
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/tictactoe"
