import { useState } from 'react';
import Home from './pages/Home';
import Chat from './pages/Chat';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'chat'>('home');
  const [roomId, setRoomId] = useState<number>(0);

  const handleStartGame = () => {
    const newRoomId = Math.floor(Math.random() * 1000000);
    setRoomId(newRoomId);
    setCurrentPage('chat');
  };

  return (
    <>
      {currentPage === 'home' ? (
        <Home onStart={handleStartGame} />
      ) : (
        <Chat roomId={roomId} />
      )}
    </>
  );
}

export default App;
