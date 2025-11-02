import React, { useState, useEffect } from 'react';
import './GameControls.css';

function GameControls({
  gameStarted,
  gameFinished,
  isMyTurn,
  onStartGame,
  onRollDice,
  onResetGame,
  lastDiceRoll,
  mySkillCard,
  onUseSkill
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice1, setDisplayDice1] = useState(1);
  const [displayDice2, setDisplayDice2] = useState(1);

  // ฟังก์ชันสุ่มเลขลูกเต๋า
  const getRandomDice = () => Math.floor(Math.random() * 6) + 1;

  const diceSound = new Audio('/sounds/dice.mp3');
  const handleDiceRoll = () => {
    diceSound.currentTime = 0; // เริ่มใหม่ทุกครั้ง
    diceSound.play().catch(err => console.log('Sound error:', err));
    onRollDice(); // เรียก prop ปกติ
  };

  // เมื่อได้ผลลัพธ์จริงจาก server
  useEffect(() => {
    if (lastDiceRoll && lastDiceRoll.dice1 && lastDiceRoll.dice2) {
      // เริ่มแอนิเมชั่นทอย
      setIsRolling(true);

      let rollCount = 0;
      const maxRolls = 15; // จำนวนครั้งที่สุ่ม
      const interval = 30; // ความเร็วในการเปลี่ยน (milliseconds)

      const rollingInterval = setInterval(() => {
        setDisplayDice1(getRandomDice());
        setDisplayDice2(getRandomDice());
        rollCount++;

        // หยุดและแสดงผลจริง
        if (rollCount >= maxRolls) {
          clearInterval(rollingInterval);
          setDisplayDice1(lastDiceRoll.dice1);
          setDisplayDice2(lastDiceRoll.dice2);
          setTimeout(() => setIsRolling(false), 200);
        }
      }, interval);

      return () => clearInterval(rollingInterval);
    }
  }, [lastDiceRoll]);

  // ฟังก์ชันแสดงจุดบนลูกเต้า
  const renderDiceDots = (value) => {
    const dots = [];
    const positions = {
      1: [[2, 2]],
      2: [[1, 1], [3, 3]],
      3: [[1, 1], [2, 2], [3, 3]],
      4: [[1, 1], [1, 3], [3, 1], [3, 3]],
      5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
      6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]]
    };

    (positions[value] || []).forEach(([row, col], idx) => {
      dots.push(
        <div
          key={idx}
          className="dot"
          style={{
            gridRow: row,
            gridColumn: col
          }}
        />
      );
    });

    return dots;
  };

  return (
    <div className="game-controls">
      <h3>🎮 การควบคุม</h3>

      {!gameStarted && (
        <button
          className="control-button start-button"
          onClick={onStartGame}
        >
          🚀 เริ่มเกม
        </button>
      )}

      {gameStarted && !gameFinished && (
        <>
          {mySkillCard && (
            <div className="my-skill-card">
              <div className="skill-card-display">
                <span className="skill-icon">{mySkillCard.icon}</span>
                <div className="skill-info">
                  <strong>{mySkillCard.name}</strong>
                  <p>{mySkillCard.description}</p>
                </div>
              </div>
              <button
                className={`control-button use-skill-button ${!isMyTurn || isRolling ? 'disabled' : ''}`}
                onClick={() => {
                  diceSound.currentTime = 0;
                  diceSound.play().catch(err => console.log('Sound error:', err));
                  onUseSkill();
                }}
                disabled={!isMyTurn || isRolling}
              >
                ✨ ใช้สกิลแล้วทอย
              </button>
            </div>
          )}

          <button
            className={`control-button roll-button ${!isMyTurn || isRolling ? 'disabled' : ''}`}
            onClick={handleDiceRoll}
            disabled={!isMyTurn || isRolling}
          >
            {isRolling ? '🎲 กำลังทอย...' : isMyTurn ? '🎲 ทอยลูกเต้า' : '⏳ รอตาของคุณ'}
          </button>
        </>
      )}

      {gameFinished && (
        <button
          className="control-button reset-button"
          onClick={onResetGame}
        >
          🔄 เล่นใหม่
        </button>
      )}

      {lastDiceRoll && (
        <div className="dice-result">
          <p className="dice-player">{lastDiceRoll.playerName}</p>

          <div className="dice-container">
            {/* ลูกเต้าลูกที่ 1 */}
            <div className={`dice-3d ${isRolling ? 'rolling' : ''}`}>
              <div className="dice-face-3d">
                {renderDiceDots(displayDice1)}
              </div>
            </div>

            {/* เครื่องหมายบวก */}
            <div className="dice-plus">+</div>

            {/* ลูกเต้าลูกที่ 2 */}
            <div className={`dice-3d ${isRolling ? 'rolling' : ''}`}>
              <div className="dice-face-3d">
                {renderDiceDots(displayDice2)}
              </div>
            </div>
          </div>

          {/* ผลรวม - แสดงเฉพาะเมื่อทอยเสร็จ */}
          {!isRolling && (
            <>
              <div className="dice-total">
                <span className="total-label">รวม:</span>
                <span className="total-value">{lastDiceRoll.diceValue}</span>
              </div>

              {/* แสดงการเปลี่ยนตำแหน่ง */}
              <div className="position-change">
                <span className="old-pos">{lastDiceRoll.oldPosition}</span>
                <span className="arrow">→</span>
                <span className="new-pos">{lastDiceRoll.newPosition}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GameControls;