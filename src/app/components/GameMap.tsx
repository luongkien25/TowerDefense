import {
  GRID_COLS,
  GRID_ROWS,
  getTerrainAtGrid,
  getTerrainAtPercent,
  getTerrainMessage,
  gridToPercent,
  isTowerPlaceableAtPercent,
} from '../game/mapGrid';

import { EnemySprite } from './EnemySprite';
import { TowerSprite } from './TowerSprite';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowLeft, Pause, Play, Heart, Coins, Shield } from 'lucide-react';
import mapImage from '../../imports/MainScreen_DT.png?url';

interface GameMapProps {
  onBack: () => void;
}

type TowerType = 'crossbow' | 'magic' | 'necromancer';

interface Point {
  x: number;
  y: number;
}

interface GridNode {
  row: number;
  col: number;
}

interface GameEnemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  spawnDelay: number;
  size: number;
  reward: number;
}

interface PlacedTower {
  id: number;
  type: TowerType;
  x: number;
  y: number;
  size: number;
  range: number;
  damage: number;
  fireRate: number;
  lastShotTime: number;
}

interface TowerShopItem {
  type: TowerType;
  name: string;
  cost: number;
  icon: string;
  size: number;
  range: number;
  damage: number;
  fireRate: number;
}

interface ProjectileEffect {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: TowerType;
  createdAt: number;
}

interface GameState {
  health: number;
  coins: number;
  wave: number;
  enemies: GameEnemy[];
  placedTowers: PlacedTower[];
  projectiles: ProjectileEffect[];
}

const PROJECTILE_LIFETIME = 360;

const TOWER_SHOP: TowerShopItem[] = [
  {
    type: 'crossbow',
    name: 'Tháp Cung',
    cost: 50,
    icon: '🏹',
    size: 82,
    range: 18,
    damage: 18,
    fireRate: 1.8,
  },
  {
    type: 'magic',
    name: 'Tháp Phép',
    cost: 150,
    icon: '✨',
    size: 88,
    range: 20,
    damage: 32,
    fireRate: 1.1,
  },
  {
    type: 'necromancer',
    name: 'Tháp Bóng Tối',
    cost: 100,
    icon: '💀',
    size: 92,
    range: 17,
    damage: 24,
    fireRate: 1.3,
  },
];

function createInitialGameState(): GameState {
  return {
    health: 20,
    coins: 300,
    wave: 1,
    enemies: [],
    placedTowers: [],
    projectiles: [],
  };
}

function distance(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function isRoadCell(row: number, col: number) {
  if (row < 0 || row >= GRID_ROWS) return false;
  if (col < 0 || col >= GRID_COLS) return false;

  return getTerrainAtGrid(row, col) === 'R';
}

function nodeKey(node: GridNode) {
  return `${node.row},${node.col}`;
}

function heuristic(a: GridNode, b: GridNode) {
  const dx = Math.abs(a.col - b.col);
  const dy = Math.abs(a.row - b.row);

  return Math.sqrt(dx * dx + dy * dy);
}

function findRoadCellFromLeft(preferredRow: number): GridNode {
  for (let col = 0; col < GRID_COLS; col++) {
    const rows = Array.from({ length: GRID_ROWS }, (_, row) => row).sort(
      (a, b) => Math.abs(a - preferredRow) - Math.abs(b - preferredRow)
    );

    for (const row of rows) {
      if (isRoadCell(row, col)) {
        return { row, col };
      }
    }
  }

  throw new Error('Không tìm thấy ô R ở phía trái map.');
}

function findRoadCellFromRight(preferredRow: number): GridNode {
  for (let col = GRID_COLS - 1; col >= 0; col--) {
    const rows = Array.from({ length: GRID_ROWS }, (_, row) => row).sort(
      (a, b) => Math.abs(a - preferredRow) - Math.abs(b - preferredRow)
    );

    for (const row of rows) {
      if (isRoadCell(row, col)) {
        return { row, col };
      }
    }
  }

  throw new Error('Không tìm thấy ô R ở phía phải map.');
}

function reconstructPath(
  cameFrom: Map<string, GridNode | null>,
  current: GridNode
) {
  const path: GridNode[] = [current];

  let cursor = cameFrom.get(nodeKey(current)) ?? null;

  while (cursor) {
    path.push(cursor);
    cursor = cameFrom.get(nodeKey(cursor)) ?? null;
  }

  return path.reverse();
}

function findAStarPathOnRoad(): GridNode[] {
  const preferredStartRow = Math.floor(GRID_ROWS * 0.38);
  const preferredGoalRow = Math.floor(GRID_ROWS * 0.42);

  const start = findRoadCellFromLeft(preferredStartRow);
  const goal = findRoadCellFromRight(preferredGoalRow);

  const openSet: GridNode[] = [start];

  const cameFrom = new Map<string, GridNode | null>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  cameFrom.set(nodeKey(start), null);
  gScore.set(nodeKey(start), 0);
  fScore.set(nodeKey(start), heuristic(start, goal));

  const directions = [
    { row: -1, col: 0, cost: 1 },
    { row: 1, col: 0, cost: 1 },
    { row: 0, col: -1, cost: 1 },
    { row: 0, col: 1, cost: 1 },
    { row: -1, col: -1, cost: Math.SQRT2 },
    { row: -1, col: 1, cost: Math.SQRT2 },
    { row: 1, col: -1, cost: Math.SQRT2 },
    { row: 1, col: 1, cost: Math.SQRT2 },
  ];

  while (openSet.length > 0) {
    openSet.sort((a, b) => {
      return (fScore.get(nodeKey(a)) ?? Infinity) - (fScore.get(nodeKey(b)) ?? Infinity);
    });

    const current = openSet.shift()!;

    if (current.row === goal.row && current.col === goal.col) {
      return reconstructPath(cameFrom, current);
    }

    for (const direction of directions) {
      const neighbor = {
        row: current.row + direction.row,
        col: current.col + direction.col,
      };

      if (!isRoadCell(neighbor.row, neighbor.col)) continue;

      const currentKey = nodeKey(current);
      const neighborKey = nodeKey(neighbor);

      const tentativeGScore = (gScore.get(currentKey) ?? Infinity) + direction.cost;

      if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, goal));

        const alreadyOpen = openSet.some(
          (node) => node.row === neighbor.row && node.col === neighbor.col
        );

        if (!alreadyOpen) {
          openSet.push(neighbor);
        }
      }
    }
  }

  throw new Error('A* không tìm được đường đi liên tục qua các ô R.');
}

function isSegmentOnRoad(start: GridNode, end: GridNode) {
  const steps = Math.max(
    Math.abs(end.row - start.row),
    Math.abs(end.col - start.col),
    1
  ) * 3;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const row = Math.round(start.row + (end.row - start.row) * t);
    const col = Math.round(start.col + (end.col - start.col) * t);

    if (!isRoadCell(row, col)) {
      return false;
    }
  }

  return true;
}

function smoothRoadPath(path: GridNode[]) {
  if (path.length <= 2) return path;

  const result: GridNode[] = [];
  let currentIndex = 0;

  result.push(path[currentIndex]);

  while (currentIndex < path.length - 1) {
    let nextIndex = path.length - 1;

    while (
      nextIndex > currentIndex + 1 &&
      !isSegmentOnRoad(path[currentIndex], path[nextIndex])
    ) {
      nextIndex--;
    }

    result.push(path[nextIndex]);
    currentIndex = nextIndex;
  }

  return result;
}

function createEnemyPathFromAStar(): Point[] {
  const rawPath = findAStarPathOnRoad();
  const smoothPath = smoothRoadPath(rawPath);
  
  return smoothPath.map((node) => gridToPercent(node.row, node.col));
}

const ENEMY_PATH: Point[] = createEnemyPathFromAStar();

function moveEnemy(enemy: GameEnemy, deltaSeconds: number): GameEnemy | null {
  if (enemy.spawnDelay > 0) {
    return {
      ...enemy,
      spawnDelay: Math.max(0, enemy.spawnDelay - deltaSeconds * 1000),
    };
  }

  let nextEnemy = { ...enemy };
  let remainingStep = enemy.speed * deltaSeconds;

  while (remainingStep > 0) {
    const target = ENEMY_PATH[nextEnemy.pathIndex + 1];

    if (!target) {
      return null;
    }

    const dx = target.x - nextEnemy.x;
    const dy = target.y - nextEnemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.05) {
      nextEnemy = {
        ...nextEnemy,
        x: target.x,
        y: target.y,
        pathIndex: nextEnemy.pathIndex + 1,
      };

      continue;
    }

    if (remainingStep >= dist) {
      nextEnemy = {
        ...nextEnemy,
        x: target.x,
        y: target.y,
        pathIndex: nextEnemy.pathIndex + 1,
      };

      remainingStep -= dist;
    } else {
      nextEnemy = {
        ...nextEnemy,
        x: nextEnemy.x + (dx / dist) * remainingStep,
        y: nextEnemy.y + (dy / dist) * remainingStep,
      };

      remainingStep = 0;
    }
  }

  return nextEnemy;
}

function getProjectileColor(type: TowerType) {
  if (type === 'crossbow') return '#facc15';
  if (type === 'magic') return '#38bdf8';
  return '#a855f7';
}

export function GameMap({ onBack }: GameMapProps) {
  const [game, setGame] = useState<GameState>(() => createInitialGameState());
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const lastTimeRef = useRef<number | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  const selectedTower = TOWER_SHOP.find((tower) => tower.type === selectedTowerType);

  const showNotice = (message: string) => {
    setNotice(message);

    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }

    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice(null);
    }, 1800);
  };

  const startWave = () => {
    setGame((prev) => {
      if (prev.enemies.length > 0) {
        showNotice('Wave đang chạy!');
        return prev;
      }

      if (prev.health <= 0) {
        showNotice('Game over rồi!');
        return prev;
      }

      if (ENEMY_PATH.length < 2) {
        showNotice('Đường đi của quái chưa hợp lệ!');
        return prev;
      }

      const enemyHp = 100 + prev.wave * 18;
      const enemySpeed = 7.5 + prev.wave * 0.45;
      const enemyReward = 14 + prev.wave * 2;

      const newEnemies: GameEnemy[] = Array.from({ length: 6 + prev.wave }, (_, index) => ({
        id: Date.now() + index,
        x: ENEMY_PATH[0].x,
        y: ENEMY_PATH[0].y,
        hp: enemyHp,
        maxHp: enemyHp,
        speed: enemySpeed,
        pathIndex: 0,
        spawnDelay: index * 650,
        size: 100,
        reward: enemyReward,
      }));

      return {
        ...prev,
        enemies: newEnemies,
        wave: prev.wave + 1,
      };
    });
  };

  const placeTower = (event: MouseEvent<HTMLDivElement>) => {
    if (!selectedTower) return;

    if (game.health <= 0) {
      showNotice('Game over rồi, không thể đặt tháp!');
      return;
    }

    if (game.coins < selectedTower.cost) {
      showNotice('Không đủ vàng!');
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (x < 1 || x > 99 || y < 1 || y > 99) {
      showNotice('Không thể đặt tháp sát mép bản đồ!');
      return;
    }

    const terrain = getTerrainAtPercent(x, y);

    if (!isTowerPlaceableAtPercent(x, y)) {
      showNotice(getTerrainMessage(terrain));
      return;
    }

    const tooCloseToTower = game.placedTowers.some((tower) => {
      return distance({ x, y }, { x: tower.x, y: tower.y }) < 5.5;
    });

    if (tooCloseToTower) {
      showNotice('Không thể đặt quá gần tháp khác!');
      return;
    }

    const newTower: PlacedTower = {
      id: Date.now(),
      type: selectedTower.type,
      x,
      y,
      size: selectedTower.size,
      range: selectedTower.range,
      damage: selectedTower.damage,
      fireRate: selectedTower.fireRate,
      lastShotTime: 0,
    };

    setGame((prev) => {
      if (prev.coins < selectedTower.cost) return prev;

      return {
        ...prev,
        coins: prev.coins - selectedTower.cost,
        placedTowers: [...prev.placedTowers, newTower],
      };
    });

    showNotice(`Đã đặt ${selectedTower.name}!`);
    setSelectedTowerType(null);
  };

  const resetGame = () => {
    setGame(createInitialGameState());
    setIsPaused(false);
    setSelectedTowerType(null);
    setNotice(null);
    lastTimeRef.current = null;
  };

  useEffect(() => {
    let animationId: number;

    const gameLoop = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const deltaSeconds = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      if (!isPaused) {
        setGame((prev) => {
          const activeProjectiles = prev.projectiles.filter(
            (projectile) => time - projectile.createdAt < PROJECTILE_LIFETIME
          );

          if (prev.health <= 0 || prev.enemies.length === 0) {
            if (activeProjectiles.length === prev.projectiles.length) {
              return prev;
            }

            return {
              ...prev,
              projectiles: activeProjectiles,
            };
          }

          let escapedCount = 0;
          let earnedCoins = 0;
          let nextEnemies: GameEnemy[] = [];
          let nextProjectiles: ProjectileEffect[] = [...activeProjectiles];

          for (const enemy of prev.enemies) {
            const movedEnemy = moveEnemy(enemy, deltaSeconds);

            if (!movedEnemy) {
              escapedCount += 1;
              continue;
            }

            nextEnemies.push(movedEnemy);
          }

          let nextTowers = prev.placedTowers;

          for (const tower of prev.placedTowers) {
            const shootDelay = 1000 / tower.fireRate;

            if (time - tower.lastShotTime < shootDelay) continue;

            const possibleTargets = nextEnemies.filter((enemy) => {
              if (enemy.spawnDelay > 0 || enemy.hp <= 0) return false;

              return distance({ x: tower.x, y: tower.y }, { x: enemy.x, y: enemy.y }) <= tower.range;
            });

            if (possibleTargets.length === 0) continue;

            const target = possibleTargets.reduce((best, current) => {
              if (current.pathIndex > best.pathIndex) return current;
              if (current.pathIndex < best.pathIndex) return best;

              const currentDist = distance(
                { x: tower.x, y: tower.y },
                { x: current.x, y: current.y }
              );

              const bestDist = distance(
                { x: tower.x, y: tower.y },
                { x: best.x, y: best.y }
              );

              return currentDist < bestDist ? current : best;
            });

            nextTowers = nextTowers.map((item) => {
              if (item.id !== tower.id) return item;

              return {
                ...item,
                lastShotTime: time,
              };
            });

            nextProjectiles.push({
              id: Date.now() + Math.random(),
              fromX: tower.x,
              fromY: tower.y,
              toX: target.x,
              toY: target.y,
              type: tower.type,
              createdAt: time,
            });

            nextEnemies = nextEnemies.map((enemy) => {
              if (enemy.id !== target.id) return enemy;

              return {
                ...enemy,
                hp: enemy.hp - tower.damage,
              };
            });
          }

          const aliveEnemies = nextEnemies.filter((enemy) => {
            if (enemy.hp <= 0) {
              earnedCoins += enemy.reward;
              return false;
            }

            return true;
          });

          return {
            ...prev,
            health: Math.max(0, prev.health - escapedCount),
            coins: prev.coins + earnedCoins,
            enemies: aliveEnemies,
            placedTowers: nextTowers,
            projectiles: nextProjectiles,
          };
        });
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="size-full relative bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
      <style>
        {`
          @keyframes projectileFade {
            0% {
              opacity: 1;
              filter: drop-shadow(0 0 8px currentColor);
            }

            100% {
              opacity: 0;
              filter: drop-shadow(0 0 0px currentColor);
            }
          }

          @keyframes hitFlash {
            0% {
              opacity: 0.95;
              transform: scale(0.5);
            }

            100% {
              opacity: 0;
              transform: scale(1.8);
            }
          }
        `}
      </style>

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
              <span className="text-white font-bold text-xl">{game.health}</span>
            </div>

            <div className="flex items-center gap-2 bg-yellow-500/20 border-2 border-yellow-500 px-4 py-2 rounded-lg">
              <Coins className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="text-white font-bold text-xl">{game.coins}</span>
            </div>

            <div className="flex items-center gap-2 bg-purple-500/20 border-2 border-purple-500 px-4 py-2 rounded-lg">
              <Shield className="w-6 h-6 text-purple-500" />
              <span className="text-white font-bold text-xl">Wave {game.wave}</span>
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

      <div className="absolute inset-0 flex pt-20">
        <div className="flex-1 flex items-center justify-center p-2">
          <div
            onClick={placeTower}
            className={`relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border-4 ${
              selectedTowerType ? 'border-green-400 cursor-crosshair' : 'border-amber-600'
            }`}
          >
            <img
              src={mapImage}
              alt="Game Map"
              className="absolute inset-0 w-full h-full object-fill z-0"
            />

            {notice && (
              <div className="absolute left-1/2 top-4 -translate-x-1/2 bg-slate-900/90 border-2 border-amber-400 text-white px-5 py-3 rounded-xl font-bold z-40 shadow-xl">
                {notice}
              </div>
            )}

            {selectedTower && (
              <div className="absolute left-1/2 top-4 -translate-x-1/2 bg-green-600/90 text-white px-4 py-2 rounded-lg font-bold z-40 shadow-lg">
                Đang chọn {selectedTower.name} - click vào bãi cỏ để đặt
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none z-10">
              {game.placedTowers.map((tower) => (
                <div
                  key={`range-${tower.id}`}
                  className="absolute rounded-full border border-yellow-300/15 bg-yellow-300/5"
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
              {game.placedTowers.map((tower) => (
                <div
                  key={tower.id}
                  className="absolute"
                  style={{
                    left: `${tower.x}%`,
                    top: `${tower.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <TowerSprite type={tower.type} size={tower.size} />
                </div>
              ))}
            </div>

            <svg
              className="absolute inset-0 pointer-events-none w-full h-full"
              style={{ zIndex: 25 }}
            >
              {game.projectiles.map((projectile) => {
                const color = getProjectileColor(projectile.type);

                return (
                  <g
                    key={projectile.id}
                    style={{
                      color,
                      animation: isPaused ? 'none' : 'projectileFade 360ms ease-out forwards',
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
                        animation: isPaused ? 'none' : 'hitFlash 360ms ease-out forwards',
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="absolute inset-0 pointer-events-none z-30">
              {game.enemies
                .filter((enemy) => enemy.spawnDelay <= 0)
                .map((enemy) => (
                  <div
                    key={enemy.id}
                    className="absolute"
                    style={{
                      left: `${enemy.x}%`,
                      top: `${enemy.y}%`,
                      transform: 'translate3d(-50%, -50%, 0)',
                      willChange: 'left, top, transform',
                    }}
                  >
                    <EnemySprite
                      size={enemy.size}
                      animation="walkSide"
                      paused={isPaused}
                      speed={70}
                    />

                    <div className="absolute left-1/2 -top-2 w-16 h-2 bg-black/70 rounded-full overflow-hidden border border-white/30 -translate-x-1/2">
                      <div
                        className="h-full bg-red-500"
                        style={{
                          width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {isPaused && game.health > 0 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="text-center">
                  <h2 className="text-6xl font-black text-white mb-4">TẠM DỪNG</h2>
                  <p className="text-2xl text-gray-300">Nhấn Tiếp tục để chơi</p>
                </div>
              </div>
            )}

            {game.health <= 0 && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="text-center">
                  <h2 className="text-6xl font-black text-red-500 mb-4">GAME OVER</h2>
                  <p className="text-2xl text-gray-300 mb-6">
                    Quái đã vượt qua phòng thủ!
                  </p>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      resetGame();
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-xl border-2 border-red-400"
                  >
                    Chơi lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 border-l-2 border-amber-500/50 p-4 overflow-y-auto">
          <h3 className="text-2xl font-bold text-amber-400 mb-4 text-center border-b-2 border-amber-500 pb-2">
            Chọn Tháp
          </h3>

          <div className="space-y-3">
            {TOWER_SHOP.map((tower) => (
              <button
                key={tower.type}
                onClick={() => {
                  if (game.coins < tower.cost) {
                    showNotice('Không đủ vàng!');
                    return;
                  }

                  setSelectedTowerType(tower.type);
                  showNotice(`Đã chọn ${tower.name}`);
                }}
                className={`w-full bg-gradient-to-r border-2 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 ${
                  selectedTowerType === tower.type
                    ? 'from-green-700 to-green-800 border-green-300'
                    : 'from-slate-700 to-slate-800 hover:from-amber-600 hover:to-amber-700 border-amber-500/50 hover:border-amber-400'
                } ${game.coins < tower.cost ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={game.health <= 0}
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

                      <p className="text-xs text-gray-300 mt-1">
                        DMG {tower.damage} | Range {tower.range}
                      </p>
                    </div>
                  </div>

                  {game.coins >= tower.cost && (
                    <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                      {selectedTowerType === tower.type ? 'Đang chọn' : 'Chọn'}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={startWave}
            disabled={game.enemies.length > 0 || game.health <= 0}
            className={`w-full mt-6 text-white px-6 py-4 rounded-xl font-bold text-xl shadow-xl transition-all duration-300 transform border-2 ${
              game.enemies.length > 0 || game.health <= 0
                ? 'bg-gray-600 border-gray-500 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:scale-105 border-red-400'
            }`}
          >
            {game.enemies.length > 0 ? 'Wave đang chạy' : `Bắt đầu Wave ${game.wave}`}
          </button>

          <button
            onClick={resetGame}
            className="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold border-2 border-slate-500"
          >
            Chơi lại
          </button>
        </div>
      </div>
    </div>
  );
}