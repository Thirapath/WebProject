import React from 'react';
import './PlayerList.css';

function PlayerList({ players, currentPlayerIndex, playerName, roomId, gameStarted }) {
  return (
    <div className="player-list">
      <h3>👥 ผู้เล่น ({players.length}/4)</h3>
      <p className="room-id">🏠 ห้อง: {roomId}</p>

      <div className="players">
        {players.map((player, index) => {
          const isCurrent = currentPlayerIndex === index && gameStarted;
          const isMe = player.name === playerName;

          return (
            <div
              key={player.id}
              className={`player-card ${isCurrent ? 'active' : ''} ${isMe ? 'me' : ''}`}
            >
              <div
                className="player-avatar"
                style={{ backgroundColor: player.color }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="player-info">
                <div className="player-name">{player.name} {isMe && '(ฉัน)'}</div>
                <div className="player-position">ตำแหน่ง: {player.position}</div>
              </div>
              {isCurrent && <div className="turn-indicator">🎯</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlayerList;
