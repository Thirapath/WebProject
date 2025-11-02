// server.js - WebSocket Server สำหรับเกมบันไดงู
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { GameManager } = require('./game');

const app = express();
const server = http.createServer(app);

// เปิด CORS เพื่อให้เครื่องอื่นเชื่อมต่อได้
app.use(cors());
app.use(express.json());

const io = socketIo(server, {
  cors: {
    origin: "*", // อนุญาตให้ทุก origin เชื่อมต่อได้
    methods: ["GET", "POST"]
  }
});

// สร้าง GameManager สำหรับจัดการห้องเกม
const gameManager = new GameManager();

io.on('connection', (socket) => {
  console.log(`🎮 ผู้เล่นใหม่เชื่อมต่อ: ${socket.id}`);
  
  // สร้างหรือเข้าร่วมห้อง
  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;
    
    const room = gameManager.getOrCreateRoom(roomId);
    const result = room.addPlayer(socket.id, playerName);
    
    if (!result.success) {
      if (result.error === 'ห้องเต็มแล้ว') {
        socket.emit('room-full', { message: result.error });
      } else if (result.error === 'เกมเริ่มแล้ว') {
        socket.emit('game-already-started', { message: result.error });
      }
      return;
    }
    
    socket.join(roomId);
    
    // ส่งข้อมูลห้องให้ทุกคนในห้อง
    const roomState = room.getRoomState();
    io.to(roomId).emit('room-update', {
      players: roomState.players,
      currentPlayerIndex: roomState.currentPlayerIndex,
      gameStarted: roomState.gameStarted
    });
    
    console.log(`👤 ${playerName} เข้าร่วมห้อง ${roomId}`);
  });
  
  // เริ่มเกม
  socket.on('start-game', () => {
    const room = gameManager.getRoomBySocketId(socket.id);
    if (!room) return;
    
    const result = room.startGame();
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    const roomState = room.getRoomState();
    io.to(room.roomId).emit('game-started', {
      players: roomState.players,
      currentPlayerIndex: roomState.currentPlayerIndex,
      snakesAndLadders: roomState.snakesAndLadders,
      skillCardSpots: roomState.skillCardSpots
    });
    
    console.log(`🎲 เกมในห้อง ${room.roomId} เริ่มแล้ว`);
  });
  
  // ทอยลูกเต้า
  socket.on('roll-dice', (data = {}) => {
    const room = gameManager.getRoomBySocketId(socket.id);
    if (!room) return;
    
    const { useSkill } = data;
    const result = room.processDiceRoll(socket.id, useSkill);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    // ส่งผลการทอยไปยังทุกคนในห้อง
    io.to(room.roomId).emit('dice-rolled', {
      playerIndex: result.playerIndex,
      playerName: result.playerName,
      dice1: result.dice1,
      dice2: result.dice2,
      diceValue: result.diceValue,
      oldPosition: result.oldPosition,
      newPosition: result.newPosition,
      hitSnake: result.hitSnake,
      shieldUsed: result.shieldUsed,
      usedSkill: result.usedSkill,
      gotSkillCard: result.gotSkillCard,
      replacedCard: result.replacedCard,
      extraTurn: result.extraTurn,
      players: result.players
    });
    
    // เช็คว่าชนะหรือยัง
    if (result.gameFinished) {
      io.to(room.roomId).emit('game-finished', {
        winner: result.winner
      });
      console.log(`🏆 ${result.winner.name} ชนะในห้อง ${room.roomId}!`);
    } else {
      // เปลี่ยนตาผู้เล่น
      io.to(room.roomId).emit('turn-changed', {
        currentPlayerIndex: result.nextPlayerIndex,
        currentPlayerName: result.nextPlayerName
      });
    }
  });
  
  // รีเซ็ตเกม
  socket.on('reset-game', () => {
    const room = gameManager.getRoomBySocketId(socket.id);
    if (!room) return;
    
    const result = room.resetGame();
    const roomState = room.getRoomState();
    
    io.to(room.roomId).emit('game-reset', {
      players: result.players,
      currentPlayerIndex: result.currentPlayerIndex,
      snakesAndLadders: roomState.snakesAndLadders,
      skillCardSpots: roomState.skillCardSpots
    });
    
    console.log(`🔄 เกมในห้อง ${room.roomId} ถูกรีเซ็ต`);
  });
  
  // ออกจากห้อง
  socket.on('disconnect', () => {
    const room = gameManager.getRoomBySocketId(socket.id);
    if (!room) return;
    
    const result = room.removePlayer(socket.id);
    if (!result.success) return;
    
    console.log(`👋 ${result.playerName} ออกจากห้อง ${room.roomId}`);
    
    // ถ้าไม่มีผู้เล่นเหลือ ลบห้อง
    if (gameManager.deleteRoomIfEmpty(room.roomId)) {
      console.log(`🗑️  ห้อง ${room.roomId} ถูกลบ`);
    } else {
      // แจ้งผู้เล่นคนอื่นว่ามีคนออก
      const roomState = room.getRoomState();
      io.to(room.roomId).emit('player-left', {
        playerName: result.playerName,
        players: roomState.players,
        currentPlayerIndex: roomState.currentPlayerIndex
      });
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎲 Server กำลังทำงานที่พอร์ต ${PORT}`);
  console.log(`📡 เชื่อมต่อได้ที่: http://localhost:${PORT}`);
});