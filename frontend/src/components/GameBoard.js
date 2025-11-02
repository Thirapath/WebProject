import React from 'react';
import './GameBoard.css';

function GameBoard({ players, snakesAndLadders, skillCardSpots = [] }) {
  // สร้างกระดาน 100 ช่อง (10 แถว x 10 คอลัมน์)
  const renderBoard = () => {
    const cells = [];
    const rows = 10;
    const cols = 10;
    
    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        // คำนวณหมายเลขช่อง (เริ่มจากล่างขึ้นบน, ซิกแซก)
        let cellNumber;
        if (row % 2 === 0) {
          // แถวคู่: ไปจากซ้ายไปขวา
          cellNumber = (rows - 1 - row) * cols + col + 1;
        } else {
          // แถวคี่: ไปจากขวาไปซ้าย
          cellNumber = (rows - 1 - row) * cols + (cols - col);
        }
        
        rowCells.push(renderCell(cellNumber));
      }
      cells.push(
        <div key={row} className="board-row">
          {rowCells}
        </div>
      );
    }
    
    return cells;
  };

  const renderCell = (cellNumber) => {
    const playersOnCell = players.filter(p => p.position === cellNumber);
    const hasLadder = snakesAndLadders.ladders[cellNumber];
    const hasSnake = snakesAndLadders.snakes[cellNumber];
    const hasSkillCard = skillCardSpots.includes(cellNumber);
    
    let cellClass = 'board-cell';
    if (cellNumber === 100) cellClass += ' finish-cell';
    if (cellNumber === 1) cellClass += ' start-cell';
    if (hasLadder) cellClass += ' ladder-cell';
    if (hasSnake) cellClass += ' snake-cell';
    if (hasSkillCard) cellClass += ' skill-card-cell';
    
    return (
      <div key={cellNumber} className={cellClass}>
        <div className="cell-number">{cellNumber}</div>
        
        {hasLadder && (
          <div className="ladder-indicator">
            🪜{hasLadder}
          </div>
        )}
        
        {hasSnake && (
          <div className="snake-indicator">
            🐍{hasSnake}
          </div>
        )}
        
        {hasSkillCard && (
          <div className="skill-card-indicator">
            ⭐
          </div>
        )}
        
        {playersOnCell.length > 0 && (
          <div className="players-on-cell">
            {playersOnCell.map((player, index) => {
              // เช็คว่าผู้เล่นมีโล่งูหรือไม่
              const hasShield = player.activeShield === true;
              
              return (
                <div
                  key={player.id}
                  className={`player-token ${hasShield ? 'has-shield' : ''}`}
                  style={{ 
                    backgroundColor: player.color,
                    left: `${index * 4}px`,
                    top: `${index * 4}px`
                  }}
                  title={`${player.name}${hasShield ? ' 🛡️' : ''}`}
                >
                  {player.name.charAt(0).toUpperCase()}
                  {hasShield && <div className="shield-icon">🛡️</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="game-board-container">
      <div className="game-board">
        {renderBoard()}
      </div>
      
      <div className="board-legend">
        <div className="legend-item">
          <span className="legend-icon">🪜</span>
          <span>บันได</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🐍</span>
          <span>งู</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">⭐</span>
          <span>ไพ่สกิล</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🛡️</span>
          <span>โล่ป้องกัน</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🏁</span>
          <span>เป้าหมาย: ช่อง 100</span>
        </div>
      </div>
    </div>
  );
}

export default GameBoard;