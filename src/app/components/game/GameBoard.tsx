import type { MouseEvent } from 'react';

import mapImage from '../../../imports/MainScreen_DT.png?url';
import { getProjectileColor } from '../../game/constants';
import type { BuildItemType, BuildShopItem, EnemyType, GameSettings, GameState } from '../../game/types';
import { EnemySprite } from '../EnemySprite';
import { TowerSprite } from '../TowerSprite';
import { RoadBlockerSprite } from './RoadBlockerSprite';

interface GameBoardProps {
  game: GameState;
  gameSpeed: GameSettings['gameSpeed'];
  isPaused: boolean;
  notice: string | null;
  onBack: () => void;
  onPlaceBuildItem: (event: MouseEvent<HTMLDivElement>) => void;
  onResetGame: () => void;
  onSelectBlocker: (blockerId: number) => void;
  onSelectTower: (towerId: number) => void;
  reducedEffects: boolean;
  selectedBlockerId: number | null;
  selectedBuildItem: BuildShopItem | undefined;
  selectedBuildType: BuildItemType | null;
  selectedTowerId: number | null;
  showRanges: boolean;
}

export function GameBoard({
  game,
  gameSpeed,
  isPaused,
  notice,
  onBack,
  onPlaceBuildItem,
  onResetGame,
  onSelectBlocker,
  onSelectTower,
  reducedEffects,
  selectedBlockerId,
  selectedBuildItem,
  selectedBuildType,
  selectedTowerId,
  showRanges,
}: GameBoardProps) {
  const placeHint =
    selectedBuildItem?.type === 'roadBlocker'
      ? 'click vào đường để đặt'
      : 'click vào bãi cỏ để đặt';
  const visibleEnemies = game.enemies.filter((enemy) => enemy.spawnDelay <= 0);
  const attackedBlockerIds = new Set(
    visibleEnemies
      .map((enemy) => enemy.attackingBlockerId)
      .filter((id): id is number => id !== null)
  );

  const getEnemyOffset = (enemyId: number) => {
    const currentEnemy = visibleEnemies.find((enemy) => enemy.id === enemyId);

    if (!currentEnemy) return { x: 0, y: 0 };

    const groupedEnemies =
      currentEnemy.attackingBlockerId !== null
        ? visibleEnemies.filter((enemy) => enemy.attackingBlockerId === currentEnemy.attackingBlockerId)
        : visibleEnemies.filter((enemy) => {
            if (enemy.attackingBlockerId !== null) return false;

            return Math.abs(enemy.x - currentEnemy.x) < 1.5 && Math.abs(enemy.y - currentEnemy.y) < 1.5;
          });

    const enemyIndex = groupedEnemies.findIndex((enemy) => enemy.id === enemyId);

    if (groupedEnemies.length <= 1 || enemyIndex === -1) return { x: 0, y: 0 };

    const angle = (enemyIndex / groupedEnemies.length) * Math.PI * 2;
    const radius = Math.min(14, 4 + groupedEnemies.length * 1.5);

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.65,
    };
  };

  return (
    <div className="flex-1 flex items-center justify-center p-2">
      <div
        onClick={onPlaceBuildItem}
        className={`relative w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl border-4 ${
          selectedBuildType ? 'border-green-400 cursor-crosshair' : 'border-amber-600'
        }`}
      >
        <img
          src={mapImage}
          alt="Game Map"
          className="absolute inset-0 w-full h-full object-fill z-0"
        />

        {notice && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 bg-slate-900/90 border-2 border-amber-400 text-white px-5 py-3 rounded-lg font-bold z-40 shadow-xl">
            {notice}
          </div>
        )}

        {selectedBuildItem && (
          <div className="absolute left-1/2 top-16 -translate-x-1/2 bg-green-600/90 text-white px-4 py-2 rounded-lg font-bold z-40 shadow-lg">
            Đang chọn {selectedBuildItem.name} - {placeHint}
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none z-10">
          {game.placedTowers
            .filter((tower) => showRanges || tower.id === selectedTowerId)
            .map((tower) => (
              <div
                key={`range-${tower.id}`}
                className={`absolute rounded-full border ${
                  tower.id === selectedTowerId
                    ? 'border-yellow-300/45 bg-yellow-300/10'
                    : 'border-yellow-300/15 bg-yellow-300/5'
                }`}
                style={{
                  left: `${tower.x - tower.range}%`,
                  top: `${tower.y - tower.range}%`,
                  width: `${tower.range * 2}%`,
                  height: `${tower.range * 2}%`,
                }}
              />
            ))}
        </div>

        <div className="absolute inset-0 pointer-events-none z-20">
          {game.placedBlockers.map((blocker) => {
            const rotation = blocker.id % 2 === 0 ? '-4deg' : '5deg';
            const isUnderAttack = attackedBlockerIds.has(blocker.id);
            const isSelected = blocker.id === selectedBlockerId;

            return (
              <div
                key={blocker.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectBlocker(blocker.id);
                }}
                className={`absolute pointer-events-auto cursor-pointer rounded-lg ${
                  isSelected ? 'ring-4 ring-amber-300/80' : ''
                }`}
                style={{
                  left: `${blocker.x}%`,
                  top: `${blocker.y}%`,
                  width: 'clamp(82px, 8.8%, 136px)',
                  height: 'clamp(62px, 7.2%, 108px)',
                  transform: `translate(-50%, -50%) rotate(${rotation})`,
                  animation:
                    isUnderAttack && !isPaused && !reducedEffects
                      ? 'blockerHitShake 260ms ease-out infinite'
                      : undefined,
                  ['--blocker-rotation' as string]: rotation,
                }}
              >
                <RoadBlockerSprite damaged={blocker.hp / blocker.maxHp < 0.5} />

                <div className="absolute left-1/2 -top-2 h-1.5 w-12 -translate-x-1/2 overflow-hidden rounded-full border border-black/50 bg-black/65">
                  <div
                    className="h-full bg-lime-400"
                    style={{
                      width: `${Math.max(0, (blocker.hp / blocker.maxHp) * 100)}%`,
                    }}
                  />
                </div>

                <div className="absolute right-0 top-0 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Lv {blocker.level}
                </div>
              </div>
            );
          })}

          {game.placedTowers.map((tower) => {
            const isSelected = tower.id === selectedTowerId;

            return (
              <div
                key={tower.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectTower(tower.id);
                }}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${tower.x}%`,
                  top: `${tower.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <TowerSprite type={tower.type} size={tower.size} selected={isSelected} />
                <div className="absolute right-0 top-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Lv {tower.level}
                </div>
              </div>
            );
          })}
        </div>

        <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 25 }}>
          {game.projectiles.map((projectile) => {
            const color = getProjectileColor(projectile.type);

            return (
              <g
                key={projectile.id}
                style={{
                  color,
                  animation: isPaused || reducedEffects ? 'none' : 'projectileFade 360ms ease-out forwards',
                }}
              >
                <line
                  x1={`${projectile.fromX}%`}
                  y1={`${projectile.fromY}%`}
                  x2={`${projectile.toX}%`}
                  y2={`${projectile.toY}%`}
                  stroke={color}
                  strokeWidth={projectile.type === 'magic' ? 5 : 3}
                  strokeLinecap="round"
                  opacity="0.95"
                />

                <circle
                  cx={`${projectile.toX}%`}
                  cy={`${projectile.toY}%`}
                  r={projectile.type === 'magic' ? 9 : 6}
                  fill={color}
                  opacity="0.75"
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: isPaused || reducedEffects ? 'none' : 'hitFlash 360ms ease-out forwards',
                  }}
                />
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0 pointer-events-none z-30">
          {visibleEnemies.map((enemy) => {
            const isAttacking = enemy.attackingBlockerId !== null || enemy.attackingGoal;
            const offset = getEnemyOffset(enemy.id);
            const visual = getEnemyVisual(enemy.enemyType);

            return (
              <div
                key={enemy.id}
                className="absolute"
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                  marginLeft: `${offset.x}px`,
                  marginTop: `${offset.y}px`,
                  transform: 'translate3d(-50%, -50%, 0)',
                  willChange: 'left, top, transform',
                  animation:
                    isAttacking && !isPaused && !reducedEffects
                      ? 'enemyAttackLunge 520ms ease-in-out infinite'
                      : undefined,
                }}
              >
                <div className={visual.ringClass} style={{ filter: visual.filter }}>
                  <EnemySprite
                    size={enemy.size}
                    animation={isAttacking ? 'attackSide' : 'walkSide'}
                    paused={isPaused || reducedEffects}
                    speed={Math.max(30, (isAttacking ? 85 : 70) / gameSpeed)}
                  />
                </div>

                {enemy.enemyType !== 'grunt' && (
                  <div className={`absolute left-1/2 -top-6 -translate-x-1/2 rounded px-2 py-0.5 text-[10px] font-black uppercase ${visual.badgeClass}`}>
                    {visual.label}
                  </div>
                )}

                <div className="absolute left-1/2 -top-2 w-16 h-2 bg-black/70 rounded-full overflow-hidden border border-white/30 -translate-x-1/2">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {isPaused && game.status === 'playing' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="text-center">
              <h2 className="text-6xl font-black text-white mb-4">TẠM DỪNG</h2>
              <p className="text-2xl text-gray-300">Nhấn Tiếp tục để chơi</p>
            </div>
          </div>
        )}

        {game.status === 'victory' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center px-4">
              <h2 className="text-6xl font-black text-amber-300 mb-4">CHIẾN THẮNG</h2>
              <p className="text-2xl text-gray-200 mb-2">Đã giữ vững {game.levelName}</p>
              <p className="text-4xl mb-6">{'★'.repeat(game.victoryStars)}{'☆'.repeat(3 - game.victoryStars)}</p>
              <p className="text-lg text-gray-300 mb-6">Điểm: {game.score}</p>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onResetGame();
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-bold border-2 border-amber-300"
                >
                  Chơi lại
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onBack();
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold border-2 border-slate-400"
                >
                  Về menu
                </button>
              </div>
            </div>
          </div>
        )}

        {game.status === 'defeat' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center px-4">
              <h2 className="text-6xl font-black text-red-500 mb-4">GAME OVER</h2>
              <p className="text-2xl text-gray-300 mb-6">Quái đã vượt qua phòng thủ!</p>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onResetGame();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-xl border-2 border-red-400"
              >
                Chơi lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getEnemyVisual(enemyType: EnemyType) {
  if (enemyType === 'runner') {
    return {
      label: 'Nhanh',
      filter: 'hue-rotate(65deg) saturate(1.35)',
      ringClass: '',
      badgeClass: 'bg-emerald-500 text-slate-950',
    };
  }

  if (enemyType === 'brute') {
    return {
      label: 'Trâu',
      filter: 'hue-rotate(-25deg) saturate(1.2) brightness(0.95)',
      ringClass: '',
      badgeClass: 'bg-orange-500 text-white',
    };
  }

  if (enemyType === 'boss') {
    return {
      label: 'Boss',
      filter: 'saturate(1.45) brightness(1.08) drop-shadow(0 0 10px #ef4444)',
      ringClass: 'rounded-full ring-4 ring-red-500/60',
      badgeClass: 'bg-red-600 text-white',
    };
  }

  return {
    label: '',
    filter: undefined,
    ringClass: '',
    badgeClass: '',
  };
}
