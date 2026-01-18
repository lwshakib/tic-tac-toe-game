'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Lock, Globe, Share2, RefreshCw } from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface Player {
    id: string;
    name: string;
    symbol: 'X' | 'O';
}

interface Room {
    name: string;
    players: Player[];
    board: (string | null)[];
    currentPlayerIndex: number;
    isPrivate: boolean;
    status: 'waiting' | 'playing' | 'ended';
    winner: string | null;
    scores: Record<string, number>;
    resetVotes: string[];
}

interface RoomListItem {
    name: string;
    players: number;
    isPrivate: boolean;
    status: 'waiting' | 'playing' | 'ended';
}

export default function TicTacToe() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [playerName, setPlayerName] = useState('');
    
    // Join States
    const [joinRoomId, setJoinRoomId] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [needsPassword, setNeedsPassword] = useState(false);

    // Create States
    const [createRoomName, setCreateRoomName] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    
    const [room, setRoom] = useState<Room | null>(null);
    const [roomList, setRoomList] = useState<RoomListItem[]>([]);
    const [error, setError] = useState('');
    const [joined, setJoined] = useState(false);
    const [isLinkJoin, setIsLinkJoin] = useState(false);

    useEffect(() => {
        const s = io(SOCKET_URL);
        setSocket(s);

        s.on('room-list', (list: RoomListItem[]) => {
            setRoomList(list);
        });

        s.on('room-created', (roomData: Room) => {
            setRoom(roomData);
            setJoined(true);
        });

        s.on('room-updated', (roomData: Room) => {
            setRoom(roomData);
            setJoined(true);
            setError('');
        });

        s.on('error', (msg: string) => {
            setError(msg);
            if (msg === "Incorrect password" || msg === "Password required") {
                setNeedsPassword(true);
            }
        });

        const params = new URLSearchParams(window.location.search);
        const urlRoomId = params.get('room');
        if (urlRoomId) {
            setJoinRoomId(urlRoomId.toUpperCase());
            setIsLinkJoin(true);
        }

        return () => {
            s.disconnect();
        };
    }, []);

    const createRoom = () => {
        if (!playerName || !createRoomName) {
            setError('Missing Name or Room Name');
            return;
        }
        socket?.emit('create-room', { 
            roomName: createRoomName.toUpperCase(), 
            playerName, 
            isPrivate, 
            password: isPrivate ? createPassword : undefined
        });
    };

    const connectRoom = (roomIdOverride?: string) => {
        const targetId = (roomIdOverride || joinRoomId).toUpperCase();
        if (!playerName || !targetId) {
            setError('Missing Name or Room ID');
            return;
        }

        const targetRoom = roomList.find(r => r.name.toUpperCase() === targetId);
        if (targetRoom?.isPrivate && !joinPassword && !isLinkJoin) {
            setNeedsPassword(true);
            setError('Private Node: Authentication Required');
            return;
        }

        socket?.emit('join-room', { 
            roomId: targetId, 
            playerName, 
            password: joinPassword,
            isLinkJoin: isLinkJoin
        });
    };

    const makeMove = (index: number) => {
        if (!room) return;
        socket?.emit('make-move', { roomId: room.name, index });
    };

    const resetGame = () => {
        if (!room) return;
        socket?.emit('reset-game', room.name);
    };

    const copyLink = () => {
        const link = `${window.location.origin}/?room=${room?.name}`;
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };

    if (!joined) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans text-black text-[12px]">
                <div className="max-w-5xl w-full space-y-8">
                    <div className="text-center border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                        <h1 className="text-4xl font-black uppercase tracking-[0.2em]">Tic Tac Toe</h1>
                        <p className="text-gray-500 text-[10px] font-bold uppercase mt-2 tracking-widest italic">Multiplayer Grid Protocol</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Step 1: Persona */}
                        <div className="border-2 border-black p-6 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                            <h2 className="text-[10px] font-black uppercase tracking-wider border-b-2 border-black pb-2">1. Your Persona</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Handle / Alias</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="John Doe..."
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50 transition-all font-bold uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                            {error && (
                                <div className="p-3 bg-black text-white text-[10px] font-mono text-center border-2 border-black animate-pulse uppercase">
                                    Status: {error}
                                </div>
                            )}
                        </div>

                        {/* Connection Controls */}
                        <div className="space-y-8">
                            <div className="border-2 border-black p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                                <h2 className="text-[10px] font-black uppercase tracking-wider border-b-2 border-black pb-2">2. Connect To Room</h2>
                                <div className="space-y-3">
                                    {needsPassword ? (
                                        <div className="border-2 border-black p-3 bg-gray-50 flex items-center justify-between animate-in fade-in duration-300">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-3 h-3 text-gray-400" />
                                                <span className="font-bold uppercase text-[10px]">AUTH: {joinRoomId}</span>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setNeedsPassword(false);
                                                    setJoinRoomId('');
                                                    setJoinPassword('');
                                                    setError('');
                                                }}
                                                className="text-[8px] font-black uppercase hover:underline text-gray-400 hover:text-black"
                                            >
                                                Back
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Room ID"
                                            value={joinRoomId}
                                            onChange={(e) => {
                                                setJoinRoomId(e.target.value);
                                                setNeedsPassword(false);
                                            }}
                                            className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50 font-bold uppercase"
                                        />
                                    )}

                                    {(needsPassword || (joinRoomId && roomList.find(r => r.name.toUpperCase() === joinRoomId.toUpperCase())?.isPrivate)) && !isLinkJoin && (
                                        <div className="relative animate-in slide-in-from-top-2 duration-200">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
                                            <input
                                                type="password"
                                                placeholder="Access Password"
                                                value={joinPassword}
                                                onChange={(e) => setJoinPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50"
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => connectRoom()}
                                        className="w-full py-3 bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-800 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]"
                                    >
                                        {needsPassword ? 'Authorize' : 'Connect'}
                                    </button>
                                </div>
                            </div>

                            {/* Create Section */}
                            <div className="border-2 border-black p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
                                <h2 className="text-[10px] font-black uppercase tracking-wider border-b-2 border-black pb-2">3. Initialize New</h2>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="New Room Name"
                                        value={createRoomName}
                                        onChange={(e) => setCreateRoomName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50 font-bold uppercase"
                                    />
                                    <div className="flex gap-2 text-[10px]">
                                        <button
                                            onClick={() => setIsPrivate(false)}
                                            className={`flex-1 py-3 border-2 border-black font-black uppercase transition-all ${!isPrivate ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                                        >
                                            Public
                                        </button>
                                        <button
                                            onClick={() => setIsPrivate(true)}
                                            className={`flex-1 py-3 border-2 border-black font-black uppercase transition-all ${isPrivate ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                                        >
                                            Private
                                        </button>
                                    </div>
                                    {isPrivate && (
                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                            <input
                                                type="password"
                                                placeholder="Access Password"
                                                value={createPassword}
                                                onChange={(e) => setCreatePassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border-2 border-black focus:outline-none focus:bg-gray-50 italic"
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={createRoom}
                                        className="w-full py-3 bg-white text-black border-2 border-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-100 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        Initialize
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Room List Section */}
                        <div className="border-2 border-black p-6 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white h-full min-h-[400px]">
                            <h2 className="text-[10px] font-black uppercase tracking-wider border-b-2 border-black pb-2">Live Nodes</h2>
                            {roomList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-300 space-y-4">
                                    <Globe className="w-12 h-12" />
                                    <p className="text-[8px] font-black uppercase tracking-widest text-center px-4">Observation: No active nodes detected.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                    {roomList.map(r => (
                                        <div key={r.name} className="border-2 border-black p-4 space-y-4 hover:bg-gray-50 transition-colors bg-white group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-[10px] uppercase tracking-tighter">{r.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[8px] px-1.5 py-0.5 border border-black font-black uppercase ${r.isPrivate ? 'bg-gray-100 text-black' : 'bg-black text-white'}`}>
                                                            {r.isPrivate ? 'Locked' : 'Open'}
                                                        </span>
                                                        <span className="text-[8px] font-bold uppercase text-gray-500 italic">
                                                            {r.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase">{r.players}/2</p>
                                                </div>
                                            </div>
                                            <button
                                                disabled={r.players >= 2}
                                                onClick={() => {
                                                    if (!r.isPrivate) {
                                                        connectRoom(r.name);
                                                    } else {
                                                        setJoinRoomId(r.name);
                                                        setNeedsPassword(true);
                                                        setError('');
                                                    }
                                                }}
                                                className="w-full py-2 bg-black text-white border border-black text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:bg-gray-800"
                                            >
                                                {r.players >= 2 ? 'Full' : 'Join'}
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

    const currentPlayer = room?.players[room.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === socket?.id;

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 text-black font-sans text-[12px]">
            <div className="max-w-2xl w-full flex flex-col items-center space-y-8">
                <div className="w-full flex justify-between items-center bg-white border-2 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Node: <span className="font-mono">{room?.name}</span></h2>
                        <p className="text-[10px] text-gray-500 flex items-center gap-2 uppercase font-bold">
                           {room?.isPrivate ? <Lock className="w-3 h-3"/> : <Globe className="w-3 h-3"/>}
                           {room?.isPrivate ? 'Protected' : 'Standard'} Connection
                        </p>
                    </div>
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                    >
                        <Share2 className="w-3 h-3" /> Share
                    </button>
                </div>

                <div className="w-full flex items-center gap-4">
                    <div className="h-[2px] flex-1 bg-black"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Match Tally</span>
                    <div className="h-[2px] flex-1 bg-black"></div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    {room?.players.map((p, i) => (
                        <div key={p.id} className={`p-4 border-2 border-black transition-all ${room.currentPlayerIndex === i ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(150,150,150,1)]' : 'bg-white text-black'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-bold text-[10px] uppercase truncate pr-2">{p.name} {p.id === socket?.id && '(You)'}</span>
                                    <span className="text-[8px] font-black italic uppercase opacity-50">Wins: {room.scores[p.id] || 0}</span>
                                </div>
                                <span className="text-xl font-bold font-mono">{p.symbol}</span>
                            </div>
                        </div>
                    ))}
                    {room?.players.length === 1 && (
                        <div className="p-4 border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-[10px] font-bold uppercase">
                            Waiting for Peer...
                        </div>
                    )}
                </div>

                <div className="relative">
                    <div className="grid grid-cols-3 gap-0 border-4 border-black bg-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                        {room?.board.map((cell, i) => (
                            <button
                                key={i}
                                onClick={() => makeMove(i)}
                                disabled={!!cell || !isMyTurn || room.status !== 'playing'}
                                className={`w-24 h-24 sm:w-32 sm:h-32 bg-white flex items-center justify-center text-5xl sm:text-6xl font-black font-mono focus:outline-none highlight-none
                                    ${!cell && isMyTurn && room.status === 'playing' ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}
                                    ${i % 3 !== 2 ? 'border-r-2 border-black' : ''}
                                    ${i < 6 ? 'border-b-2 border-black' : ''}
                                `}
                            >
                                {cell}
                            </button>
                        ))}
                    </div>

                    {room?.status === 'ended' && (
                        <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-white/95 flex flex-col items-center justify-center p-6 text-center border-4 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] z-20">
                             <h3 className="text-5xl font-black uppercase mb-6 tracking-tighter">
                                {room.winner === 'Draw' ? "Draw" : `${room.winner} Wins`}
                             </h3>
                             <button
                                onClick={resetGame}
                                disabled={room.resetVotes.includes(socket?.id || '')}
                                className={`flex items-center gap-3 px-10 py-4 font-black uppercase tracking-[0.2em] transition-all shadow-[6px_6px_0px_0px_rgba(150,150,150,1)] ${
                                    room.resetVotes.includes(socket?.id || '') 
                                    ? 'bg-gray-200 text-gray-500 cursor-default' 
                                    : 'bg-black text-white hover:bg-gray-800'
                                }`}
                             >
                                <RefreshCw className={`w-5 h-5 ${room.resetVotes.includes(socket?.id || '') ? 'animate-spin' : ''}`}/> 
                                {room.resetVotes.length > 0 
                                    ? (room.resetVotes.includes(socket?.id || '') ? 'Acknowledged' : 'Accept Re-link') 
                                    : 'Re-Link'
                                }
                             </button>
                             {room.resetVotes.length === 1 && (
                                <p className="mt-4 text-[8px] font-black uppercase text-gray-400 animate-pulse">
                                    {room.resetVotes.includes(socket?.id || '') 
                                        ? "Waiting for peer to accept..." 
                                        : "Peer wants to play again"}
                                </p>
                             )}
                        </div>
                    )}
                </div>

                <div className="text-center h-10">
                    {room?.status === 'playing' && (
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                             {isMyTurn ? "Your Sequence" : `Peer Sequence: ${currentPlayer?.name}`}
                        </p>
                    )}
                    {room?.status === 'waiting' && (
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse italic">Scanning for Peers...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
