import {
  GRID_COLS,
  GRID_ROWS,
  getTerrainAtGrid,
  getTerrainAtPercent,
  gridToPercent,
  percentToGrid,
} from './mapGrid';
import { distance } from './math';
import type { GameEnemy, GridNode, PlacedBlocker, Point } from './types';

interface Direction {
  row: number;
  col: number;
  cost: number;
}

interface MoveEnemyResult {
  enemy: GameEnemy | null;
  attackedBlockerId: number | null;
  attackedGoal: boolean;
}

const DIRECTIONS: Direction[] = [
  { row: -1, col: 0, cost: 1 },
  { row: 1, col: 0, cost: 1 },
  { row: 0, col: -1, cost: 1 },
  { row: 0, col: 1, cost: 1 },
  { row: -1, col: -1, cost: Math.SQRT2 },
  { row: -1, col: 1, cost: Math.SQRT2 },
  { row: 1, col: -1, cost: Math.SQRT2 },
  { row: 1, col: 1, cost: Math.SQRT2 },
];

const preferredStartRow = Math.floor(GRID_ROWS * 0.16);
const preferredGoalRow = Math.floor(GRID_ROWS * 0.9);
export const BLOCKER_GRID_RADIUS = 3;

function blockerKey(row: number, col: number) {
  return `${row},${col}`;
}

export function getBlockerFootprintCells(blocker: Pick<PlacedBlocker, 'row' | 'col'>) {
  const cells: GridNode[] = [];

  for (let row = blocker.row - BLOCKER_GRID_RADIUS; row <= blocker.row + BLOCKER_GRID_RADIUS; row++) {
    for (let col = blocker.col - BLOCKER_GRID_RADIUS; col <= blocker.col + BLOCKER_GRID_RADIUS; col++) {
      if (row < 0 || row >= GRID_ROWS) continue;
      if (col < 0 || col >= GRID_COLS) continue;
      if (getTerrainAtGrid(row, col) !== 'R') continue;

      cells.push({ row, col });
    }
  }

  return cells;
}

function createBlockedCellSet(blockers: readonly PlacedBlocker[]) {
  return new Set(
    blockers.flatMap((blocker) => {
      return getBlockerFootprintCells(blocker).map((cell) => blockerKey(cell.row, cell.col));
    })
  );
}

function isBlockedCell(row: number, col: number, blockedCells: Set<string>) {
  return blockedCells.has(blockerKey(row, col));
}

function isRoadCell(row: number, col: number, blockedCells = new Set<string>()) {
  if (row < 0 || row >= GRID_ROWS) return false;
  if (col < 0 || col >= GRID_COLS) return false;
  if (isBlockedCell(row, col, blockedCells)) return false;

  return getTerrainAtGrid(row, col) === 'R';
}

function nodeKey(node: GridNode) {
  return `${node.row},${node.col}`;
}

function heuristic(a: GridNode, b: GridNode) {
  const dx = Math.abs(a.col - b.col);
  const dy = Math.abs(a.row - b.row);

  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}

function findRoadCellFromLeft(preferredRow: number, blockedCells = new Set<string>()): GridNode {
  let best: GridNode | null = null;
  let bestScore = Infinity;
  const rowWeight = 3;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (!isRoadCell(row, col, blockedCells)) continue;

      const score = col + Math.abs(row - preferredRow) * rowWeight;

      if (score < bestScore) {
        best = { row, col };
        bestScore = score;
      }
    }
  }

  if (best) return best;

  throw new Error('Không tìm thấy ô R ở phía trái map.');
}

function findRoadCellFromRight(preferredRow: number, blockedCells = new Set<string>()): GridNode {
  let best: GridNode | null = null;
  let bestScore = Infinity;
  const rowWeight = 3;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = GRID_COLS - 1; col >= 0; col--) {
      if (!isRoadCell(row, col, blockedCells)) continue;

      const score = GRID_COLS - 1 - col + Math.abs(row - preferredRow) * rowWeight;

      if (score < bestScore) {
        best = { row, col };
        bestScore = score;
      }
    }
  }

  if (best) return best;

  throw new Error('Không tìm thấy ô R ở phía phải map.');
}

function findNearestRoadCell(point: Point, blockedCells: Set<string>): GridNode | null {
  const current = percentToGrid(point.x, point.y);

  if (isRoadCell(current.row, current.col, blockedCells)) {
    return current;
  }

  let best: GridNode | null = null;
  let bestDistance = Infinity;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (!isRoadCell(row, col, blockedCells)) continue;

      const candidatePoint = gridToPercent(row, col);
      const candidateDistance = distance(point, candidatePoint);

      if (candidateDistance < bestDistance) {
        best = { row, col };
        bestDistance = candidateDistance;
      }
    }
  }

  return best;
}

function reconstructPath(cameFrom: Map<string, GridNode | null>, current: GridNode) {
  const path: GridNode[] = [current];
  let cursor = cameFrom.get(nodeKey(current)) ?? null;

  while (cursor) {
    path.push(cursor);
    cursor = cameFrom.get(nodeKey(cursor)) ?? null;
  }

  return path.reverse();
}

function findAStarPathOnRoad(start: GridNode, goal: GridNode, blockedCells: Set<string>) {
  const openSet: GridNode[] = [start];
  const cameFrom = new Map<string, GridNode | null>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  cameFrom.set(nodeKey(start), null);
  gScore.set(nodeKey(start), 0);
  fScore.set(nodeKey(start), heuristic(start, goal));

  while (openSet.length > 0) {
    openSet.sort((a, b) => {
      return (fScore.get(nodeKey(a)) ?? Infinity) - (fScore.get(nodeKey(b)) ?? Infinity);
    });

    const current = openSet.shift()!;

    if (current.row === goal.row && current.col === goal.col) {
      return reconstructPath(cameFrom, current);
    }

    for (const direction of DIRECTIONS) {
      const neighbor = {
        row: current.row + direction.row,
        col: current.col + direction.col,
      };

      if (!isRoadCell(neighbor.row, neighbor.col, blockedCells)) continue;

      const isDiagonalMove = direction.row !== 0 && direction.col !== 0;

      if (isDiagonalMove) {
        const sideA = { row: current.row + direction.row, col: current.col };
        const sideB = { row: current.row, col: current.col + direction.col };

        if (!isRoadCell(sideA.row, sideA.col, blockedCells) || !isRoadCell(sideB.row, sideB.col, blockedCells)) {
          continue;
        }
      }

      if (!isSegmentOnRoad(current, neighbor, blockedCells)) continue;

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

  return null;
}

function isPercentPointOnRoad(x: number, y: number, blockedCells: Set<string>) {
  if (x < 0 || x > 100 || y < 0 || y > 100) return false;

  const { row, col } = percentToGrid(x, y);

  if (isBlockedCell(row, col, blockedCells)) return false;

  return getTerrainAtPercent(x, y) === 'R';
}

function isSegmentOnRoad(start: GridNode, end: GridNode, blockedCells: Set<string>) {
  const startPoint = gridToPercent(start.row, start.col);
  const endPoint = gridToPercent(end.row, end.col);
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const segmentLength = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(Math.ceil(segmentLength * 6), 12);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = startPoint.x + dx * t;
    const y = startPoint.y + dy * t;

    if (!isPercentPointOnRoad(x, y, blockedCells)) {
      return false;
    }
  }

  return true;
}

function isPointSegmentBlocked(start: Point, end: Point, blockers: readonly PlacedBlocker[]) {
  if (blockers.length === 0) return false;

  const blockedCells = createBlockedCellSet(blockers);
  const segmentLength = distance(start, end);
  const steps = Math.max(Math.ceil(segmentLength * 6), 12);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    const { row, col } = percentToGrid(x, y);

    if (isBlockedCell(row, col, blockedCells)) {
      return true;
    }
  }

  return false;
}

function smoothRoadPath(path: GridNode[], blockedCells: Set<string>) {
  if (path.length <= 2) return path;

  const result: GridNode[] = [];
  let currentIndex = 0;

  result.push(path[currentIndex]);

  while (currentIndex < path.length - 1) {
    let nextIndex = path.length - 1;

    while (
      nextIndex > currentIndex + 1 &&
      !isSegmentOnRoad(path[currentIndex], path[nextIndex], blockedCells)
    ) {
      nextIndex--;
    }

    result.push(path[nextIndex]);
    currentIndex = nextIndex;
  }

  return result;
}

export function findEnemyPath(blockers: readonly PlacedBlocker[], fromPoint?: Point): Point[] | null {
  const blockedCells = createBlockedCellSet(blockers);
  let start: GridNode | null;
  let goal: GridNode;

  try {
    start = fromPoint
      ? findNearestRoadCell(fromPoint, blockedCells)
      : findRoadCellFromLeft(preferredStartRow, blockedCells);
    goal = findRoadCellFromRight(preferredGoalRow, blockedCells);
  } catch {
    return null;
  }

  if (!start) return null;

  const rawPath = findAStarPathOnRoad(start, goal, blockedCells);

  if (!rawPath) return null;

  const smoothPath = smoothRoadPath(rawPath, blockedCells).map((node) =>
    gridToPercent(node.row, node.col)
  );

  if (!fromPoint) return smoothPath;

  const firstPoint = smoothPath[0];

  if (!firstPoint || distance(fromPoint, firstPoint) < 0.05) {
    return smoothPath;
  }

  return [fromPoint, ...smoothPath];
}

function createEnemyPathFromAStar(): Point[] {
  return findEnemyPath([]) ?? [];
}

export const ENEMY_PATH: Point[] = createEnemyPathFromAStar();

function findClosestBlocker(point: Point, blockers: readonly PlacedBlocker[]) {
  return blockers.reduce<PlacedBlocker | null>((closest, blocker) => {
    if (!closest) return blocker;

    return distance(point, blocker) < distance(point, closest) ? blocker : closest;
  }, null);
}

function getBlockerAttackPoint(point: Point, blocker: PlacedBlocker) {
  const dx = point.x - blocker.x;
  const dy = point.y - blocker.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const attackDistance = 3.2;

  if (dist === 0) return point;

  return {
    x: blocker.x + (dx / dist) * attackDistance,
    y: blocker.y + (dy / dist) * attackDistance,
  };
}

function reachGoal(): MoveEnemyResult {
  return {
    enemy: null,
    attackedBlockerId: null,
    attackedGoal: true,
  };
}

function holdOrAttackBlocker(
  enemy: GameEnemy,
  blockers: readonly PlacedBlocker[],
  deltaSeconds: number
): MoveEnemyResult {
  const blocker = findClosestBlocker(enemy, blockers);

  if (!blocker) {
    return {
      enemy: {
        ...enemy,
        path: [],
        pathIndex: 0,
        attackingBlockerId: null,
        attackingGoal: false,
      },
      attackedBlockerId: null,
      attackedGoal: false,
    };
  }

  const attackPoint = getBlockerAttackPoint(enemy, blocker);
  const distanceToAttackPoint = distance(enemy, attackPoint);
  const step = enemy.speed * deltaSeconds;
  const isInAttackPosition = distanceToAttackPoint <= 0.15;

  if (!isInAttackPosition) {
    const nextPoint =
      step >= distanceToAttackPoint
        ? attackPoint
        : {
            x: enemy.x + ((attackPoint.x - enemy.x) / distanceToAttackPoint) * step,
            y: enemy.y + ((attackPoint.y - enemy.y) / distanceToAttackPoint) * step,
          };

    return {
      enemy: {
        ...enemy,
        ...nextPoint,
        path: [],
        pathIndex: 0,
        attackingBlockerId: null,
        attackingGoal: false,
      },
      attackedBlockerId: null,
      attackedGoal: false,
    };
  }

  return {
    enemy: {
      ...enemy,
      ...attackPoint,
      path: [],
      pathIndex: 0,
      attackingBlockerId: blocker.id,
      attackingGoal: false,
    },
    attackedBlockerId: blocker.id,
    attackedGoal: false,
  };
}

function isAtPathGoal(enemy: GameEnemy) {
  const goal = enemy.path[enemy.path.length - 1];

  if (!goal) return false;

  return distance(enemy, goal) < 0.75;
}

function getUsablePath(enemy: GameEnemy, blockers: readonly PlacedBlocker[]) {
  const path = enemy.path.length > 0 ? enemy.path : findEnemyPath(blockers, enemy) ?? [];
  const pathIndex = enemy.path.length > 0 ? enemy.pathIndex : 0;

  if (path.length < 2) {
    return null;
  }

  const target = path[pathIndex + 1];

  if (!target || isPointSegmentBlocked(enemy, target, blockers)) {
    const reroutedPath = findEnemyPath(blockers, enemy);

    return reroutedPath ? { path: reroutedPath, pathIndex: 0 } : null;
  }

  return { path, pathIndex };
}

export function moveEnemy(
  enemy: GameEnemy,
  deltaSeconds: number,
  blockers: readonly PlacedBlocker[]
): MoveEnemyResult {
  if (enemy.spawnDelay > 0) {
    return {
      enemy: {
        ...enemy,
        spawnDelay: Math.max(0, enemy.spawnDelay - deltaSeconds * 1000),
      },
      attackedBlockerId: null,
      attackedGoal: false,
    };
  }

  let nextEnemy = { ...enemy, attackingBlockerId: null, attackingGoal: false };

  if (enemy.attackingGoal) {
    return reachGoal();
  }

  if (nextEnemy.path.length > 0 && nextEnemy.pathIndex >= nextEnemy.path.length - 1) {
    if (isAtPathGoal(nextEnemy)) {
      return reachGoal();
    }

    nextEnemy = {
      ...nextEnemy,
      path: [],
      pathIndex: 0,
    };
  }

  let route = getUsablePath(nextEnemy, blockers);

  if (!route || route.path.length < 2) {
    return holdOrAttackBlocker(nextEnemy, blockers, deltaSeconds);
  }

  let currentPath = route.path;

  nextEnemy = {
    ...nextEnemy,
    path: currentPath,
    pathIndex: route.pathIndex,
  };

  let remainingStep = nextEnemy.speed * deltaSeconds;
  let rerouteAttempts = 0;

  while (remainingStep > 0) {
    const target = currentPath[nextEnemy.pathIndex + 1];

    if (!target) {
      if (isAtPathGoal(nextEnemy)) {
        return reachGoal();
      }

      rerouteAttempts += 1;
      currentPath = findEnemyPath(blockers, nextEnemy);

      if (
        !currentPath ||
        currentPath.length < 2 ||
        rerouteAttempts > 2 ||
        isPointSegmentBlocked(nextEnemy, currentPath[1], blockers)
      ) {
        return holdOrAttackBlocker(nextEnemy, blockers, deltaSeconds);
      }

      nextEnemy = {
        ...nextEnemy,
        path: currentPath,
        pathIndex: 0,
      };

      continue;
    }

    if (isPointSegmentBlocked(nextEnemy, target, blockers)) {
      rerouteAttempts += 1;
      currentPath = findEnemyPath(blockers, nextEnemy);

      if (
        !currentPath ||
        currentPath.length < 2 ||
        rerouteAttempts > 2 ||
        isPointSegmentBlocked(nextEnemy, currentPath[1], blockers)
      ) {
        return holdOrAttackBlocker(nextEnemy, blockers, deltaSeconds);
      }

      nextEnemy = {
        ...nextEnemy,
        path: currentPath,
        pathIndex: 0,
      };

      continue;
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

      if (nextEnemy.pathIndex >= currentPath.length - 1) {
        return reachGoal();
      }

      continue;
    }

    if (remainingStep >= dist) {
      nextEnemy = {
        ...nextEnemy,
        x: target.x,
        y: target.y,
        pathIndex: nextEnemy.pathIndex + 1,
      };

      if (nextEnemy.pathIndex >= currentPath.length - 1) {
        return reachGoal();
      }

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

  return {
    enemy: nextEnemy,
    attackedBlockerId: null,
    attackedGoal: false,
  };
}
