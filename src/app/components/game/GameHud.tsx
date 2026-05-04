import { ArrowLeft, Coins, Heart, Pause, Play, Shield, Trophy } from 'lucide-react';

import type { GameStatus } from '../../game/types';

interface GameHudProps {
  coins: number;
  completedWaves: number;
  health: number;
  isPaused: boolean;
  levelName: string;
  maxWaves: number;
  onBack: () => void;
  onTogglePause: () => void;
  status: GameStatus;
}

export function GameHud({
  coins,
  completedWaves,
  health,
  isPaused,
  levelName,
  maxWaves,
  onBack,
  onTogglePause,
  status,
}: GameHudProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-950/95 to-slate-900/85 backdrop-blur-sm border-b-2 border-amber-500/50 z-20">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">Menu</span>
        </button>

        <div className="min-w-0 flex flex-1 items-center justify-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border-2 border-slate-600 px-4 py-2 rounded-lg">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="truncate text-white font-bold">{levelName}</span>
          </div>

          <div className="flex items-center gap-2 bg-red-500/20 border-2 border-red-500 px-3 md:px-4 py-2 rounded-lg">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <span className="text-white font-bold text-lg md:text-xl">{health}</span>
          </div>

          <div className="flex items-center gap-2 bg-yellow-500/20 border-2 border-yellow-500 px-3 md:px-4 py-2 rounded-lg">
            <Coins className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <span className="text-white font-bold text-lg md:text-xl">{coins}</span>
          </div>

          <div className="flex items-center gap-2 bg-purple-500/20 border-2 border-purple-500 px-3 md:px-4 py-2 rounded-lg">
            <Shield className="w-6 h-6 text-purple-500" />
            <span className="text-white font-bold text-lg md:text-xl">
              {completedWaves}/{maxWaves}
            </span>
          </div>
        </div>

        <button
          onClick={onTogglePause}
          disabled={status !== 'playing'}
          className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors shadow-lg ${
            status !== 'playing'
              ? 'bg-slate-700 cursor-not-allowed opacity-60'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          <span className="font-bold hidden sm:inline">{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
        </button>
      </div>
    </div>
  );
}
