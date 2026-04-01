import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'Neon Nights', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Cyber Drift', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Synthwave City', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

export default function App() {
  // Music Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Snake Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  // Refs for game loop to avoid dependency issues
  const directionRef = useRef(direction);
  const nextDirectionRef = useRef(direction);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlayingMusic) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingMusic, currentTrackIndex, volume]);

  const togglePlayMusic = () => setIsPlayingMusic(!isPlayingMusic);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlayingMusic(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlayingMusic(true);
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  // --- Snake Game Logic ---
  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on the snake
      const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setFood(generateFood());
    setIsGameRunning(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameOver) {
        resetGame();
        return;
      }

      if (e.key === ' ' && !gameOver) {
        setIsGameRunning(prev => !prev);
        return;
      }

      if (!isGameRunning) return;

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) nextDirectionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) nextDirectionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) nextDirectionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) nextDirectionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        directionRef.current = nextDirectionRef.current;
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };

        // Check collisions
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          if (score > highScore) setHighScore(score);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood());
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
    const intervalId = setInterval(moveSnake, speed);

    return () => clearInterval(intervalId);
  }, [isGameRunning, gameOver, food, score, generateFood, highScore]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#00FFFF] font-digital flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="bg-noise"></div>
      <div className="scanlines"></div>
      
      {/* Header */}
      <header className="mb-8 text-center relative z-10 screen-tear">
        <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-widest glitch-text" data-text="SNAKE_PROTOCOL">
          SNAKE_PROTOCOL
        </h1>
        <p className="text-[#FF00FF] mt-2 tracking-widest text-xl uppercase bg-[#00FFFF] text-black inline-block px-2">
          SYS.OVERRIDE // GLITCH_ART
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-center lg:items-start justify-center relative z-10">
        
        {/* Game Container */}
        <div className="relative flex flex-col items-center bg-black p-6 border-4 border-[#00FFFF] shadow-[8px_8px_0px_#FF00FF]">
          
          {/* Score Board */}
          <div className="w-full flex justify-between mb-4 text-[#00FFFF] font-bold tracking-wider text-2xl uppercase border-b-2 border-[#00FFFF] pb-2">
            <div className="flex flex-col">
              <span className="text-sm text-[#FF00FF]">DATA_YIELD</span>
              <span className="text-4xl">{score}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-[#FF00FF]">PEAK_YIELD</span>
              <span className="text-4xl text-[#FF00FF]">{highScore}</span>
            </div>
          </div>

          {/* Game Grid */}
          <div 
            className="relative bg-black border-2 border-[#FF00FF] overflow-hidden screen-tear"
            style={{ 
              width: `${GRID_SIZE * 20}px`, 
              height: `${GRID_SIZE * 20}px`
            }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 opacity-20" 
                 style={{
                   backgroundImage: 'linear-gradient(#00FFFF 1px, transparent 1px), linear-gradient(90deg, #00FFFF 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
                 }}>
            </div>

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={`absolute ${isHead ? 'bg-[#FF00FF] z-10' : 'bg-[#00FFFF] z-0'}`}
                  style={{
                    left: `${segment.x * 20}px`,
                    top: `${segment.y * 20}px`,
                    width: '20px',
                    height: '20px',
                    border: '1px solid #050505'
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="absolute bg-[#FF00FF] z-0 glitch-text"
              style={{
                left: `${food.x * 20}px`,
                top: `${food.y * 20}px`,
                width: '20px',
                height: '20px',
                animation: 'text-glitch 0.2s infinite'
              }}
            />

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 border-4 border-[#00FFFF] m-4">
                <button 
                  onClick={() => setIsGameRunning(true)}
                  className="px-6 py-3 bg-[#00FFFF] text-black hover:bg-[#FF00FF] hover:text-white transition-none uppercase tracking-widest font-bold text-3xl flex items-center gap-2 cursor-pointer"
                >
                  <Play size={28} /> EXECUTE
                </button>
                <p className="mt-4 text-[#FF00FF] text-xl">INPUT: [W,A,S,D]</p>
                <p className="mt-1 text-[#00FFFF] text-xl">HALT: [SPACE]</p>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-4 border-[#FF00FF] m-4 glitch-container" data-text="FATAL_ERROR">
                <h2 className="text-5xl font-black text-[#FF00FF] mb-2 uppercase glitch-text">FATAL_ERROR</h2>
                <p className="text-[#00FFFF] mb-6 font-bold text-4xl">YIELD: {score}</p>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-[#FF00FF] text-black hover:bg-[#00FFFF] transition-none uppercase tracking-widest font-bold text-3xl flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={28} /> REBOOT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Music Player */}
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="bg-black p-6 border-4 border-[#FF00FF] shadow-[-8px_8px_0px_#00FFFF] relative">
            
            <h3 className="text-[#00FFFF] text-2xl uppercase tracking-widest font-bold mb-6 flex items-center gap-2 border-b-2 border-[#FF00FF] pb-2">
              <span className="w-4 h-4 bg-[#FF00FF] animate-ping"></span>
              AUDIO_SUBSYSTEM
            </h3>

            {/* Track Info */}
            <div className="mb-8">
              <div className="text-lg text-[#FF00FF] uppercase tracking-wider mb-1">CURRENT_STREAM</div>
              <div className="text-3xl font-bold text-[#00FFFF] truncate glitch-text">
                {TRACKS[currentTrackIndex].title}
              </div>
              
              {/* Visualizer (Raw) */}
              <div className="flex items-end gap-1 h-12 mt-4 border-b-2 border-[#00FFFF]">
                {[...Array(16)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-full bg-[#FF00FF] ${isPlayingMusic ? 'glitch-text' : ''}`}
                    style={{ 
                      height: isPlayingMusic ? `${Math.random() * 100}%` : '10%',
                      animationDuration: `${0.1 + Math.random() * 0.2}s`,
                    }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6 border-2 border-[#00FFFF] p-2">
              <button 
                onClick={prevTrack}
                className="p-2 text-[#00FFFF] hover:bg-[#FF00FF] hover:text-black transition-none cursor-pointer"
              >
                <SkipBack size={32} />
              </button>
              
              <button 
                onClick={togglePlayMusic}
                className="p-2 bg-[#00FFFF] text-black hover:bg-[#FF00FF] transition-none cursor-pointer"
              >
                {isPlayingMusic ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="p-2 text-[#00FFFF] hover:bg-[#FF00FF] hover:text-black transition-none cursor-pointer"
              >
                <SkipForward size={32} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 text-[#00FFFF]">
              <button onClick={() => setVolume(v => v === 0 ? 0.5 : 0)} className="hover:text-[#FF00FF] transition-none cursor-pointer">
                {volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-4 bg-black border-2 border-[#FF00FF] appearance-none cursor-pointer accent-[#00FFFF]"
              />
            </div>

            <audio 
              ref={audioRef} 
              src={TRACKS[currentTrackIndex].url} 
              onEnded={handleTrackEnded}
            />
          </div>
          
          {/* Instructions Card */}
          <div className="bg-black p-5 border-4 border-[#00FFFF] text-xl text-[#FF00FF] screen-tear">
            <h4 className="text-[#00FFFF] font-bold mb-2 uppercase tracking-wider border-b-2 border-[#FF00FF] pb-1">TERMINAL_LOG</h4>
            <ul className="space-y-1 opacity-90">
              <li>&gt; INIT SNAKE_PROTOCOL...</li>
              <li>&gt; AUDIO_SUBSYSTEM ONLINE.</li>
              <li>&gt; AWAITING INPUT...</li>
              <li>&gt; WARNING: AVOID WALLS.</li>
              <li>&gt; WARNING: AVOID SELF.</li>
              <li className="glitch-text">&gt; CONSUME DATA.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
