import { Server } from "socket.io"; // Import the Server class from the socket.io library to handle WebSocket connections

const PORT = process.env.PORT || 3001; // Define the port number, using an environment variable if provided, otherwise defaulting to 3001

interface Player { // Define an interface for a Player object
  id: string; // Unique socket ID of the player
  name: string; // The display name chosen by the player
  symbol: 'X' | 'O'; // The game symbol assigned to the player, either 'X' or 'O'
}

interface Room { // Define an interface for a game Room object
  name: string; // The display name of the room
  players: Player[]; // An array of players currently in the room
  board: (string | null)[]; // An array representing the 3x3 tic-tac-toe board state
  currentPlayerIndex: number; // The index of the player whose turn it currently is (0 or 1)
  password?: string; // Optional password for private rooms
  isPrivate: boolean; // Boolean flag indicating if the room is password-protected
  status: 'waiting' | 'playing' | 'ended'; // The current state of the game in the room
  winner: string | null; // The name of the winner or 'Draw', or null if the game is still active
  scores: Record<string, number>; // A record mapping player IDs to their current session scores
  resetVotes: string[]; // An array of player IDs who have voted to reset the game
}

const rooms = new Map<string, Room>(); // Create a Map to store and manage active game rooms by their IDs

const io = new Server({ // Initialize a new Socket.IO server instance
  cors: { // Configure Cross-Origin Resource Sharing (CORS) settings
    origin: "*", // Allow connections from any origin for development and ease of access
  },
});

function getRoomList() { // Helper function to retrieve a summary list of all public and private rooms
  return Array.from(rooms.values()).map(r => ({ // Map through the room objects to extract relevant summary data
    name: r.name, // The name of the room
    players: r.players.length, // The number of players currently in the room
    isPrivate: r.isPrivate, // Whether the room is private
    status: r.status // The current status of the game in the room
  }));
}

io.on("connection", (socket) => { // Event listener for new WebSocket connections
  console.log("User connected:", socket.id); // Log the unique ID of the connecting player to the console

  socket.emit("room-list", getRoomList()); // Send the current list of rooms to the newly connected client

  socket.on("create-room", ({ roomName, playerName, isPrivate, password }) => { // Listener for the 'create-room' event from a client
    const roomId = roomName.toUpperCase(); // Convert the room name to uppercase to use as a unique ID
    if (rooms.has(roomId)) { // Check if a room with the same ID already exists
      socket.emit("error", "Room ID already exists"); // Inform the client if the room ID is already taken
      return; // Exit the function to prevent duplicate room creation
    }

    const room: Room = { // Create a new Room object with initial settings
      name: roomName, // Set the room name
      players: [{ id: socket.id, name: playerName, symbol: 'X' }], // Add the creator as the first player with symbol 'X'
      board: Array(9).fill(null), // Initialize an empty 3x3 board
      currentPlayerIndex: 0, // Set the first player ('X') as the starting player
      isPrivate, // Set the privacy status
      password: isPrivate ? password : undefined, // Store the password if the room is private
      status: 'waiting', // Set initial status to 'waiting' for a second player
      winner: null, // No winner yet
      scores: { [socket.id]: 0 }, // Initialize scores with the creator at 0
      resetVotes: [], // Initialize empty array for reset votes
    };

    rooms.set(roomId, room); // Add the newly created room to the rooms Map
    socket.join(roomId); // Make the creator's socket join the specified room channel
    socket.emit("room-created", room); // Notify the creator that the room was successfully created
    io.emit("room-list", getRoomList()); // Broadcast the updated room list to all connected clients
    console.log(`Room created: ${roomId} by ${playerName}`); // Log room creation details to the server console
  });

  socket.on("join-room", ({ roomId, playerName, password, isLinkJoin }) => { // Listener for the 'join-room' event
    const room = rooms.get(roomId.toUpperCase()); // Attempt to find the room by its ID

    if (!room) { // If the room does not exist
      socket.emit("error", "Room ID not found"); // Send an error message to the client
      return; // Stop execution
    }

    if (room.players.length >= 2) { // Check if the room already has two players
      socket.emit("error", "Room is full"); // Inform the client that the room is full
      return; // Stop execution
    }

    if (!isLinkJoin && room.isPrivate && room.password !== password) { // Verify password for private rooms unless joined via link
      socket.emit("error", "Incorrect password"); // Inform the client of incorrect password
      return; // Stop execution
    }

    const player: Player = { // Create a new Player object for the joining user
      id: socket.id, // Assign the user's socket ID
      name: playerName, // Set their chosen player name
      symbol: room.players.length === 0 ? 'X' : 'O', // Assign 'X' if alone, otherwise 'O'
    };

    room.players.push(player); // Add the new player to the room's players array
    room.scores[socket.id] = 0; // Initialize the new player's score to 0
    socket.join(roomId.toUpperCase()); // Add the player's socket to the room's communication channel

    if (room.players.length === 2) { // If there are now two players
      room.status = 'playing'; // Change the game status to 'playing'
    }

    io.to(roomId.toUpperCase()).emit("room-updated", room); // Notify everyone in the room about the updated state
    io.emit("room-list", getRoomList()); // Broadcast the updated list of rooms to all clients
    console.log(`${playerName} joined room: ${roomId}`); // Log the join event to the server console
  });

  socket.on("make-move", ({ roomId, index }) => { // Listener for the 'make-move' event when a player takes a turn
    const room = rooms.get(roomId.toUpperCase()); // Retrieve the room object
    if (!room || room.status !== 'playing') return; // Exit if room doesn't exist or game isn't in progress

    const currentPlayer = room.players[room.currentPlayerIndex]; // Identify the player whose turn it is
    if (currentPlayer?.id !== socket.id) return; // Verify that the move is being made by the correct player
    if (index < 0 || index > 8 || room.board[index] !== null) return; // Validate move index and ensure the cell is empty

    room.board[index] = currentPlayer.symbol; // Update the board with the player's symbol at the chosen position
    
    const winner = checkWinner(room.board); // Check if this move resulted in a win or a draw
    if (winner) { // If the game has ended
      room.status = 'ended'; // Update status to 'ended'
      if (winner === 'Draw') { // If it's a draw
        room.winner = 'Draw'; // Set winner property to 'Draw'
      } else { // If there is a clear winner
        room.winner = currentPlayer.name; // Store the winning player's name
        room.scores[currentPlayer.id] = (room.scores[currentPlayer.id] || 0) + 1; // Increment the winning player's session score
      }
    } else { // If the game continues
      room.currentPlayerIndex = 1 - room.currentPlayerIndex; // Toggle between player 0 and player 1
    }

    io.to(roomId.toUpperCase()).emit("room-updated", room); // Send the updated room state to all players in the room
  });

  socket.on("reset-game", (roomId) => { // Listener for voting to reset and play again
    const room = rooms.get(roomId.toUpperCase()); // Look up the room
    if (!room) return; // Exit if room not found

    if (!room.resetVotes.includes(socket.id)) { // If player hasn't already voted to reset
      room.resetVotes.push(socket.id); // Add their ID to the reset votes array
    }

    if (room.resetVotes.length >= room.players.length) { // If all players in the room have voted to reset
      room.board = Array(9).fill(null); // Clear the board for a new game
      room.status = 'playing'; // Set game status back to 'playing'
      room.currentPlayerIndex = 0; // Reset turn to the first player
      room.winner = null; // Clear any previous winner
      room.resetVotes = []; // Clear the votes for the next session
    }

    io.to(roomId.toUpperCase()).emit("room-updated", room); // Broadcast the reset or partially reset state to the room
  });

  socket.on("disconnect", () => { // Event listener for when a client disconnects
    for (const [roomId, room] of rooms.entries()) { // Iterate through all active rooms
      const playerIndex = room.players.findIndex(p => p.id === socket.id); // Check if the disconnected user was in this room
      if (playerIndex !== -1) { // If the user was found in the room
        room.players.splice(playerIndex, 1); // Remove the player from the room's players list
        if (room.players.length === 0) { // If the room is now empty
          rooms.delete(roomId); // Remove the room from the active rooms Map
        } else { // If one player is still left
          room.status = 'waiting'; // Set status back to 'waiting' for a new opponent
          room.board = Array(9).fill(null); // Reset the game board
          room.winner = null; // Clear the winner status
          io.to(roomId).emit("room-updated", room); // Inform the remaining player about the update
        }
      }
    }
    io.emit("room-list", getRoomList()); // Broadcast the updated global room list
  });
});

function checkWinner(board: (string | null)[]): string | null { // Function to determine win or draw status
  const lines: [number, number, number][] = [ // Define all possible winning configurations
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal from top-left
    [2, 4, 6], // Diagonal from top-right
  ];

  for (const [a, b, c] of lines) { // Iterate through each winning configuration
    if (board[a] && board[a] === board[b] && board[a] === board[c]) { // Check if all three cells in a line have the same symbol
      return board[a]; // Return the winning symbol ('X' or 'O')
    }
  }

  if (board.every(cell => cell !== null)) { // If all cells are filled and no winner found
    return 'Draw'; // Return 'Draw'
  }

  return null; // Return null if the game is still undecided
}

io.listen(Number(PORT)); // Start the Socket.IO server on the specified port
console.log(`Server running on port ${PORT}`); // Log starting confirmation message to console
