import React, { useState } from 'react';
import './JoinRoom.css';

function JoinRoom({ onJoinRoom }) {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim() && playerName.trim()) {
      onJoinRoom(roomId.trim(), playerName.trim());
    }
  };

  return (
    <div className="join-room-container">
      <div className="join-room-card">
        <h1>🎲 เกมบันไดงู</h1>
        <h2>Snakes and Ladders</h2>
        
        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="playerName">ชื่อผู้เล่น</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="ใส่ชื่อของคุณ"
              maxLength={20}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomId">รหัสห้อง</label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="เช่น: room1"
              maxLength={20}
              required
            />
          </div>

          <button type="submit" className="join-button">
            เข้าร่วมเกม
          </button>
        </form>

        <div className="info-box">
          <p>📌 เล่นได้ 2-4 คน</p>
          <p>🎯 ชนะโดยไปถึงช่องที่ 30 ก่อน</p>
          <p>🪜 บันไดช่วยขึ้นไปข้างหน้า</p>
          <p>🐍 งูทำให้ถูกลงมาข้างหลัง</p>
        </div>
      </div>
    </div>
  );
}

export default JoinRoom;