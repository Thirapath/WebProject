import React from 'react';
import './SkillCard.css';

function SkillCard({ skill, onUse, disabled }) {
  if (!skill) {
    return (
      <div className="skill-card-container empty">
        <div className="skill-card-placeholder">
          <span className="placeholder-icon">📋</span>
          <p>ไม่มีไพ่สกิล</p>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-card-container">
      <div className={`skill-card ${skill.type}`}>
        <div className="skill-icon">{skill.icon}</div>
        <h4 className="skill-name">{skill.name}</h4>
        <p className="skill-description">{skill.description}</p>
        <button 
          className="use-skill-button"
          onClick={onUse}
          disabled={disabled}
        >
          {disabled ? '⏳ รอตาของคุณ' : '✨ ใช้สกิล'}
        </button>
      </div>
    </div>
  );
}

export default SkillCard;