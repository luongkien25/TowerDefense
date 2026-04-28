export const TOWER_ATLAS = {
  crossbow: {
    name: 'CossbowHunter_tower.png',
    textureRect: [368, 410, 88, 114],
    rotated: true,
    colorRect: [4, 2, 114, 88],
    sourceSize: [136, 92],
  },

  magic: {
    name: 'ArchMageTower.png',
    textureRect: [1194, 192, 112, 92],
    rotated: false,
    colorRect: [3, 1, 112, 92],
    sourceSize: [128, 96],
  },

  necromancer: {
    name: 'NecromancerTower.png',
    textureRect: [0, 1298, 130, 96],
    rotated: false,
    colorRect: [3, 0, 130, 96],
    sourceSize: [140, 96],
  },
} as const;

export type TowerType = keyof typeof TOWER_ATLAS;