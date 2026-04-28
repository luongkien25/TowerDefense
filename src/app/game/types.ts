export interface Point {
  x: number;
  y: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  alive: boolean;
}

export interface Tower {
  id: number;
  x: number;
  y: number;
  type: 'crossbow' | 'magic' | 'necromancer';
  range: number;
  damage: number;
  fireRate: number;
  lastShotTime: number;
}