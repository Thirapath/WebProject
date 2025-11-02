import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import GameBoard from './components/GameBoard';
import PlayerList from './components/PlayerList';
import GameControls from './components/GameControls';
import JoinRoom from './components/JoinRoom';

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastDiceRoll, setLastDiceRoll] = useState(null);
  const [snakesAndLadders, setSnakesAndLadders] = useState({ ladders: {}, snakes: {} });
  const [skillCardSpots, setSkillCardSpots] = useState([]);
  const [message, setMessage] = useState('');
  const socketRef = useRef(null);

  // สร้าง Audio objects สำหรับเสียง (จำกัดเวลาเล่น 1 วินาที)
  const ladderSoundRef = useRef(null);
  const snakeSoundRef = useRef(null);

  useEffect(() => {
    // สร้าง Audio objects
    ladderSoundRef.current = new Audio('/sounds/ladder.mp3');
    snakeSoundRef.current = new Audio('/sounds/snake.mp3');

    const SOCKET_URL = 'https://webproject-5zvl.onrender.com';
    console.log('🔌 กำลังเชื่อมต่อกับ:', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ เชื่อมต่อ server สำเร็จ! Socket ID:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ ไม่สามารถเชื่อมต่อ server:', error.message);
    });

    newSocket.on('disconnect', () => {
      console.log('⚠️ ตัดการเชื่อมต่อจาก server');
    });

    newSocket.on('room-update', (data) => {
      console.log('🔥 รับข้อมูลห้อง:', data);
      setPlayers(data.players);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setGameStarted(data.gameStarted);
      setMessage('');
    });

    newSocket.on('game-started', (data) => {
      console.log('🎮 เกมเริ่มแล้ว!');
      console.log('📍 Skill Card Spots:', data.skillCardSpots);
      setPlayers(data.players);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setSnakesAndLadders(data.snakesAndLadders);
      setSkillCardSpots(data.skillCardSpots || []);
      setGameStarted(true);
      setGameFinished(false);
      setWinner(null);
      setMessage('🎮 เกมเริ่มแล้ว!');
    });

    newSocket.on('dice-rolled', (data) => {
      console.log('🎲 Dice rolled:', data);
      setPlayers(data.players);
      setLastDiceRoll({
        playerName: data.playerName,
        dice1: data.dice1,
        dice2: data.dice2,
        diceValue: data.diceValue,
        oldPosition: data.oldPosition,
        newPosition: data.newPosition
      });

      let msg = `🎲 ${data.playerName} ทอยได้ ${data.dice1} + ${data.dice2} = ${data.diceValue}`;

      // เพิ่มข้อความตามสถานการณ์
      if (data.usedSkill) {
        msg += ` ✨ (ใช้สกิล: ${data.usedSkill.name})`;
      }

      // ตรวจสอบว่าโดนงู/ขึ้นบันได/ใช้โล่ และเล่นเสียง
      if (data.shieldUsed) {
        msg += ` 🛡️ โล่ป้องกันงู!`;
      } else if (data.newPosition > data.oldPosition + data.diceValue) {
        // ขึ้นบันได - เล่นเสียง
        const ladderEnd = data.newPosition;
        msg += ` 🪜 ขึ้นบันได! (ช่อง ${data.oldPosition + data.diceValue} → ${ladderEnd})`;
        
        // เล่นเสียงบันได (จำกัด 1 วินาที)
        if (ladderSoundRef.current) {
          ladderSoundRef.current.currentTime = 0;
          ladderSoundRef.current.play().catch(err => console.log('Ladder sound error:', err));
          setTimeout(() => {
            ladderSoundRef.current.pause();
            ladderSoundRef.current.currentTime = 0;
          }, 1000);
        }
      } else if (data.newPosition < data.oldPosition + data.diceValue) {
        // โดนงู - เล่นเสียง
        const snakeStart = data.oldPosition + data.diceValue;
        msg += ` 🐍 โดนงูกัด! (ช่อง ${snakeStart} → ${data.newPosition})`;
        
        // เล่นเสียงงู (จำกัด 1 วินาที)
        if (snakeSoundRef.current) {
          snakeSoundRef.current.currentTime = 0;
          snakeSoundRef.current.play().catch(err => console.log('Snake sound error:', err));
          setTimeout(() => {
            snakeSoundRef.current.pause();
            snakeSoundRef.current.currentTime = 0;
          }, 1000);
        }
      }

      if (data.gotSkillCard) {
        msg += ` ⭐ ได้ไพ่สกิล: ${data.gotSkillCard.name}!`;
        if (data.replacedCard) {
          msg += ` (แทน ${data.replacedCard.name})`;
        }
      }

      if (data.extraTurn) {
        msg += ` 🎯 ได้เล่นอีก 1 ตา!`;
      }

      setMessage(msg);
    });

    newSocket.on('turn-changed', (data) => {
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setTimeout(() => {
        setMessage(`🎯 ตาของ ${data.currentPlayerName}`);
      }, 3500);
    });

    newSocket.on('game-finished', (data) => {
      setGameFinished(true);
      setWinner(data.winner);
      setMessage(`🏆 ${data.winner.name} ชนะ!`);
    });

    newSocket.on('game-reset', (data) => {
      console.log('🔄 เกมรีเซ็ต');
      setPlayers(data.players);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setSnakesAndLadders(data.snakesAndLadders);
      setSkillCardSpots(data.skillCardSpots || []);
      setGameStarted(true);
      setGameFinished(false);
      setWinner(null);
      setLastDiceRoll(null);
      setMessage('🔄 เกมเริ่มใหม่!');
    });

    newSocket.on('player-left', (data) => {
      setPlayers(data.players);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setMessage(`👋 ${data.playerName} ออกจากเกม`);
    });

    newSocket.on('room-full', (data) => {
      alert(data.message);
      setIsConnected(false);
    });

    newSocket.on('game-already-started', (data) => {
      alert(data.message);
      setIsConnected(false);
    });

    newSocket.on('error', (data) => {
      console.error('❌ Server error:', data.message);
      setMessage(`❌ ${data.message}`);
    });

    return () => {
      console.log('🔌 ปิดการเชื่อมต่อ socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleJoinRoom = (room, name) => {
    setRoomId(room);
    setPlayerName(name);
    setIsConnected(true);
    socket.emit('join-room', { roomId: room, playerName: name });
  };

  const handleStartGame = () => {
    socket.emit('start-game');
  };

  const handleRollDice = () => {
    socket.emit('roll-dice');
  };

  const handleUseSkill = () => {
    socket.emit('roll-dice', { useSkill: true });
  };

  const handleResetGame = () => {
    socket.emit('reset-game');
  };

  if (!isConnected) {
    return <JoinRoom onJoinRoom={handleJoinRoom} />;
  }

  const myPlayer = players.find(p => p.id === socket?.id);
  const mySkillCard = myPlayer?.skillCard || null;
  const isMyTurn = players[currentPlayerIndex]?.id === socket?.id;

  return (
    <div className="App">
      <div className="game-container">
        <div className="left-panel">
          <PlayerList
            players={players}
            currentPlayerIndex={currentPlayerIndex}
            playerName={playerName}
            roomId={roomId}
            gameStarted={gameStarted}
          />

          {gameFinished && winner && (
            <div className="winner-announcement">
              <h2>🏆 ผู้ชนะ!</h2>
              <p className="winner-name">{winner.name}</p>
              <div
                className="winner-token"
                style={{ backgroundColor: winner.color }}
              >
                {winner.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        <div className="center-panel">
          <GameBoard
            players={players}
            snakesAndLadders={snakesAndLadders}
            skillCardSpots={skillCardSpots}
          />
        </div>

        <div className="right-panel">
          <GameControls
            gameStarted={gameStarted}
            gameFinished={gameFinished}
            isMyTurn={isMyTurn}
            onStartGame={handleStartGame}
            onRollDice={handleRollDice}
            onResetGame={handleResetGame}
            onUseSkill={handleUseSkill}
            lastDiceRoll={lastDiceRoll}
            mySkillCard={mySkillCard}
          />

          {message && (
            <div className="game-message">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;