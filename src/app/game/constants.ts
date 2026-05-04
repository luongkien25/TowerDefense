import type {
  BlockerShopItem,
  GameState,
  LevelConfig,
  PlayerUpgradeId,
  PlayerUpgrades,
  TowerShopItem,
  TowerType,
} from './types';

export const PROJECTILE_LIFETIME = 360;
export const BLOCKER_ATTACK_FLASH_LIFETIME = 220;
export const MAX_TOWER_LEVEL = 3;
export const MAX_BLOCKER_LEVEL = 3;

export const LEVELS: LevelConfig[] = [
  {
    id: 'meadow',
    name: 'Đồi Cỏ',
    subtitle: 'Tuyến phòng thủ đầu tiên',
    description: 'Ít wave hơn, nhiều vàng khởi đầu, phù hợp để dựng nền phòng thủ.',
    maxWaves: 5,
    startingCoins: 330,
    startingHealth: 22,
    difficultyMultiplier: 0.9,
    rewardStars: 3,
  },
  {
    id: 'stone-pass',
    name: 'Đèo Đá',
    subtitle: 'Quái nhanh hơn, ít lỗi được phép hơn',
    description: 'Wave dài hơn và có nhiều quái chạy nhanh, buộc phải nâng cấp tháp sớm.',
    maxWaves: 7,
    startingCoins: 285,
    startingHealth: 20,
    difficultyMultiplier: 1.08,
    rewardStars: 3,
  },
  {
    id: 'ancient-ruins',
    name: 'Tàn Tích Cổ',
    subtitle: 'Boss và đợt tấn công dày đặc',
    description: 'Màn thử thách cuối với boss khỏe, vật chặn cần được sửa đúng lúc.',
    maxWaves: 10,
    startingCoins: 260,
    startingHealth: 18,
    difficultyMultiplier: 1.25,
    rewardStars: 3,
  },
];

export const DEFAULT_PLAYER_UPGRADES: PlayerUpgrades = {
  fortitude: 0,
  treasury: 0,
  sharpshooters: 0,
};

export const PLAYER_UPGRADE_DEFS: Array<{
  id: PlayerUpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
}> = [
  {
    id: 'fortitude',
    name: 'Tường Thành',
    description: '+2 máu thành mỗi cấp.',
    maxLevel: 3,
    baseCost: 2,
  },
  {
    id: 'treasury',
    name: 'Kho Bạc',
    description: '+40 vàng khởi đầu mỗi cấp.',
    maxLevel: 3,
    baseCost: 2,
  },
  {
    id: 'sharpshooters',
    name: 'Kíp Tháp Tinh Nhuệ',
    description: '+8% sát thương tháp khi xây mỗi cấp.',
    maxLevel: 3,
    baseCost: 3,
  },
];

export const TOWER_SHOP: TowerShopItem[] = [
  {
    type: 'crossbow',
    name: 'Tháp Cung',
    cost: 50,
    icon: '🏹',
    size: 82,
    range: 18,
    damage: 18,
    fireRate: 1.8,
    description: 'Rẻ, bắn nhanh, phù hợp dọn quái nhỏ.',
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
    description: 'Sát thương cao, hiệu quả với quái trâu.',
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
    description: 'Cân bằng giữa giá, sát thương và tốc độ bắn.',
  },
];

export const ROAD_BLOCKER_ITEM: BlockerShopItem = {
  type: 'roadBlocker',
  name: 'Vật Chặn Đường',
  cost: 75,
  icon: '🧱',
  size: 54,
  maxHp: 220,
  description: 'Đặt trên đường để kéo dài thời gian quái nằm trong tầm bắn.',
};

export function getUpgradeCost(currentLevel: number, baseCost: number) {
  return baseCost + currentLevel * 2;
}

export function getTowerUpgradeCost(tower: { type: TowerType; level: number }) {
  const shopItem = TOWER_SHOP.find((item) => item.type === tower.type);
  const baseCost = shopItem?.cost ?? 60;

  return Math.round(baseCost * (0.7 + tower.level * 0.45));
}

export function getBlockerUpgradeCost(blocker: { level: number }) {
  return Math.round(55 + blocker.level * 35);
}

export function getBlockerRepairCost(blocker: { hp: number; maxHp: number }) {
  const missingHp = Math.max(0, blocker.maxHp - blocker.hp);

  if (missingHp <= 0) return 0;

  return Math.max(8, Math.ceil((missingHp / blocker.maxHp) * 42));
}

export function createInitialGameState(
  level: LevelConfig = LEVELS[0],
  upgrades: PlayerUpgrades = DEFAULT_PLAYER_UPGRADES
): GameState {
  const maxHealth = level.startingHealth + upgrades.fortitude * 2;

  return {
    health: maxHealth,
    maxHealth,
    coins: level.startingCoins + upgrades.treasury * 40,
    wave: 1,
    completedWaves: 0,
    maxWaves: level.maxWaves,
    levelId: level.id,
    levelName: level.name,
    status: 'playing',
    score: 0,
    victoryStars: 0,
    enemies: [],
    placedTowers: [],
    placedBlockers: [],
    projectiles: [],
  };
}

export function getProjectileColor(type: TowerType) {
  if (type === 'crossbow') return '#facc15';
  if (type === 'magic') return '#38bdf8';
  return '#a855f7';
}
