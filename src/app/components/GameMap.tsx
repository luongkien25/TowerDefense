import { EnemySprite } from './EnemySprite';
import { TowerSprite } from './TowerSprite';
import { useState } from 'react';
import { ArrowLeft, Pause, Play, Heart, Coins, Shield } from 'lucide-react';
import mapImage from '../../imports/MainScreen_DT.png?url';

interface GameMapProps {
  onBack: () => void;
}

export function GameMap({ onBack }: GameMapProps) {
  const [isPaused, setIsPaused] = useState(false);

  const health = 20;
  const coins = 150;
  const wave = 1;

  const towers = [
    { name: 'Tháp Cung', cost: 50, icon: '🏹' },
    { name: 'Tháp Phép', cost: 150, icon: '✨' },
    { name: 'Tháp Bóng Tối', cost: 180, icon: '💀' },
  ];

  const placedTowers = [
    {
      id: 1,
      type: 'crossbow' as const,
      left: '27%',
      top: '30%',
      size: 82,
    },
    {
      id: 2,
      type: 'magic' as const,
      left: '48%',
      top: '42%',
      size: 88,
    },
    {
      id: 3,
      type: 'necromancer' as const,
      left: '73%',
      top: '56%',
      size: 92,
    },
  ];

  const enemies = [
    {
      id: 1,
      size: 110,
      delay: '0s',
      speed: 70,
      top: '34%',
      left: '3%',
    },
    {
      id: 2,
      size: 104,
      delay: '-1.6s',
      speed: 75,
      top: '35%',
      left: '2%',
    },
    {
      id: 3,
      size: 98,
      delay: '-3.2s',
      speed: 80,
      top: '33%',
      left: '1%',
    },
  ];

  return (
    <div className="size-full relative bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
      <style>
        {`
          @keyframes enemyPath1 {
            0% {
              transform: translate(0px, 0px);
            }

            18% {
              transform: translate(170px, 12px);
            }

            35% {
              transform: translate(320px, 54px);
            }

            52% {
              transform: translate(485px, 108px);
            }

            70% {
              transform: translate(650px, 118px);
            }

            85% {
              transform: translate(785px, 72px);
            }

            100% {
              transform: translate(930px, 92px);
            }
          }
        `}
      </style>

      {/* Top UI Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900/95 to-slate-900/80 backdrop-blur-sm border-b-2 border-amber-500/50 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Menu</span>
          </button>

          <div className="flex gap-6">
            <div className="flex items-center gap-2 bg-red-500/20 border-2 border-red-500 px-4 py-2 rounded-lg">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              <span className="text-white font-bold text-xl">{health}</span>
            </div>

            <div className="flex items-center gap-2 bg-yellow-500/20 border-2 border-yellow-500 px-4 py-2 rounded-lg">
              <Coins className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="text-white font-bold text-xl">{coins}</span>
            </div>

            <div className="flex items-center gap-2 bg-purple-500/20 border-2 border-purple-500 px-4 py-2 rounded-lg">
              <Shield className="w-6 h-6 text-purple-500" />
              <span className="text-white font-bold text-xl">Wave {wave}</span>
            </div>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            <span className="font-bold">{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="absolute inset-0 flex pt-20">
        {/* Game Map */}
        <div className="flex-1 flex items-center justify-center p-2">
          <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-amber-600">
            {/* Map nền */}
            <img
              src={mapImage}
              alt="Game Map"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* Tower layer */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {placedTowers.map((tower) => (
                <div
                  key={tower.id}
                  className="absolute"
                  style={{
                    left: tower.left,
                    top: tower.top,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <TowerSprite type={tower.type} size={tower.size} />
                </div>
              ))}
            </div>

            {/* Enemy layer */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {enemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className="absolute"
                  style={{
                    left: enemy.left,
                    top: enemy.top,
                    animation: 'enemyPath1 5.2s linear infinite',
                    animationDelay: enemy.delay,
                    animationPlayState: isPaused ? 'paused' : 'running',
                    willChange: 'transform',
                  }}
                >
                  <EnemySprite
                    size={enemy.size}
                    animation="walkSide"
                    paused={isPaused}
                    speed={enemy.speed}
                  />
                </div>
              ))}
            </div>

            {/* Pause Overlay */}
            {isPaused && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
                <div className="text-center">
                  <h2 className="text-6xl font-black text-white mb-4">TẠM DỪNG</h2>
                  <p className="text-2xl text-gray-300">Nhấn Tiếp tục để chơi</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Tower Selection */}
        <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 border-l-2 border-amber-500/50 p-4 overflow-y-auto">
          <h3 className="text-2xl font-bold text-amber-400 mb-4 text-center border-b-2 border-amber-500 pb-2">
            Chọn Tháp
          </h3>

          <div className="space-y-3">
            {towers.map((tower, index) => (
              <button
                key={index}
                className={`w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-amber-600 hover:to-amber-700 border-2 border-amber-500/50 hover:border-amber-400 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 ${
                  coins < tower.cost ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={coins < tower.cost}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{tower.icon}</span>

                    <div className="text-left">
                      <p className="text-white font-bold text-lg">{tower.name}</p>

                      <div className="flex items-center gap-1 text-yellow-400">
                        <Coins className="w-4 h-4" />
                        <span className="font-semibold">{tower.cost}</span>
                      </div>
                    </div>
                  </div>

                  {coins >= tower.cost && (
                    <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                      Đặt
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 bg-slate-700/50 rounded-xl p-4 border-2 border-slate-600">
            <h4 className="text-amber-400 font-bold mb-2">Hướng dẫn:</h4>

            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Chọn tháp và đặt trên bãi cỏ</li>
              <li>• Không thể đặt trên đường đi</li>
              <li>• Nâng cấp tháp để mạnh hơn</li>
              <li>• Tiêu diệt quái để nhận vàng</li>
            </ul>
          </div>

          <button className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-4 rounded-xl font-bold text-xl shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-red-400">
            Bắt đầu Wave {wave}
          </button>
        </div>
      </div>
    </div>
  );
}