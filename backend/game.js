// game.js - Game Logic สำหรับเกมบันไดงู

// ประเภทของ Skill Cards
const SKILL_TYPES = {
  EVEN_DICE: 'even_dice',        // การันตีทอยได้แต้มคู่
  ODD_DICE: 'odd_dice',          // การันตีทอยได้แต้มคี่
  EXTRA_TURN: 'extra_turn',      // เล่นได้อีก 1 ตา
  SNAKE_SHIELD: 'snake_shield'   // ป้องกันงู 1 ครั้ง
};

const SKILL_CARDS = [
  { 
    type: SKILL_TYPES.EVEN_DICE, 
    name: 'แต้มคู่', 
    description: 'การันตีทอยได้แต้มคู่ (2,4,6,8,10,12)',
    icon: '🎲'
  },
  { 
    type: SKILL_TYPES.ODD_DICE, 
    name: 'แต้มคี่', 
    description: 'การันตีทอยได้แต้มคี่ (3,5,7,9,11)',
    icon: '🎯'
  },
  { 
    type: SKILL_TYPES.EXTRA_TURN, 
    name: 'ตาพิเศษ', 
    description: 'เล่นได้อีก 1 ตา',
    icon: '⭐'
  },
  { 
    type: SKILL_TYPES.SNAKE_SHIELD, 
    name: 'โล่งู', 
    description: 'ป้องกันงู 1 ครั้ง',
    icon: '🛡️'
  }
];

// ฟังก์ชันสุ่มตำแหน่งบันไดและงู
function generateSnakesAndLadders(boardSize = 100, numLadders = 8, numSnakes = 8) {
  const ladders = {};
  const snakes = {};
  const usedPositions = new Set([1, boardSize]); // ไม่ให้ใช้ช่องเริ่มต้นและเส้นชัย

  // สร้างบันได
  let laddersCreated = 0;
  let attempts = 0;
  while (laddersCreated < numLadders && attempts < 1000) {
    attempts++;
    
    // บันไดเริ่มที่ช่อง 2 ถึง 85
    const start = Math.floor(Math.random() * 84) + 2;
    if (usedPositions.has(start)) continue;
    
    // บันไดขึ้นอย่างน้อย 5 ช่อง แต่ไม่เกินเส้นชัย
    const minJump = 5;
    const maxJump = Math.min(50, boardSize - start - 1);
    if (maxJump < minJump) continue;
    
    const end = start + Math.floor(Math.random() * (maxJump - minJump + 1)) + minJump;
    if (usedPositions.has(end) || end >= boardSize) continue;
    
    ladders[start] = end;
    usedPositions.add(start);
    usedPositions.add(end);
    laddersCreated++;
  }

  // สร้างงู
  let snakesCreated = 0;
  attempts = 0;
  while (snakesCreated < numSnakes && attempts < 1000) {
    attempts++;
    
    // งูเริ่มที่ช่อง 15 ถึง 98
    const start = Math.floor(Math.random() * 84) + 15;
    if (usedPositions.has(start)) continue;
    
    // งูลงอย่างน้อย 5 ช่อง
    const minJump = 5;
    const maxJump = Math.min(50, start - 2);
    if (maxJump < minJump) continue;
    
    const end = start - Math.floor(Math.random() * (maxJump - minJump + 1)) - minJump;
    if (usedPositions.has(end) || end < 2) continue;
    
    snakes[start] = end;
    usedPositions.add(start);
    usedPositions.add(end);
    snakesCreated++;
  }

  return { ladders, snakes };
}

// ฟังก์ชันสุ่มตำแหน่ง Skill Card Spots
function generateSkillCardSpots(boardSize = 100, numSpots = 6, usedPositions = new Set()) {
  const skillSpots = [];
  let spotsCreated = 0;
  let attempts = 0;

  while (spotsCreated < numSpots && attempts < 1000) {
    attempts++;
    
    // ช่อง skill card อยู่ที่ช่อง 10 ถึง 90
    const position = Math.floor(Math.random() * 81) + 10;
    
    // เช็คว่าไม่ซ้ำกับตำแหน่งที่ใช้แล้ว
    if (usedPositions.has(position)) continue;
    
    skillSpots.push(position);
    usedPositions.add(position);
    spotsCreated++;
  }

  return skillSpots;
}

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameStarted = false;
    this.gameFinished = false;
    this.winner = null;
    this.maxPlayers = 4;
    this.winningPosition = 100; // เปลี่ยนเป็น 100 ช่อง
    this.snakesAndLadders = null; // จะถูกสร้างตอน start game
    this.skillCardSpots = null; // ตำแหน่งช่อง skill card
  }

  // เพิ่มผู้เล่นเข้าห้อง
  addPlayer(socketId, playerName) {
    if (this.players.length >= this.maxPlayers) {
      return { success: false, error: 'ห้องเต็มแล้ว' };
    }

    if (this.gameStarted) {
      return { success: false, error: 'เกมเริ่มแล้ว' };
    }

    const playerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
    const player = {
      id: socketId,
      name: playerName,
      position: 0,
      color: playerColors[this.players.length],
      skillCard: null, // เก็บ skill card ได้ 1 ใบ
      activeShield: false // สถานะโล่งูที่ใช้งานอยู่
    };

    this.players.push(player);
    return { success: true, player, playerIndex: this.players.length - 1 };
  }

  // ลบผู้เล่นออกจากห้อง
  removePlayer(socketId) {
    const playerIndex = this.players.findIndex(p => p.id === socketId);
    if (playerIndex === -1) return { success: false };

    const playerName = this.players[playerIndex].name;
    this.players.splice(playerIndex, 1);

    // ปรับ currentPlayerIndex ถ้าจำเป็น
    if (this.currentPlayerIndex >= this.players.length && this.players.length > 0) {
      this.currentPlayerIndex = 0;
    }

    return { success: true, playerName, remainingPlayers: this.players.length };
  }

  // เริ่มเกม
  startGame() {
    if (this.players.length < 2) {
      return { success: false, error: 'ต้องมีผู้เล่นอย่างน้อย 2 คน' };
    }

    // สุ่มตำแหน่งงูและบันไดใหม่ทุกครั้ง (10 บันได, 10 งู สำหรับกระดาน 100 ช่อง)
    this.snakesAndLadders = generateSnakesAndLadders(this.winningPosition, 10, 12);
    
    // สุ่มตำแหน่ง skill card spots (6 ช่อง)
    const usedPositions = new Set([
      1, 
      this.winningPosition,
      ...Object.keys(this.snakesAndLadders.ladders).map(Number),
      ...Object.keys(this.snakesAndLadders.snakes).map(Number)
    ]);
    this.skillCardSpots = generateSkillCardSpots(this.winningPosition, 15, usedPositions);
    
    this.gameStarted = true;
    this.currentPlayerIndex = 0;
    this.gameFinished = false;
    this.winner = null;

    return { success: true };
  }

  // สุ่มลูกเต้า 2 ลูก
  rollDice(skillType = null) {
    let dice1 = Math.floor(Math.random() * 6) + 1;
    let dice2 = Math.floor(Math.random() * 6) + 1;
    let total = dice1 + dice2;

    // ถ้าใช้ skill card แต้มคู่หรือคี่
    if (skillType === SKILL_TYPES.EVEN_DICE) {
      // ทอยใหม่จนได้แต้มคู่
      while (total % 2 !== 0) {
        dice1 = Math.floor(Math.random() * 6) + 1;
        dice2 = Math.floor(Math.random() * 6) + 1;
        total = dice1 + dice2;
      }
    } else if (skillType === SKILL_TYPES.ODD_DICE) {
      // ทอยใหม่จนได้แต้มคี่
      while (total % 2 === 0) {
        dice1 = Math.floor(Math.random() * 6) + 1;
        dice2 = Math.floor(Math.random() * 6) + 1;
        total = dice1 + dice2;
      }
    }

    return { dice1, dice2, total };
  }

  // คำนวณตำแหน่งใหม่
  calculateNewPosition(currentPosition, diceValue, hasShield = false) {
    let newPosition = currentPosition + diceValue;

    // ถ้าเกินตำแหน่งชนะ ให้ไปเส้นชัยเลย
    if (newPosition >= this.winningPosition) {
      return { position: this.winningPosition, hitSnake: false };
    }

    // เช็คบันได
    if (this.snakesAndLadders && this.snakesAndLadders.ladders[newPosition] !== undefined) {
      return { position: this.snakesAndLadders.ladders[newPosition], hitSnake: false };
    }

    // เช็คงู
    if (this.snakesAndLadders && this.snakesAndLadders.snakes[newPosition] !== undefined) {
      // ถ้ามีโล่ ไม่โดนงู
      if (hasShield) {
        return { position: newPosition, hitSnake: true, shieldUsed: true };
      }
      return { position: this.snakesAndLadders.snakes[newPosition], hitSnake: true };
    }

    return { position: newPosition, hitSnake: false };
  }

  // ประมวลผลการทอยลูกเต้า
  processDiceRoll(socketId, useSkill = false) {
    const playerIndex = this.players.findIndex(p => p.id === socketId);
    
    if (playerIndex === -1) {
      return { success: false, error: 'ไม่พบผู้เล่น' };
    }

    if (!this.gameStarted || this.gameFinished) {
      return { success: false, error: 'เกมไม่ได้เริ่มหรือจบแล้ว' };
    }

    if (this.currentPlayerIndex !== playerIndex) {
      return { success: false, error: 'ยังไม่ถึงตาของคุณ' };
    }

    const currentPlayer = this.players[playerIndex];
    let skillType = null;
    let usedSkill = null;

    // เช็คว่าใช้ skill card หรือไม่
    if (useSkill && currentPlayer.skillCard) {
      skillType = currentPlayer.skillCard.type;
      usedSkill = { ...currentPlayer.skillCard };
      
      // ถ้าเป็น snake shield ให้เปิดใช้งาน
      if (skillType === SKILL_TYPES.SNAKE_SHIELD) {
        currentPlayer.activeShield = true;
      }
      
      // ลบ skill card ออก (ยกเว้น extra turn ที่จะลบหลังทอย)
      if (skillType !== SKILL_TYPES.EXTRA_TURN) {
        currentPlayer.skillCard = null;
      }
    }

    // ทอยลูกเต้า (ถ้าใช้ even/odd dice จะทอยตาม skill)
    const diceResult = this.rollDice(skillType);
    const oldPosition = currentPlayer.position;
    
    // คำนวณตำแหน่งใหม่ (ถ้ามี shield จะส่งไปด้วย)
    const positionResult = this.calculateNewPosition(
      oldPosition, 
      diceResult.total, 
      currentPlayer.activeShield
    );

    currentPlayer.position = positionResult.position;

    // ถ้าใช้ shield และโดนงู ให้ปิด shield
    if (positionResult.shieldUsed) {
      currentPlayer.activeShield = false;
    }

    const result = {
      success: true,
      playerIndex,
      playerName: currentPlayer.name,
      dice1: diceResult.dice1,
      dice2: diceResult.dice2,
      diceValue: diceResult.total,
      oldPosition,
      newPosition: positionResult.position,
      hitSnake: positionResult.hitSnake,
      shieldUsed: positionResult.shieldUsed || false,
      usedSkill,
      players: this.players
    };

    // เช็คว่าตกช่อง skill card หรือไม่
    if (this.skillCardSpots && this.skillCardSpots.includes(positionResult.position)) {
      const randomCard = SKILL_CARDS[Math.floor(Math.random() * SKILL_CARDS.length)];
      const oldCard = currentPlayer.skillCard;
      currentPlayer.skillCard = { ...randomCard };
      result.gotSkillCard = randomCard;
      result.replacedCard = oldCard;
    }

    // เช็คว่าชนะหรือยัง
    if (positionResult.position === this.winningPosition) {
      this.gameFinished = true;
      this.winner = currentPlayer;
      result.gameFinished = true;
      result.winner = currentPlayer;
    } else {
      // เช็คว่าใช้ extra turn หรือไม่
      let hasExtraTurn = false;
      if (skillType === SKILL_TYPES.EXTRA_TURN) {
        hasExtraTurn = true;
        currentPlayer.skillCard = null; // ลบการ์ด extra turn หลังใช้
        result.extraTurn = true;
      }

      // ถ้าไม่มี extra turn ให้เปลี่ยนตา
      if (!hasExtraTurn) {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        result.nextPlayerIndex = this.currentPlayerIndex;
        result.nextPlayerName = this.players[this.currentPlayerIndex].name;
      } else {
        result.nextPlayerIndex = this.currentPlayerIndex;
        result.nextPlayerName = currentPlayer.name;
      }
    }

    return result;
    return result;
  }

  // รีเซ็ตเกม
  resetGame() {
    // สุ่มตำแหน่งงูและบันไดใหม่ทุกครั้ง (10 บันได, 10 งู)
    this.snakesAndLadders = generateSnakesAndLadders(this.winningPosition, 10, 12);
    
    // สุ่มตำแหน่ง skill card spots ใหม่
    const usedPositions = new Set([
      1, 
      this.winningPosition,
      ...Object.keys(this.snakesAndLadders.ladders).map(Number),
      ...Object.keys(this.snakesAndLadders.snakes).map(Number)
    ]);
    this.skillCardSpots = generateSkillCardSpots(this.winningPosition, 15, usedPositions);
    
    this.players.forEach(player => {
      player.position = 0;
      player.skillCard = null;
      player.activeShield = false;
    });

    this.currentPlayerIndex = 0;
    this.gameStarted = true;
    this.gameFinished = false;
    this.winner = null;

    return {
      success: true,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex
    };
  }

  // ดึงข้อมูลสถานะห้อง
  getRoomState() {
    return {
      roomId: this.roomId,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      gameStarted: this.gameStarted,
      gameFinished: this.gameFinished,
      winner: this.winner,
      snakesAndLadders: this.snakesAndLadders,
      skillCardSpots: this.skillCardSpots
    };
  }
}

class GameManager {
  constructor() {
    this.rooms = new Map();
  }

  // สร้างหรือดึงห้อง
  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new GameRoom(roomId));
    }
    return this.rooms.get(roomId);
  }

  // ลบห้องที่ว่าง
  deleteRoomIfEmpty(roomId) {
    const room = this.rooms.get(roomId);
    if (room && room.players.length === 0) {
      this.rooms.delete(roomId);
      return true;
    }
    return false;
  }

  // ดึงห้องจาก socket id
  getRoomBySocketId(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === socketId)) {
        return room;
      }
    }
    return null;
  }
}

module.exports = { GameManager, generateSnakesAndLadders, SKILL_TYPES, SKILL_CARDS };