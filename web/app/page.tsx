'use client'; // Directive to indicate this is a Client Component in Next.js

import { useState, useEffect } from 'react'; // Import React hooks for state management and side effects
import { io, Socket } from 'socket.io-client'; // Import Socket.IO client and its type definition
import { User, Lock, Globe, Share2, RefreshCw } from 'lucide-react'; // Import icons for UI elements from Lucide React

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'; // Define the backend socket server URL

interface Player { // Define structure for a Player object
    id: string; // The socket ID of the player
    name: string; // The display name of the player
    symbol: 'X' | 'O'; // The symbol ('X' or 'O') assigned to the player
}

interface Room { // Define structure for a Room object
    name: string; // The unique name of the room
    players: Player[]; // List of players currently in the room
    board: (string | null)[]; // The current state of the 3x3 game board
    currentPlayerIndex: number; // The index of the player whose turn it is
    isPrivate: boolean; // Flag for password protection
    status: 'waiting' | 'playing' | 'ended'; // Current state of the game
    winner: string | null; // The name of the winner or null
    scores: Record<string, number>; // Tallied scores for players in this session
    resetVotes: string[]; // IDs of players who voted to reset the game
}

interface RoomListItem { // Define structure for items in the room list
    name: string; // Name of the room
    players: number; // Number of players currently joined
    isPrivate: boolean; // Privacy status of the room
    status: 'waiting' | 'playing' | 'ended'; // Game progress status
}

export default function TicTacToe() { // Main component function for the Tic-Tac-Toe game
    const [socket, setSocket] = useState<Socket | null>(null); // State to store the socket connection instance
    const [playerName, setPlayerName] = useState(''); // State for the user's chosen display name
    
    // Join States
    const [joinRoomId, setJoinRoomId] = useState(''); // State for the ID of the room to join
    const [joinPassword, setJoinPassword] = useState(''); // State for the password used to join a private room
    const [needsPassword, setNeedsPassword] = useState(false); // UI state to show the password prompt

    // Create States
    const [createRoomName, setCreateRoomName] = useState(''); // State for the name of the new room being created
    const [createPassword, setCreatePassword] = useState(''); // State for the password of the new private room
    const [isPrivate, setIsPrivate] = useState(false); // State for whether the new room is private
    
    const [room, setRoom] = useState<Room | null>(null); // State for the current room's full data
    const [roomList, setRoomList] = useState<RoomListItem[]>([]); // State for the list of available rooms
    const [error, setError] = useState(''); // State for storing error messages to display
    const [joined, setJoined] = useState(false); // State indicating if the user has successfully joined a room
    const [isLinkJoin, setIsLinkJoin] = useState(false); // State indicating if the join was initiated via a URL link

    useEffect(() => { // Hook to run initialization logic on component mount
        const s = io(SOCKET_URL); // Establish connection to the Socket.IO server
        setSocket(s); // Store the socket instance in local state

        s.on('room-list', (list: RoomListItem[]) => { // Listen for updates to the global room list
            setRoomList(list); // Update state with the new room list data
        });

        s.on('room-created', (roomData: Room) => { // Listen for successful room creation
            setRoom(roomData); // Update state with the new room's details
            setJoined(true); // Transition UI to the game screen
        });

        s.on('room-updated', (roomData: Room) => { // Listen for periodic updates to the current room state
            setRoom(roomData); // Synchronize local state with server state
            setJoined(true); // Ensure the game screen is visible
            setError(''); // Clear any transient error messages
        });

        s.on('error', (msg: string) => { // Listen for error notifications from the server
            setError(msg); // Store the error message for display
            if (msg === "Incorrect password" || msg === "Password required") { // Handle specific authentication errors
                setNeedsPassword(true); // Prompt the user for a password
            }
        });

        const params = new URLSearchParams(window.location.search); // Parse query parameters from the current URL
        const urlRoomId = params.get('room'); // Check if a 'room' parameter exists for direct joining
        if (urlRoomId) { // If a room ID was found in the URL
            setJoinRoomId(urlRoomId.toUpperCase()); // Set the join ID state
            setIsLinkJoin(true); // Mark this attempt as a link-based join
        }

        return () => { // Cleanup function when component unmounts
            s.disconnect(); // Gracefully close the socket connection
        };
    }, []); // Empty dependency array means this effect runs once on mount

    const createRoom = () => { // Function to request creation of a new game room
        if (!playerName || !createRoomName) { // Validate required inputs
            setError('Missing Name or Room Name'); // Set error message if validation fails
            return; // Abort the creation process
        }
        socket?.emit('create-room', { // Send 'create-room' event to server
            roomName: createRoomName.toUpperCase(), // Normalize room name to uppercase
            playerName, // Include chosen player name
            isPrivate, // Include privacy setting
            password: isPrivate ? createPassword : undefined // Include password if private
        });
    };

    const connectRoom = (roomIdOverride?: string) => { // Function to request joining an existing room
        const targetId = (roomIdOverride || joinRoomId).toUpperCase(); // Determine target room ID, converting to uppercase
        if (!playerName || !targetId) { // Validate that name and room ID are present
            setError('Missing Name or Room ID'); // Set error message for missing fields
            return; // Abort the join process
        }

        const targetRoom = roomList.find(r => r.name.toUpperCase() === targetId); // Look up room details in the local list
        if (targetRoom?.isPrivate && !joinPassword && !isLinkJoin) { // Check if it's a private room requiring internal auth
            setNeedsPassword(true); // Switch UI to password entry mode
            setError('Private Node: Authentication Required'); // Notify user that password is needed
            return; // Abort until password is provided
        }

        socket?.emit('join-room', { // Send 'join-room' event to server
            roomId: targetId, // The ID of the room to join
            playerName, // The user's chosen name
            password: joinPassword, // The provided password (if any)
            isLinkJoin: isLinkJoin // Flag whether this was a direct link join
        });
    };

    const makeMove = (index: number) => { // Function to send a move action to the server
        if (!room) return; // Ignore if not currently in a room
        socket?.emit('make-move', { roomId: room.name, index }); // Emit 'make-move' with room ID and board index
    };

    const resetGame = () => { // Function to vote for a game reset
        if (!room) return; // Ignore if not in a room
        socket?.emit('reset-game', room.name); // Emit 'reset-game' for the current room
    };

    const copyLink = () => { // Function to copy the direct joining link to clipboard
        const link = `${window.location.origin}/?room=${room?.name}`; // Construct the full URL with query param
        navigator.clipboard.writeText(link); // Use clipboard API to save the string
        alert('Link copied to clipboard!'); // Notify user of successful copy
    };

    if (!joined) { // Conditional rendering for the initial lobby/landing screen
        return ( // Return the lobby UI
            <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans text-black text-[12px]"> // Main wrapper with styling
                <div className="max-w-5xl w-full space-y-8"> // Content container with spacing
                    <div className="text-center border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white"> // Header section
                        <h1 className="text-4xl font-black uppercase tracking-[0.2em]">Tic Tac Toe</h1> // Game title
                        <p className="text-gray-500 text-[10px] font-bold uppercase mt-2 tracking-widest italic">Multiplayer Grid Protocol</p> // Subtitle/Theme
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"> // Main grid for lobby sections
                        {/* Step 1: Persona */}
                        <div className="border-2 border-black p-6 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white"> // Section for user identity
                            <h2 className="text-[10px] font-black uppercase tracking-wider border-b-2 border-black pb-2">1. Your Persona</h2> // Section header
                            <div className="space-y-4"> // Input group
                                <div className="space-y-2"> // Name input wrapper
                                    <label className="text-[10px] font-black uppercase text-gray-400">Handle / Alias</label> // Input label
                                    <div className="relative"> // Input field container
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" /> // Icon inside input
                                        <input // Input element for player name
                                            type="text" // Standard text input
                                            placeholder="John Doe..." // Placeholder text
                                            value={playerName} // Controlled value from state
                                            onChange={(e) => setPlayerName(e.target.value)} // Update state on typing
                                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50 transition-all font-bold uppercase" // Styling
                                        />
                                    </div>
                                </div>
                            </div>
                            {error && ( // Conditional error display
                                <div className="p-3 bg-black text-white text-[10px] font-mono text-center border-2 border-black animate-pulse uppercase"> // Error message box
                                    Status: {error} // Content of the error
                                </div>
                            )}
                        </div>

                        {/* Connection Controls */}
                        <div className="space-y-8"> // Middle column for room connection
                            <div className="border-2 border-black p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white"> // Join room container
                                <h2 className="text-[10px] font-black uppercase tracking-wider border-b-2 border-black pb-2">2. Connect To Room</h2> // Header for join section
                                <div className="space-y-3"> // Input and button group
                                    {needsPassword ? ( // Conditional password prompt UI
                                        <div className="border-2 border-black p-3 bg-gray-50 flex items-center justify-between animate-in fade-in duration-300"> // Auth status box
                                            <div className="flex items-center gap-2"> // Room info
                                                <Lock className="w-3 h-3 text-gray-400" /> // Lock icon
                                                <span className="font-bold uppercase text-[10px]">AUTH: {joinRoomId}</span> // Display room being authenticated
                                            </div>
                                            <button // Button to go back to ID entry
                                                onClick={() => { // Reset auth-related states
                                                    setNeedsPassword(false); // Hide password field
                                                    setJoinRoomId(''); // Clear ID
                                                    setJoinPassword(''); // Clear password
                                                    setError(''); // Clear errors
                                                }}
                                                className="text-[8px] font-black uppercase hover:underline text-gray-400 hover:text-black" // Styling
                                            >
                                                Back
                                            </button>
                                        </div>
                                    ) : ( // Default room ID input
                                        <input // Input element for room ID
                                            type="text" // Multi-char text input
                                            placeholder="Room ID" // Placeholder
                                            value={joinRoomId} // State binding
                                            onChange={(e) => { // Value change handler
                                                setJoinRoomId(e.target.value); // Update ID
                                                setNeedsPassword(false); // Reset password state if typing new ID
                                            }}
                                            className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50 font-bold uppercase" // Formatting
                                        />
                                    )}

                                    {(needsPassword || (joinRoomId && roomList.find(r => r.name.toUpperCase() === joinRoomId.toUpperCase())?.isPrivate)) && !isLinkJoin && ( // Show password field if needed
                                        <div className="relative animate-in slide-in-from-top-2 duration-200"> // Animation wrapper
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" /> // Icon
                                            <input // Password input field
                                                type="password" // Hidden characters
                                                placeholder="Access Password" // Placeholder
                                                value={joinPassword} // State binding
                                                onChange={(e) => setJoinPassword(e.target.value)} // Change handler
                                                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50" // Stylistic classes
                                                autoFocus // Focus automatically for convenience
                                            />
                                        </div>
                                    )}
                                    <button // Primary action button for joining
                                        onClick={() => connectRoom()} // Call join function
                                        className="w-full py-3 bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-800 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]" // Neo-brutalism design style
                                    >
                                        {needsPassword ? 'Authorize' : 'Connect'} // Dynamic label based on state
                                    </button>
                                </div>
                            </div>

                            {/* Create Section */}
                            <div className="border-2 border-black p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white"> // Container for room initialization
                                <h2 className="text-[10px] font-black uppercase tracking-wider border-b-2 border-black pb-2">3. Initialize New</h2> // Section title
                                <div className="space-y-4"> // Column layout for inputs
                                    <input // Name input for new room
                                        type="text" // Text type
                                        placeholder="New Room Name" // Placeholder
                                        value={createRoomName} // Controlled value
                                        onChange={(e) => setCreateRoomName(e.target.value)} // Update state
                                        className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50 font-bold uppercase" // Styles
                                    />
                                    <div className="flex gap-2 text-[10px]"> // Toggle buttons for privacy
                                        <button // Button for Public choice
                                            onClick={() => setIsPrivate(false)} // Set state to public
                                            className={`flex-1 py-3 border-2 border-black font-black uppercase transition-all ${!isPrivate ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`} // Conditional styling
                                        >
                                            Public
                                        </button>
                                        <button // Button for Private choice
                                            onClick={() => setIsPrivate(true)} // Set state to private
                                            className={`flex-1 py-3 border-2 border-black font-black uppercase transition-all ${isPrivate ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`} // Conditional styling
                                        >
                                            Private
                                        </button>
                                    </div>
                                    {isPrivate && ( // Password field if private is selected
                                        <div className="animate-in slide-in-from-top-2 duration-200"> // Entry animation
                                            <input // Password input for creation
                                                type="password" // Hidden text
                                                placeholder="Access Password" // Placeholder
                                                value={createPassword} // State binding
                                                onChange={(e) => setCreatePassword(e.target.value)} // Change handler
                                                className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50 italic" // Formatting
                                            />
                                        </div>
                                    )}
                                    <button // Button to finalize room creation
                                        onClick={createRoom} // Execution handler
                                        className="w-full py-3 bg-white text-black border-2 border-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-100 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" // Designer styling
                                    >
                                        Initialize
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Room List Section */}
                        <div className="border-2 border-black p-6 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white h-full min-h-[400px]"> // Section showing live rooms
                            <h2 className="text-[10px] font-black uppercase tracking-wider border-b-2 border-black pb-2">Live Nodes</h2> // List header
                            {roomList.length === 0 ? ( // Display when no rooms are active
                                <div className="flex flex-col items-center justify-center py-20 text-gray-300 space-y-4"> // Empty state wrapper
                                    <Globe className="w-12 h-12" /> // Visual indicator
                                    <p className="text-[8px] font-black uppercase tracking-widest text-center px-4">Observation: No active nodes detected.</p> // Empty message
                                </div>
                            ) : ( // Display if rooms are available
                                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar"> // Scrollable list container
                                    {roomList.map(r => ( // Map through list items
                                        <div key={r.name} className="border-2 border-black p-4 space-y-4 hover:bg-gray-50 transition-colors bg-white group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"> // Room item card
                                            <div className="flex justify-between items-start"> // Card layout
                                                <div className="space-y-1"> // Room info group
                                                    <p className="font-bold text-[10px] uppercase tracking-tighter">{r.name}</p> // Display room name
                                                    <div className="flex items-center gap-2"> // Status indicators
                                                        <span className={`text-[8px] px-1.5 py-0.5 border border-black font-black uppercase ${r.isPrivate ? 'bg-gray-100 text-black' : 'bg-black text-white'}`}> // Privacy tag
                                                            {r.isPrivate ? 'Locked' : 'Open'} // Privacy label
                                                        </span>
                                                        <span className="text-[8px] font-bold uppercase text-gray-500 italic"> // Game status text
                                                            {r.status} // Current state label
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right"> // Occupancy display
                                                    <p className="text-[10px] font-black uppercase">{r.players}/2</p> // Ratio of players
                                                </div>
                                            </div>
                                            <button // Action button on each room card
                                                disabled={r.players >= 2} // Disable if room is full
                                                onClick={() => { // Click handler with logic
                                                    if (!r.isPrivate) { // Direct join for public rooms
                                                        connectRoom(r.name); // Execute join
                                                    } else { // Password flow for private rooms
                                                        setJoinRoomId(r.name); // Set target room
                                                        setNeedsPassword(true); // Show password field
                                                        setError(''); // Reset errors
                                                    }
                                                }}
                                                className="w-full py-2 bg-black text-white border border-black text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:bg-gray-800" // Button styling
                                            >
                                                {r.players >= 2 ? 'Full' : 'Join'} // Button text based on capacity
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentPlayer = room?.players[room.currentPlayerIndex]; // Computed variable for current player's data
    const isMyTurn = currentPlayer?.id === socket?.id; // Boolean flag checking if it is the local user's turn

    return ( // Return the active game UI once joined
        <div className="min-h-screen bg-white flex items-center justify-center p-4 text-black font-sans text-[12px]"> // Full-screen centered layout
            <div className="max-w-2xl w-full flex flex-col items-center space-y-8"> // Content container with responsive constraints
                <div className="w-full flex justify-between items-center bg-white border-2 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"> // Top bar for room info
                    <div className="space-y-1"> // Text info group
                        <h2 className="text-lg font-bold uppercase tracking-wider">Node: <span className="font-mono">{room?.name}</span></h2> // Room name with mono font
                        <p className="text-[10px] text-gray-500 flex items-center gap-2 uppercase font-bold"> // Status subtitle
                           {room?.isPrivate ? <Lock className="w-3 h-3"/> : <Globe className="w-3 h-3"/>} // Privacy icon
                           {room?.isPrivate ? 'Protected' : 'Standard'} Connection // Privacy description
                        </p>
                    </div>
                    <button // Utility button for sharing room link
                        onClick={copyLink} // Click handler
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors" // Style definitions
                    >
                        <Share2 className="w-3 h-3" /> Share // Icon and label
                    </button>
                </div>

                <div className="w-full flex items-center gap-4"> // Visual divider section
                    <div className="h-[2px] flex-1 bg-black"></div> // Left line
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Match Tally</span> // Divider label
                    <div className="h-[2px] flex-1 bg-black"></div> // Right line
                </div>

                <div className="grid grid-cols-2 gap-4 w-full"> // Tally/Scoreboard grid
                    {room?.players.map((p, i) => ( // Loop through room participants
                        <div key={p.id} className={`p-4 border-2 border-black transition-all ${room.currentPlayerIndex === i ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]' : 'bg-white text-black'}`}> // Scorecard with active state
                            <div className="flex items-center justify-between"> // Inner layout
                                <div className="flex flex-col"> // Name and score group
                                    <span className="font-bold text-[10px] uppercase truncate pr-2">{p.name} {p.id === socket?.id && '(You)'}</span> // Name with ID verification
                                    <span className="text-[8px] font-black italic uppercase opacity-50">Wins: {room.scores[p.id] || 0}</span> // Displayed win count
                                </div>
                                <span className="text-xl font-bold font-mono">{p.symbol}</span> // Player's assigned symbol (X/O)
                            </div>
                        </div>
                    ))}
                    {room?.players.length === 1 && ( // Display empty slot for missing player
                        <div className="p-4 border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-[10px] font-bold uppercase"> // Waiting state box
                            Waiting for Peer... // Visual text
                        </div>
                    )}
                </div>

                <div className="relative"> // Game board positioning wrapper
                    <div className="grid grid-cols-3 gap-0 border-4 border-black bg-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"> // 3x3 Grid container
                        {room?.board.map((cell, i) => ( // Loop through 9 board squares
                            <button // Individual square component
                                key={i} // Unique index key
                                onClick={() => makeMove(i)} // Interaction handler for a move
                                disabled={!!cell || !isMyTurn || room.status !== 'playing'} // Logical disabling of inputs
                                className={`w-24 h-24 sm:w-32 sm:h-32 bg-white flex items-center justify-center text-5xl sm:text-6xl font-black font-mono focus:outline-none highlight-none
                                    ${!cell && isMyTurn && room.status === 'playing' ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'} // Hover state logic
                                    ${i % 3 !== 2 ? 'border-r-2 border-black' : ''} // Vertical grid lines
                                    ${i < 6 ? 'border-b-2 border-black' : ''} // Horizontal grid lines
                                `}
                            >
                                {cell} // Display X, O or empty
                            </button>
                        ))}
                    </div>

                    {room?.status === 'ended' && ( // Overlay for game conclusion
                        <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-white/95 flex flex-col items-center justify-center p-6 text-center border-4 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] z-20"> // Final result modal
                             <h3 className="text-5xl font-black uppercase mb-6 tracking-tighter"> // Result header
                                {room.winner === 'Draw' ? "Draw" : `${room.winner} Wins`} // Dynamic winner text
                             </h3>
                             <button // Button to restart or play again
                                onClick={resetGame} // Reset function handler
                                disabled={room.resetVotes.includes(socket?.id || '')} // Don't allow multiple votes from same player
                                className={`flex items-center gap-3 px-10 py-4 font-black uppercase tracking-[0.2em] transition-all shadow-[6px_6px_0px_0px_rgba(150,150,150,1)] ${
                                    room.resetVotes.includes(socket?.id || '') 
                                    ? 'bg-gray-200 text-gray-500 cursor-default' 
                                    : 'bg-black text-white hover:bg-gray-800'
                                }`}
                             >
                                <RefreshCw className={`w-5 h-5 ${room.resetVotes.includes(socket?.id || '') ? 'animate-spin' : ''}`}/> // Spinning refresh icon
                                {room.resetVotes.length > 0 // Dynamic button text
                                    ? (room.resetVotes.includes(socket?.id || '') ? 'Acknowledged' : 'Accept Re-link') 
                                    : 'Re-Link'
                                }
                             </button>
                             {room.resetVotes.length === 1 && ( // Conditional helper text during voting
                                <p className="mt-4 text-[8px] font-black uppercase text-gray-400 animate-pulse"> // Sub-status line
                                    {room.resetVotes.includes(socket?.id || '') 
                                        ? "Waiting for peer to accept..." 
                                        : "Peer wants to play again"} // Inform user about voting status
                                </p>
                             )}
                        </div>
                    )}
                </div>

                <div className="text-center h-10"> // Dynamic status footer
                    {room?.status === 'playing' && ( // Current turn announcement
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"> // Turn text styling
                             {isMyTurn ? "Your Sequence" : `Peer Sequence: ${currentPlayer?.name}`} // Local vs remote player indicator
                        </p>
                    )}
                    {room?.status === 'waiting' && ( // Waiting state indicator
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse italic">Scanning for Peers...</p> // Searching message
                    )}
                </div>
            </div>
        </div>
    );
}
