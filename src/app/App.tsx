import { useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  ArrowLeft,
  Check,
  Lock,
  LogOut,
  Map,
  RotateCcw,
  Settings,
  Shield,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';

import menuImage from '../imports/MainScreen_DT.png?url';
import { GameMap } from './components/GameMap';
import {
  DEFAULT_PLAYER_UPGRADES,
  getUpgradeCost,
  LEVELS,
  PLAYER_UPGRADE_DEFS,
} from './game/constants';
import type { GameSettings, GameSpeed, LevelId, PlayerUpgradeId, PlayerUpgrades } from './game/types';

type Screen = 'menu' | 'game' | 'levels' | 'upgrades' | 'settings' | 'exit';

interface PlayerProfile {
  stars: number;
  unlockedLevels: LevelId[];
  completedLevels: Partial<Record<LevelId, number>>;
  upgrades: PlayerUpgrades;
}

const PROFILE_STORAGE_KEY = 'tower-defense-profile-v2';
const SETTINGS_STORAGE_KEY = 'tower-defense-settings-v1';

const DEFAULT_PROFILE: PlayerProfile = {
  stars: 0,
  unlockedLevels: ['meadow'],
  completedLevels: {},
  upgrades: DEFAULT_PLAYER_UPGRADES,
};

const DEFAULT_SETTINGS: GameSettings = {
  gameSpeed: 1,
  showRanges: true,
  reducedEffects: false,
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [selectedLevelId, setSelectedLevelId] = useState<LevelId>('meadow');
  const [profile, setProfile] = useState<PlayerProfile>(() => readStoredProfile());
  const [settings, setSettings] = useState<GameSettings>(() => readStoredSettings());
  const selectedLevel = useMemo(
    () => LEVELS.find((level) => level.id === selectedLevelId) ?? LEVELS[0],
    [selectedLevelId]
  );

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleLevelComplete = useCallback(
    (result: { levelId: LevelId; score: number; stars: number }) => {
      setProfile((prev) => {
        const previousBest = prev.completedLevels[result.levelId] ?? 0;
        const earnedStars = Math.max(0, result.stars - previousBest);
        const nextLevelId = getNextLevelId(result.levelId);
        const unlockedLevels = new Set(prev.unlockedLevels);

        if (nextLevelId) {
          unlockedLevels.add(nextLevelId);
        }

        return {
          ...prev,
          stars: prev.stars + earnedStars,
          unlockedLevels: Array.from(unlockedLevels),
          completedLevels: {
            ...prev.completedLevels,
            [result.levelId]: Math.max(previousBest, result.stars),
          },
        };
      });
    },
    []
  );

  const startLevel = (levelId: LevelId) => {
    if (!profile.unlockedLevels.includes(levelId)) return;

    setSelectedLevelId(levelId);
    setCurrentScreen('game');
  };

  const buyUpgrade = (upgradeId: PlayerUpgradeId) => {
    const upgradeDef = PLAYER_UPGRADE_DEFS.find((item) => item.id === upgradeId);

    if (!upgradeDef) return;

    setProfile((prev) => {
      const currentLevel = prev.upgrades[upgradeId];
      const cost = getUpgradeCost(currentLevel, upgradeDef.baseCost);

      if (currentLevel >= upgradeDef.maxLevel || prev.stars < cost) {
        return prev;
      }

      return {
        ...prev,
        stars: prev.stars - cost,
        upgrades: {
          ...prev.upgrades,
          [upgradeId]: currentLevel + 1,
        },
      };
    });
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    setSelectedLevelId('meadow');
  };

  if (currentScreen === 'game') {
    return (
      <GameMap
        key={selectedLevel.id}
        level={selectedLevel}
        settings={settings}
        upgrades={profile.upgrades}
        onBack={() => setCurrentScreen('menu')}
        onLevelComplete={handleLevelComplete}
      />
    );
  }

  return (
    <Shell>
      {currentScreen === 'menu' && (
        <MenuScreen
          onExit={() => {
            window.close();
            setCurrentScreen('exit');
          }}
          onOpenLevels={() => setCurrentScreen('levels')}
          onOpenSettings={() => setCurrentScreen('settings')}
          onOpenUpgrades={() => setCurrentScreen('upgrades')}
          onPlay={() => setCurrentScreen('game')}
          selectedLevelName={selectedLevel.name}
        />
      )}

      {currentScreen === 'levels' && (
        <LevelSelectScreen
          completedLevels={profile.completedLevels}
          onBack={() => setCurrentScreen('menu')}
          onStartLevel={startLevel}
          selectedLevelId={selectedLevelId}
          unlockedLevels={profile.unlockedLevels}
        />
      )}

      {currentScreen === 'upgrades' && (
        <UpgradesScreen
          onBack={() => setCurrentScreen('menu')}
          onBuyUpgrade={buyUpgrade}
          onResetProfile={resetProfile}
          profile={profile}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          onBack={() => setCurrentScreen('menu')}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      )}

      {currentScreen === 'exit' && (
        <ExitScreen
          onBack={() => setCurrentScreen('menu')}
          onPlay={() => setCurrentScreen('game')}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="size-full relative overflow-hidden bg-slate-950">
      <img
        src={menuImage}
        alt="Tower Defense"
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-900/50 to-emerald-950/70" />
      <div className="relative flex size-full items-center justify-center px-4 py-8">
        {children}
      </div>
    </div>
  );
}

function MenuScreen({
  onExit,
  onOpenLevels,
  onOpenSettings,
  onOpenUpgrades,
  onPlay,
  selectedLevelName,
}: {
  onExit: () => void;
  onOpenLevels: () => void;
  onOpenSettings: () => void;
  onOpenUpgrades: () => void;
  onPlay: () => void;
  selectedLevelName: string;
}) {
  const menuButtons = [
    { label: 'Chơi', icon: Swords, color: 'from-green-600 to-emerald-700', onClick: onPlay },
    { label: 'Chọn màn', icon: Map, color: 'from-blue-600 to-cyan-700', onClick: onOpenLevels },
    { label: 'Nâng cấp', icon: Shield, color: 'from-purple-600 to-fuchsia-700', onClick: onOpenUpgrades },
    { label: 'Cài đặt', icon: Settings, color: 'from-orange-600 to-amber-700', onClick: onOpenSettings },
    { label: 'Thoát', icon: LogOut, color: 'from-red-600 to-rose-700', onClick: onExit },
  ];

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <div className="mb-10 text-center">
        <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-b from-yellow-200 via-yellow-400 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]">
          Tower Defense
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-white font-semibold drop-shadow-lg">
          Bảo vệ vương quốc của bạn
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/70 bg-slate-950/70 px-4 py-2 text-amber-200">
          <Trophy className="h-5 w-5" />
          <span className="font-bold">Màn hiện tại: {selectedLevelName}</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4">
        {menuButtons.map((button) => {
          const Icon = button.icon;

          return (
            <button
              key={button.label}
              onClick={button.onClick}
              className={`group bg-gradient-to-r ${button.color} text-white px-8 py-4 rounded-lg shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl`}
            >
              <div className="flex items-center justify-center gap-4">
                <Icon className="w-7 h-7 transition-transform group-hover:rotate-6" />
                <span className="text-2xl font-bold">{button.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LevelSelectScreen({
  completedLevels,
  onBack,
  onStartLevel,
  selectedLevelId,
  unlockedLevels,
}: {
  completedLevels: PlayerProfile['completedLevels'];
  onBack: () => void;
  onStartLevel: (levelId: LevelId) => void;
  selectedLevelId: LevelId;
  unlockedLevels: LevelId[];
}) {
  return (
    <Panel title="Chọn Màn" onBack={onBack}>
      <div className="grid gap-4 md:grid-cols-3">
        {LEVELS.map((level) => {
          const locked = !unlockedLevels.includes(level.id);
          const bestStars = completedLevels[level.id] ?? 0;

          return (
            <button
              key={level.id}
              onClick={() => onStartLevel(level.id)}
              disabled={locked}
              className={`min-h-64 rounded-lg border-2 p-4 text-left transition ${
                selectedLevelId === level.id
                  ? 'border-amber-300 bg-amber-500/20'
                  : 'border-slate-500 bg-slate-950/75 hover:border-amber-400'
              } ${locked ? 'cursor-not-allowed opacity-55' : ''}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="rounded-lg bg-slate-900 p-2 text-amber-300">
                  {locked ? <Lock className="h-6 w-6" /> : <Map className="h-6 w-6" />}
                </div>
                <div className="text-2xl text-amber-300">
                  {'★'.repeat(bestStars)}{'☆'.repeat(3 - bestStars)}
                </div>
              </div>

              <h3 className="text-2xl font-black text-white">{level.name}</h3>
              <p className="mt-1 font-semibold text-amber-200">{level.subtitle}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">{level.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-100">
                <Stat label="Wave" value={level.maxWaves} />
                <Stat label="Vàng" value={level.startingCoins} />
                <Stat label="Máu" value={level.startingHealth} />
                <Stat label="Độ khó" value={`${Math.round(level.difficultyMultiplier * 100)}%`} />
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function UpgradesScreen({
  onBack,
  onBuyUpgrade,
  onResetProfile,
  profile,
}: {
  onBack: () => void;
  onBuyUpgrade: (upgradeId: PlayerUpgradeId) => void;
  onResetProfile: () => void;
  profile: PlayerProfile;
}) {
  return (
    <Panel title="Nâng Cấp" onBack={onBack}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-400/60 bg-slate-950/75 px-4 py-3">
        <div className="text-lg font-bold text-white">
          Sao hiện có: <span className="text-amber-300">{profile.stars}</span>
        </div>
        <button
          onClick={onResetProfile}
          className="inline-flex items-center gap-2 rounded-lg border border-red-400 bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-600"
        >
          <RotateCcw className="h-4 w-4" />
          Xóa tiến trình
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAYER_UPGRADE_DEFS.map((upgrade) => {
          const currentLevel = profile.upgrades[upgrade.id];
          const cost = getUpgradeCost(currentLevel, upgrade.baseCost);
          const isMaxed = currentLevel >= upgrade.maxLevel;
          const canBuy = !isMaxed && profile.stars >= cost;

          return (
            <div key={upgrade.id} className="rounded-lg border-2 border-slate-500 bg-slate-950/75 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="rounded-lg bg-purple-700 p-2 text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="font-black text-amber-300">
                  Cấp {currentLevel}/{upgrade.maxLevel}
                </div>
              </div>

              <h3 className="text-xl font-black text-white">{upgrade.name}</h3>
              <p className="mt-2 min-h-12 text-sm text-slate-200">{upgrade.description}</p>

              <button
                onClick={() => onBuyUpgrade(upgrade.id)}
                disabled={!canBuy}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 font-bold text-white ${
                  canBuy
                    ? 'border-emerald-400 bg-emerald-700 hover:bg-emerald-600'
                    : 'cursor-not-allowed border-slate-500 bg-slate-700 opacity-65'
                }`}
              >
                {isMaxed ? <Check className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
                {isMaxed ? 'Đã tối đa' : `Nâng cấp ${cost} sao`}
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SettingsScreen({
  onBack,
  onUpdateSettings,
  settings,
}: {
  onBack: () => void;
  onUpdateSettings: Dispatch<SetStateAction<GameSettings>>;
  settings: GameSettings;
}) {
  const speedOptions: GameSpeed[] = [1, 1.5, 2];

  return (
    <Panel title="Cài Đặt" onBack={onBack}>
      <div className="space-y-5">
        <SettingRow label="Tốc độ trận">
          <div className="grid grid-cols-3 gap-2">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => onUpdateSettings((prev) => ({ ...prev, gameSpeed: speed }))}
                className={`rounded-lg border px-4 py-3 font-black ${
                  settings.gameSpeed === speed
                    ? 'border-amber-300 bg-amber-500 text-slate-950'
                    : 'border-slate-500 bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Hiện tầm bắn">
          <Toggle
            checked={settings.showRanges}
            onClick={() => onUpdateSettings((prev) => ({ ...prev, showRanges: !prev.showRanges }))}
          />
        </SettingRow>

        <SettingRow label="Giảm hiệu ứng">
          <Toggle
            checked={settings.reducedEffects}
            onClick={() => onUpdateSettings((prev) => ({ ...prev, reducedEffects: !prev.reducedEffects }))}
          />
        </SettingRow>
      </div>
    </Panel>
  );
}

function ExitScreen({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  return (
    <Panel title="Thoát Game" onBack={onBack}>
      <div className="mx-auto max-w-xl text-center">
        <LogOut className="mx-auto mb-4 h-16 w-16 text-red-300" />
        <p className="text-xl font-semibold text-white">
          Phiên chơi đã được lưu trong trình duyệt.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={onPlay}
            className="rounded-lg border border-emerald-300 bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-600"
          >
            Chơi tiếp
          </button>
          <button
            onClick={onBack}
            className="rounded-lg border border-slate-400 bg-slate-700 px-6 py-3 font-bold text-white hover:bg-slate-600"
          >
            Về menu
          </button>
        </div>
      </div>
    </Panel>
  );
}

function Panel({
  children,
  onBack,
  title,
}: {
  children: ReactNode;
  onBack: () => void;
  title: string;
}) {
  return (
    <div className="w-full max-w-6xl rounded-lg border-2 border-amber-400/60 bg-slate-900/88 p-5 shadow-2xl backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-amber-400/40 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-500 bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Menu
        </button>
        <h2 className="text-3xl font-black text-amber-300">{title}</h2>
        <div className="w-24" />
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-slate-600 bg-slate-900/80 px-3 py-2">
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="font-black text-white">{value}</div>
    </div>
  );
}

function SettingRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-500 bg-slate-950/75 p-4">
      <div className="text-xl font-black text-white">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-9 w-16 rounded-full border-2 transition ${
        checked ? 'border-emerald-300 bg-emerald-600' : 'border-slate-500 bg-slate-700'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
          checked ? 'left-8' : 'left-1'
        }`}
      />
    </button>
  );
}

function getNextLevelId(levelId: LevelId) {
  const currentIndex = LEVELS.findIndex((level) => level.id === levelId);
  const nextLevel = LEVELS[currentIndex + 1];

  return nextLevel?.id;
}

function readStoredProfile(): PlayerProfile {
  try {
    const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = rawProfile ? JSON.parse(rawProfile) : {};
    const unlockedLevels = Array.isArray(parsed.unlockedLevels)
      ? parsed.unlockedLevels.filter((id: LevelId) => LEVELS.some((level) => level.id === id))
      : DEFAULT_PROFILE.unlockedLevels;

    if (!unlockedLevels.includes('meadow')) {
      unlockedLevels.unshift('meadow');
    }

    return {
      stars: typeof parsed.stars === 'number' ? parsed.stars : DEFAULT_PROFILE.stars,
      unlockedLevels,
      completedLevels: parsed.completedLevels ?? DEFAULT_PROFILE.completedLevels,
      upgrades: {
        ...DEFAULT_PLAYER_UPGRADES,
        ...(parsed.upgrades ?? {}),
      },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function readStoredSettings(): GameSettings {
  try {
    const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = rawSettings ? JSON.parse(rawSettings) : {};
    const parsedSpeed = [1, 1.5, 2].includes(parsed.gameSpeed) ? parsed.gameSpeed : DEFAULT_SETTINGS.gameSpeed;

    return {
      gameSpeed: parsedSpeed,
      showRanges: typeof parsed.showRanges === 'boolean' ? parsed.showRanges : DEFAULT_SETTINGS.showRanges,
      reducedEffects:
        typeof parsed.reducedEffects === 'boolean'
          ? parsed.reducedEffects
          : DEFAULT_SETTINGS.reducedEffects,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
