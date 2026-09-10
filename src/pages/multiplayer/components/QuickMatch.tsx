import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../multiplayer.css';

const ROOM_NAMES   = ['JS Warriors', 'Speed Demons', 'Code Runners', 'Key Masters', 'Type Force'];
const ROOM_LEVELS  = ['Beginner', 'Intermediate', 'Advanced'] as const;
const OPP_NAMES    = ['BlazingKeys', 'TyperX', 'SwiftFingers', 'AlphaKeys', 'NightTyper'];

function genRooms() {
  return Array.from({ length: 3 }, (_, i) => ({
    id:      String(Math.floor(Math.random() * 99) + 10),
    name:    `${ROOM_NAMES[i % ROOM_NAMES.length]} #${Math.floor(Math.random() * 99) + 1}`,
    level:   ROOM_LEVELS[i % 3],
    current: Math.floor(Math.random() * 3) + 1,
    max:     4,
  }));
}

export default function QuickMatch() {
  const navigate = useNavigate();
  const [searching,  setSearching]  = useState(false);
  const [onlineCount, setOnlineCount] = useState(1247);
  const [roomCount,   setRoomCount]   = useState(89);
  const [rooms,       setRooms]       = useState(genRooms);

  // Simulated live online counter
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(n => n + Math.floor(Math.random() * 7) - 3);
      setRoomCount(n  => Math.max(50, n + Math.floor(Math.random() * 3) - 1));
      // Refresh rooms periodically
      if (Math.random() > 0.7) setRooms(genRooms());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFindMatch = () => {
    navigate('/multiplayer/findmatch');
  };

  const handleJoinRoom = (roomId: string) => {
    const opp = OPP_NAMES[Math.floor(Math.random() * OPP_NAMES.length)];
    navigate(`/multiplayer/findmatch/QM-${roomId}`, { state: { opponentName: opp, matchMode: 'quick' } });
  };

  return (
    <div className="mp-card anim-slide-in-left">
      <div className="mp-card__header">
        <div className="mp-card__icon mp-card__icon--lightning"></div>
        <div>
          <h2 className="mp-card__title">Quick Match</h2>
          <p className="mp-card__subtitle">Public matchmaking</p>
        </div>
      </div>

      {/* Live stats */}
      <div className="mp-stats">
        <div className="mp-stat">
          <div className="mp-stat__label">Online Now</div>
          <div className="mp-stat__value mp-stat__value--live">
            <span className="mp-stat__live-dot" aria-hidden="true" />
            {onlineCount.toLocaleString()}
          </div>
        </div>
        <div className="mp-stat">
          <div className="mp-stat__label">Active Rooms</div>
          <div className="mp-stat__value">{roomCount}</div>
        </div>
      </div>

      {/* Find match */}
      {searching ? (
        <div className="mp-searching">
          <div className="mp-searching__spinner" />
          <span>Finding opponent…</span>
        </div>
      ) : (
        <button id="find-match-btn" className="mp-find-btn" onClick={handleFindMatch}>
          Find Match
        </button>
      )}

      {/* Active rooms */}
      <div className="mp-rooms">
        <p className="mp-rooms__title">Active Rooms</p>
        {rooms.map(room => (
          <div key={room.id} className="mp-room-item">
            <div className="mp-room-item__info">
              <div className="mp-room-item__name">{room.name}</div>
              <div className="mp-room-item__level">{room.level}</div>
            </div>
            <span className="mp-room-item__slots">{room.current}/{room.max}</span>
            <button
              id={`join-room-${room.id}`}
              className="mp-room-item__join"
              onClick={() => handleJoinRoom(room.id)}
            >
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
