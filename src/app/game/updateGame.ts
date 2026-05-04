import { PROJECTILE_LIFETIME } from './constants';
import { distance } from './math';
import { moveEnemy } from './path';
import type { GameEnemy, GameState, PlacedBlocker, ProjectileEffect } from './types';

function calculateVictoryStars(health: number, maxHealth: number) {
  if (health <= 0) return 0;

  const healthRatio = health / maxHealth;

  if (healthRatio >= 0.75) return 3;
  if (healthRatio >= 0.4) return 2;
  return 1;
}

export function updateGame(prev: GameState, time: number, deltaSeconds: number): GameState {
  const activeProjectiles = prev.projectiles.filter(
    (projectile) => time - projectile.createdAt < PROJECTILE_LIFETIME
  );

  if (prev.status !== 'playing') {
    if (activeProjectiles.length === prev.projectiles.length) {
      return prev;
    }

    return {
      ...prev,
      projectiles: activeProjectiles,
    };
  }

  if (prev.health <= 0) {
    return {
      ...prev,
      status: 'defeat',
      projectiles: activeProjectiles,
    };
  }

  if (prev.enemies.length === 0) {
    if (activeProjectiles.length === prev.projectiles.length) {
      return prev;
    }

    return {
      ...prev,
      projectiles: activeProjectiles,
    };
  }

  let goalDamage = 0;
  let earnedCoins = 0;
  let nextEnemies: GameEnemy[] = [];
  let nextBlockers: PlacedBlocker[] = prev.placedBlockers;
  let nextProjectiles: ProjectileEffect[] = [...activeProjectiles];

  for (const enemy of prev.enemies) {
    nextBlockers = nextBlockers.filter((blocker) => blocker.hp > 0);

    const result = moveEnemy(enemy, deltaSeconds, nextBlockers);

    if (result.attackedGoal) {
      goalDamage += enemy.enemyType === 'boss' ? 3 : 1;
    }

    if (!result.enemy) {
      continue;
    }

    if (result.attackedBlockerId) {
      nextBlockers = nextBlockers.map((blocker) => {
        if (blocker.id !== result.attackedBlockerId) return blocker;

        return {
          ...blocker,
          hp: blocker.hp - result.enemy!.attackDamage * deltaSeconds,
        };
      });

      nextBlockers = nextBlockers.filter((blocker) => blocker.hp > 0);
    }

    nextEnemies.push(result.enemy);
  }

  nextBlockers = nextBlockers.filter((blocker) => blocker.hp > 0);
  const activeBlockerIds = new Set(nextBlockers.map((blocker) => blocker.id));

  nextEnemies = nextEnemies.map((enemy) => {
    if (enemy.attackingBlockerId === null || activeBlockerIds.has(enemy.attackingBlockerId)) {
      return enemy;
    }

    return {
      ...enemy,
      attackingBlockerId: null,
      path: [],
      pathIndex: 0,
    };
  });

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

      const currentDist = distance({ x: tower.x, y: tower.y }, { x: current.x, y: current.y });
      const bestDist = distance({ x: tower.x, y: tower.y }, { x: best.x, y: best.y });

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

  const nextHealth = Math.max(0, prev.health - goalDamage);
  const waveCleared = prev.enemies.length > 0 && aliveEnemies.length === 0;
  const completedWaves = prev.completedWaves + (waveCleared ? 1 : 0);
  const waveClearBonus = waveCleared && nextHealth > 0 ? 18 + completedWaves * 6 : 0;
  const didWin = nextHealth > 0 && completedWaves >= prev.maxWaves;
  const nextStatus = nextHealth <= 0 ? 'defeat' : didWin ? 'victory' : 'playing';
  const victoryStars = didWin ? calculateVictoryStars(nextHealth, prev.maxHealth) : prev.victoryStars;

  return {
    ...prev,
    health: nextHealth,
    coins: prev.coins + earnedCoins + waveClearBonus,
    completedWaves,
    status: nextStatus,
    score: prev.score + earnedCoins * 5 + waveClearBonus * 8 + (waveCleared ? 120 : 0),
    victoryStars,
    enemies: aliveEnemies,
    placedTowers: nextTowers,
    placedBlockers: nextBlockers,
    projectiles: nextProjectiles,
  };
}
