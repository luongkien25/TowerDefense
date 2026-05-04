export type TowerType = 'crossbow' | 'magic' | 'necromancer';
export type BlockerType = 'roadBlocker';
export type BuildItemType = TowerType | BlockerType;
export type EnemyType = 'grunt' | 'runner' | 'brute' | 'boss';
export type GameStatus = 'playing' | 'victory' | 'defeat';
export type LevelId = 'meadow' | 'stone-pass' | 'ancient-ruins';
export type PlayerUpgradeId = 'fortitude' | 'treasury' | 'sharpshooters';
export type GameSpeed = 1 | 1.5 | 2;

export interface Point {
  x: number;
  y: number;
}

export interface GridNode {
  row: number;
  col: number;
}

export interface LevelConfig {
  id: LevelId;
  name: string;
  subtitle: string;
  description: string;
  maxWaves: number;
  startingCoins: number;
  startingHealth: number;
  difficultyMultiplier: number;
  rewardStars: number;
}

export type PlayerUpgrades = Record<PlayerUpgradeId, number>;

export interface GameSettings {
  gameSpeed: GameSpeed;
  showRanges: boolean;
  reducedEffects: boolean;
}

export interface GameEnemy {
  id: number;
  enemyType: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  path: Point[];
  pathIndex: number;
  spawnDelay: number;
  size: number;
  reward: number;
  attackDamage: number;
  attackRange: number;
  attackingBlockerId: number | null;
  attackingGoal: boolean;
  goalAttackCooldown: number;
}

export interface PlacedTower {
  id: number;
  type: TowerType;
  x: number;
  y: number;
  size: number;
  range: number;
  damage: number;
  fireRate: number;
  lastShotTime: number;
  level: number;
  totalInvested: number;
}

export interface TowerShopItem {
  type: TowerType;
  name: string;
  cost: number;
  icon: string;
  size: number;
  range: number;
  damage: number;
  fireRate: number;
  description: string;
}

export interface BlockerShopItem {
  type: BlockerType;
  name: string;
  cost: number;
  icon: string;
  size: number;
  maxHp: number;
  description: string;
}

export type BuildShopItem = TowerShopItem | BlockerShopItem;

export interface PlacedBlocker {
  id: number;
  type: BlockerType;
  x: number;
  y: number;
  row: number;
  col: number;
  hp: number;
  maxHp: number;
  size: number;
  level: number;
  totalInvested: number;
}

export interface ProjectileEffect {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: TowerType;
  createdAt: number;
}

export interface GameState {
  health: number;
  maxHealth: number;
  coins: number;
  wave: number;
  completedWaves: number;
  maxWaves: number;
  levelId: LevelId;
  levelName: string;
  status: GameStatus;
  score: number;
  victoryStars: number;
  enemies: GameEnemy[];
  placedTowers: PlacedTower[];
  placedBlockers: PlacedBlocker[];
  projectiles: ProjectileEffect[];
}
