import { useState } from 'react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Shield, Swords, Settings, LogOut, Map } from 'lucide-react';
import { GameMap } from './components/GameMap';

type Screen = 'menu' | 'game';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');

  const menuButtons = [
    { label: 'Chơi', icon: Swords, color: 'from-green-500 to-green-600', hoverColor: 'hover:from-green-600 hover:to-green-700', onClick: () => setCurrentScreen('game') },
    { label: 'Chọn màn', icon: Map, color: 'from-blue-500 to-blue-600', hoverColor: 'hover:from-blue-600 hover:to-blue-700', onClick: () => {} },
    { label: 'Nâng cấp', icon: Shield, color: 'from-purple-500 to-purple-600', hoverColor: 'hover:from-purple-600 hover:to-purple-700', onClick: () => {} },
    { label: 'Cài đặt', icon: Settings, color: 'from-orange-500 to-orange-600', hoverColor: 'hover:from-orange-600 hover:to-orange-700', onClick: () => {} },
    { label: 'Thoát', icon: LogOut, color: 'from-red-500 to-red-600', hoverColor: 'hover:from-red-600 hover:to-red-700', onClick: () => {} },
  ];

  if (currentScreen === 'game') {
    return <GameMap onBack={() => setCurrentScreen('menu')} />;
  }

  return (
    <div className="size-full relative overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-green-300">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 opacity-40">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1575373695750-7460b7272ca3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtZWRpZXZhbCUyMGZhbnRhc3klMjBjYXN0bGUlMjB0b3dlciUyMGRlZmVuc2UlMjBnYW1lfGVufDF8fHx8MTc3NzE2ODY5Nnww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Medieval Castle Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-400 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Main Content */}
      <div className="relative size-full flex flex-col items-center justify-center px-4">
        {/* Game Title */}
        <div className="mb-12 text-center">
          <div className="relative">
            {/* Title Shadow/Glow */}
            <h1 className="absolute inset-0 text-6xl md:text-8xl font-black text-yellow-300 blur-md opacity-60">
              Tower Defense
            </h1>
            {/* Main Title */}
            <h1 className="relative text-6xl md:text-8xl font-black bg-gradient-to-b from-yellow-200 via-yellow-400 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              Tower Defense
            </h1>
          </div>
          <p className="mt-4 text-xl md:text-2xl text-white font-semibold drop-shadow-lg">
            Bảo vệ vương quốc của bạn!
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          {menuButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <button
                key={index}
                onClick={button.onClick}
                className={`group relative bg-gradient-to-r ${button.color} ${button.hoverColor} text-white px-8 py-4 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
              >
                <div className="flex items-center justify-center gap-4">
                  <Icon className="w-7 h-7 transition-transform group-hover:rotate-12" />
                  <span className="text-2xl font-bold tracking-wide">
                    {button.label}
                  </span>
                </div>
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity rounded-xl"></div>
              </button>
            );
          })}
        </div>

        {/* Bottom Decoration */}
        <div className="mt-12 flex gap-8 opacity-70">
          <Shield className="w-12 h-12 text-amber-600 animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }} />
          <Shield className="w-16 h-16 text-amber-500 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2s' }} />
          <Shield className="w-12 h-12 text-amber-600 animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '2s' }} />
        </div>
      </div>
    </div>
  );
}