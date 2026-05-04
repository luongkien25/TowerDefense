import { useEffect, useRef, useState, type MouseEvent } from 'react';

import { GameBoard } from './game/GameBoard';
import { GameHud } from './game/GameHud';
import { GameMapStyles } from './game/GameMapStyles';
import { TowerShopPanel } from './game/TowerShopPanel';
import {
  createInitialGameState,
  getBlockerRepairCost,
  getBlockerUpgradeCost,
  getTowerUpgradeCost,
  MAX_BLOCKER_LEVEL,
  MAX_TOWER_LEVEL,
  ROAD_BLOCKER_ITEM,
  TOWER_SHOP,
} from '../game/constants';
import {
  getTerrainAtPercent,
  getTerrainMessage,
  gridToPercent,
  isTowerPlaceableAtPercent,
  percentToGrid,
} from '../game/mapGrid';
import { distance } from '../game/math';
import { ENEMY_PATH, getBlockerFootprintCells } from '../game/path';
import { updateGame } from '../game/updateGame';
import type {
  BuildItemType,
  BuildShopItem,
  EnemyType,
  GameEnemy,
  GameSettings,
  GameState,
  LevelConfig,
  PlacedBlocker,
  PlacedTower,
  PlayerUpgrades,
} from '../game/types';

interface GameMapProps {
  level: LevelConfig;
  settings: GameSettings;
  upgrades: PlayerUpgrades;
  onBack: () => void;
  onLevelComplete: (result: { levelId: LevelConfig['id']; score: number; stars: number }) => void;
}

type SelectedEntity =
  | { kind: 'tower'; id: number }
  | { kind: 'blocker'; id: number };

const ENEMY_TEMPLATES: Record<
  EnemyType,
  {
    hp: number;
    speed: number;
    reward: number;
    size: number;
    damage: number;
  }
> = {
  grunt: { hp: 1, speed: 1, reward: 1, size: 42, damage: 1 },
  runner: { hp: 0.68, speed: 1.45, reward: 1.15, size: 38, damage: 0.85 },
  brute: { hp: 2.15, speed: 0.72, reward: 2.25, size: 52, damage: 1.55 },
  boss: { hp: 7.2, speed: 0.52, reward: 8, size: 68, damage: 2.5 },
};

function buildWaveLineup(wave: number, maxWaves: number): EnemyType[] {
  const lineup: EnemyType[] = Array.from({ length: 5 + wave }, () => 'grunt');

  if (wave >= 2) {
    for (let i = 0; i < Math.ceil(wave / 2); i++) {
      lineup.splice(Math.min(lineup.length, i * 3 + 2), 0, 'runner');
    }
  }

  if (wave >= 3) {
    for (let i = 0; i < Math.floor(wave / 3); i++) {
      lineup.splice(Math.min(lineup.length, i * 5 + 4), 0, 'brute');
    }
  }

  if (wave % 5 === 0 || wave === maxWaves) {
    lineup.push('boss');
  }

  return lineup;
}

function createEnemyWave(wave: number, level: LevelConfig): GameEnemy[] {
  const baseHp = (88 + wave * 21) * level.difficultyMultiplier;
  const baseSpeed = (7.4 + wave * 0.34) * Math.min(1.16, level.difficultyMultiplier);
  const baseReward = 12 + wave * 2;
  const baseDamage = 24 + wave * 2;
  const lineup = buildWaveLineup(wave, level.maxWaves);
  const seed = Date.now();

  return lineup.map((enemyType, index) => {
    const template = ENEMY_TEMPLATES[enemyType];
    const hp = Math.round(baseHp * template.hp);

    return {
      id: seed + index,
      enemyType,
      x: ENEMY_PATH[0].x,
      y: ENEMY_PATH[0].y,
      hp,
      maxHp: hp,
      speed: Number((baseSpeed * template.speed).toFixed(2)),
      path: ENEMY_PATH,
      pathIndex: 0,
      spawnDelay: index * 610,
      size: template.size,
      reward: Math.round(baseReward * template.reward),
      attackDamage: Math.round(baseDamage * template.damage),
      attackRange: 1,
      attackingBlockerId: null,
      attackingGoal: false,
      goalAttackCooldown: 0,
    };
  });
}

export function GameMap({ level, settings, upgrades, onBack, onLevelComplete }: GameMapProps) {
  const [game, setGame] = useState<GameState>(() => createInitialGameState(level, upgrades));
  const [isPaused, setIsPaused] = useState(false);
  const [selectedBuildType, setSelectedBuildType] = useState<BuildItemType | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const lastTimeRef = useRef<number | null>(null);
  const simulatedTimeRef = useRef(0);
  const noticeTimeoutRef = useRef<number | null>(null);
  const reportedLevelCompleteRef = useRef(false);
  const selectedShopTower = TOWER_SHOP.find((tower) => tower.type === selectedBuildType);
  const selectedBuildItem =
    selectedShopTower ?? (selectedBuildType === ROAD_BLOCKER_ITEM.type ? ROAD_BLOCKER_ITEM : undefined);
  const selectedTower =
    selectedEntity?.kind === 'tower'
      ? game.placedTowers.find((tower) => tower.id === selectedEntity.id)
      : undefined;
  const selectedBlocker =
    selectedEntity?.kind === 'blocker'
      ? game.placedBlockers.find((blocker) => blocker.id === selectedEntity.id)
      : undefined;

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

      if (prev.status !== 'playing') {
        showNotice('Màn này đã kết thúc.');
        return prev;
      }

      if (prev.wave > prev.maxWaves) {
        showNotice('Không còn wave để bắt đầu.');
        return prev;
      }

      if (ENEMY_PATH.length < 2) {
        showNotice('Đường đi của quái chưa hợp lệ!');
        return prev;
      }

      return {
        ...prev,
        enemies: createEnemyWave(prev.wave, level),
        wave: prev.wave + 1,
      };
    });
  };

  const placeBuildItem = (event: MouseEvent<HTMLDivElement>) => {
    if (!selectedBuildItem) {
      setSelectedEntity(null);
      return;
    }

    if (game.status !== 'playing') {
      showNotice('Màn đã kết thúc, không thể xây thêm.');
      return;
    }

    if (game.coins < selectedBuildItem.cost) {
      showNotice('Không đủ vàng!');
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (x < 1 || x > 99 || y < 1 || y > 99) {
      showNotice('Không thể đặt sát mép bản đồ!');
      return;
    }

    const terrain = getTerrainAtPercent(x, y);

    if (selectedBuildItem.type === ROAD_BLOCKER_ITEM.type) {
      if (terrain !== 'R') {
        showNotice('Vật chặn chỉ đặt được trên đường!');
        return;
      }

      const { row, col } = percentToGrid(x, y);
      const footprintCells = getBlockerFootprintCells({ row, col });
      const footprintKeys = new Set(
        footprintCells.map((cell) => {
          return `${cell.row},${cell.col}`;
        })
      );
      const blockerExists = game.placedBlockers.some((blocker) => {
        return getBlockerFootprintCells(blocker).some((cell) =>
          footprintKeys.has(`${cell.row},${cell.col}`)
        );
      });

      if (blockerExists) {
        showNotice('Vùng đường này đã có vật chặn!');
        return;
      }

      const enemyOnCell = game.enemies.some((enemy) => {
        if (enemy.spawnDelay > 0) return false;

        const enemyCell = percentToGrid(enemy.x, enemy.y);

        return footprintKeys.has(`${enemyCell.row},${enemyCell.col}`);
      });

      if (enemyOnCell) {
        showNotice('Không thể đặt vật chặn đè lên quái!');
        return;
      }

      const point = gridToPercent(row, col);
      const newBlocker: PlacedBlocker = {
        id: Date.now(),
        type: ROAD_BLOCKER_ITEM.type,
        x: point.x,
        y: point.y,
        row,
        col,
        hp: ROAD_BLOCKER_ITEM.maxHp,
        maxHp: ROAD_BLOCKER_ITEM.maxHp,
        size: ROAD_BLOCKER_ITEM.size,
        level: 1,
        totalInvested: ROAD_BLOCKER_ITEM.cost,
      };

      setGame((prev) => {
        if (prev.coins < ROAD_BLOCKER_ITEM.cost) return prev;

        return {
          ...prev,
          coins: prev.coins - ROAD_BLOCKER_ITEM.cost,
          placedBlockers: [...prev.placedBlockers, newBlocker],
        };
      });

      showNotice(`Đã đặt ${ROAD_BLOCKER_ITEM.name}!`);
      setSelectedBuildType(null);
      setSelectedEntity({ kind: 'blocker', id: newBlocker.id });
      return;
    }

    if (!selectedShopTower) return;

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

    const damageBoost = 1 + upgrades.sharpshooters * 0.08;
    const newTower: PlacedTower = {
      id: Date.now(),
      type: selectedShopTower.type,
      x,
      y,
      size: selectedShopTower.size,
      range: selectedShopTower.range,
      damage: Math.round(selectedShopTower.damage * damageBoost),
      fireRate: selectedShopTower.fireRate,
      lastShotTime: 0,
      level: 1,
      totalInvested: selectedShopTower.cost,
    };

    setGame((prev) => {
      if (prev.coins < selectedShopTower.cost) return prev;

      return {
        ...prev,
        coins: prev.coins - selectedShopTower.cost,
        placedTowers: [...prev.placedTowers, newTower],
      };
    });

    showNotice(`Đã đặt ${selectedShopTower.name}!`);
    setSelectedBuildType(null);
    setSelectedEntity({ kind: 'tower', id: newTower.id });
  };

  const selectBuildItem = (item: BuildShopItem) => {
    if (game.coins < item.cost) {
      showNotice('Không đủ vàng!');
      return;
    }

    setSelectedEntity(null);
    setSelectedBuildType(item.type);
    showNotice(`Đã chọn ${item.name}`);
  };

  const selectTower = (towerId: number) => {
    setSelectedBuildType(null);
    setSelectedEntity({ kind: 'tower', id: towerId });
  };

  const selectBlocker = (blockerId: number) => {
    setSelectedBuildType(null);
    setSelectedEntity({ kind: 'blocker', id: blockerId });
  };

  const upgradeSelectedTower = () => {
    if (!selectedTower) return;

    if (selectedTower.level >= MAX_TOWER_LEVEL) {
      showNotice('Tháp đã đạt cấp tối đa.');
      return;
    }

    const cost = getTowerUpgradeCost(selectedTower);

    if (game.coins < cost) {
      showNotice('Không đủ vàng để nâng cấp tháp!');
      return;
    }

    setGame((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      placedTowers: prev.placedTowers.map((tower) => {
        if (tower.id !== selectedTower.id) return tower;

        return {
          ...tower,
          level: tower.level + 1,
          damage: Math.round(tower.damage * 1.34 + tower.level * 2),
          range: Number((tower.range + 1.8).toFixed(1)),
          fireRate: Number((tower.fireRate * 1.14).toFixed(2)),
          size: tower.size + 3,
          totalInvested: tower.totalInvested + cost,
        };
      }),
    }));
    showNotice('Tháp đã được nâng cấp.');
  };

  const sellSelectedTower = () => {
    if (!selectedTower) return;

    const refund = Math.floor(selectedTower.totalInvested * 0.65);

    setGame((prev) => ({
      ...prev,
      coins: prev.coins + refund,
      placedTowers: prev.placedTowers.filter((tower) => tower.id !== selectedTower.id),
    }));
    setSelectedEntity(null);
    showNotice(`Đã bán tháp, hoàn ${refund} vàng.`);
  };

  const upgradeSelectedBlocker = () => {
    if (!selectedBlocker) return;

    if (selectedBlocker.level >= MAX_BLOCKER_LEVEL) {
      showNotice('Vật chặn đã đạt cấp tối đa.');
      return;
    }

    const cost = getBlockerUpgradeCost(selectedBlocker);

    if (game.coins < cost) {
      showNotice('Không đủ vàng để gia cố vật chặn!');
      return;
    }

    setGame((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      placedBlockers: prev.placedBlockers.map((blocker) => {
        if (blocker.id !== selectedBlocker.id) return blocker;

        const nextMaxHp = Math.round(blocker.maxHp * 1.45);

        return {
          ...blocker,
          level: blocker.level + 1,
          maxHp: nextMaxHp,
          hp: Math.min(nextMaxHp, blocker.hp + Math.round(nextMaxHp * 0.45)),
          size: blocker.size + 4,
          totalInvested: blocker.totalInvested + cost,
        };
      }),
    }));
    showNotice('Vật chặn đã được gia cố.');
  };

  const repairSelectedBlocker = () => {
    if (!selectedBlocker) return;

    const cost = getBlockerRepairCost(selectedBlocker);

    if (cost <= 0) {
      showNotice('Vật chặn đang đầy máu.');
      return;
    }

    if (game.coins < cost) {
      showNotice('Không đủ vàng để sửa vật chặn!');
      return;
    }

    setGame((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      placedBlockers: prev.placedBlockers.map((blocker) => {
        if (blocker.id !== selectedBlocker.id) return blocker;

        return {
          ...blocker,
          hp: blocker.maxHp,
        };
      }),
    }));
    showNotice('Vật chặn đã được sửa.');
  };

  const sellSelectedBlocker = () => {
    if (!selectedBlocker) return;

    const refund = Math.floor(selectedBlocker.totalInvested * 0.5);

    setGame((prev) => ({
      ...prev,
      coins: prev.coins + refund,
      placedBlockers: prev.placedBlockers.filter((blocker) => blocker.id !== selectedBlocker.id),
    }));
    setSelectedEntity(null);
    showNotice(`Đã bán vật chặn, hoàn ${refund} vàng.`);
  };

  const resetGame = () => {
    setGame(createInitialGameState(level, upgrades));
    setIsPaused(false);
    setSelectedBuildType(null);
    setSelectedEntity(null);
    setNotice(null);
    lastTimeRef.current = null;
    simulatedTimeRef.current = 0;
    reportedLevelCompleteRef.current = false;
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
        const scaledDeltaSeconds = deltaSeconds * settings.gameSpeed;
        simulatedTimeRef.current += scaledDeltaSeconds * 1000;
        setGame((prev) => updateGame(prev, simulatedTimeRef.current, scaledDeltaSeconds));
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [isPaused, settings.gameSpeed]);

  useEffect(() => {
    if (!selectedEntity) return;

    if (
      selectedEntity.kind === 'tower' &&
      !game.placedTowers.some((tower) => tower.id === selectedEntity.id)
    ) {
      setSelectedEntity(null);
    }

    if (
      selectedEntity.kind === 'blocker' &&
      !game.placedBlockers.some((blocker) => blocker.id === selectedEntity.id)
    ) {
      setSelectedEntity(null);
    }
  }, [game.placedBlockers, game.placedTowers, selectedEntity]);

  useEffect(() => {
    if (game.status !== 'victory' || reportedLevelCompleteRef.current) return;

    reportedLevelCompleteRef.current = true;
    onLevelComplete({
      levelId: game.levelId,
      score: game.score,
      stars: game.victoryStars,
    });
  }, [game.levelId, game.score, game.status, game.victoryStars, onLevelComplete]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="size-full relative bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
      <GameMapStyles reducedEffects={settings.reducedEffects} />

      <GameHud
        coins={game.coins}
        completedWaves={game.completedWaves}
        health={game.health}
        isPaused={isPaused}
        levelName={game.levelName}
        maxWaves={game.maxWaves}
        onBack={onBack}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        status={game.status}
      />

      <div className="absolute inset-0 flex pt-20">
        <GameBoard
          game={game}
          gameSpeed={settings.gameSpeed}
          isPaused={isPaused}
          notice={notice}
          onBack={onBack}
          onPlaceBuildItem={placeBuildItem}
          onResetGame={resetGame}
          onSelectBlocker={selectBlocker}
          onSelectTower={selectTower}
          reducedEffects={settings.reducedEffects}
          selectedBlockerId={selectedEntity?.kind === 'blocker' ? selectedEntity.id : null}
          selectedBuildItem={selectedBuildItem}
          selectedBuildType={selectedBuildType}
          selectedTowerId={selectedEntity?.kind === 'tower' ? selectedEntity.id : null}
          showRanges={settings.showRanges}
        />

        <TowerShopPanel
          blocker={ROAD_BLOCKER_ITEM}
          coins={game.coins}
          enemyCount={game.enemies.length}
          health={game.health}
          maxWaves={game.maxWaves}
          onClearSelection={() => setSelectedEntity(null)}
          onRepairBlocker={repairSelectedBlocker}
          onResetGame={resetGame}
          onSelectItem={selectBuildItem}
          onSellBlocker={sellSelectedBlocker}
          onSellTower={sellSelectedTower}
          onStartWave={startWave}
          onUpgradeBlocker={upgradeSelectedBlocker}
          onUpgradeTower={upgradeSelectedTower}
          selectedBlocker={selectedBlocker}
          selectedBuildType={selectedBuildType}
          selectedTower={selectedTower}
          status={game.status}
          towers={TOWER_SHOP}
          wave={game.wave}
        />
      </div>
    </div>
  );
}
