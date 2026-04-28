export const ENEMY_ANIMATIONS = {
  walkSide: [
    { name: 'SaurianElite_0001.png', textureRect: [238, 276, 66, 88], rotated: true, colorRect: [19, 25, 88, 66], sourceSize: [148, 104] },
    { name: 'SaurianElite_0003.png', textureRect: [360, 0, 70, 82], rotated: true, colorRect: [23, 21, 82, 70], sourceSize: [148, 104] },
    { name: 'SaurianElite_0005.png', textureRect: [496, 166, 70, 76], rotated: true, colorRect: [27, 20, 76, 70], sourceSize: [148, 104] },
    { name: 'SaurianElite_0007.png', textureRect: [568, 236, 70, 74], rotated: true, colorRect: [28, 20, 74, 70], sourceSize: [148, 104] },
    { name: 'SaurianElite_0008.png', textureRect: [726, 384, 68, 72], rotated: true, colorRect: [30, 22, 72, 68], sourceSize: [148, 104] },
    { name: 'SaurianElite_0010.png', textureRect: [716, 146, 66, 70], rotated: true, colorRect: [33, 27, 70, 66], sourceSize: [148, 104] },
    { name: 'SaurianElite_0012.png', textureRect: [782, 218, 68, 68], rotated: false, colorRect: [34, 25, 68, 68], sourceSize: [148, 104] },
    { name: 'SaurianElite_0014.png', textureRect: [640, 236, 70, 72], rotated: false, colorRect: [33, 21, 70, 72], sourceSize: [148, 104] },
    { name: 'SaurianElite_0016.png', textureRect: [608, 312, 72, 72], rotated: false, colorRect: [30, 20, 72, 72], sourceSize: [148, 104] },
    { name: 'SaurianElite_0018.png', textureRect: [500, 0, 70, 76], rotated: true, colorRect: [27, 20, 76, 70], sourceSize: [148, 104] },
    { name: 'SaurianElite_0019.png', textureRect: [308, 362, 68, 82], rotated: true, colorRect: [23, 22, 82, 68], sourceSize: [148, 104] },
    { name: 'SaurianElite_0021.png', textureRect: [294, 0, 64, 88], rotated: true, colorRect: [20, 27, 88, 64], sourceSize: [148, 104] },
  ],

  walkFront: [
    { name: 'SaurianElite_0023.png', textureRect: [646, 0, 64, 72], rotated: false, colorRect: [43, 26, 64, 72], sourceSize: [148, 104] },
    { name: 'SaurianElite_0025.png', textureRect: [448, 334, 66, 76], rotated: false, colorRect: [42, 22, 66, 76], sourceSize: [148, 104] },
    { name: 'SaurianElite_0027.png', textureRect: [572, 0, 72, 74], rotated: false, colorRect: [39, 21, 72, 74], sourceSize: [148, 104] },
    { name: 'SaurianElite_0029.png', textureRect: [568, 160, 74, 74], rotated: false, colorRect: [38, 21, 74, 74], sourceSize: [148, 104] },
    { name: 'SaurianElite_0030.png', textureRect: [436, 426, 72, 76], rotated: true, colorRect: [37, 23, 76, 72], sourceSize: [148, 104] },
    { name: 'SaurianElite_0032.png', textureRect: [712, 222, 68, 70], rotated: false, colorRect: [42, 28, 68, 70], sourceSize: [148, 104] },
    { name: 'SaurianElite_0034.png', textureRect: [644, 76, 64, 72], rotated: false, colorRect: [43, 26, 64, 72], sourceSize: [148, 104] },
    { name: 'SaurianElite_0036.png', textureRect: [510, 412, 66, 76], rotated: false, colorRect: [42, 22, 66, 76], sourceSize: [148, 104] },
    { name: 'SaurianElite_0038.png', textureRect: [570, 78, 72, 74], rotated: false, colorRect: [39, 21, 72, 74], sourceSize: [148, 104] },
    { name: 'SaurianElite_0040.png', textureRect: [578, 400, 74, 74], rotated: false, colorRect: [38, 21, 74, 74], sourceSize: [148, 104] },
    { name: 'SaurianElite_0041.png', textureRect: [442, 256, 72, 76], rotated: true, colorRect: [37, 23, 76, 72], sourceSize: [148, 104] },
    { name: 'SaurianElite_0043.png', textureRect: [712, 0, 68, 70], rotated: false, colorRect: [42, 28, 68, 70], sourceSize: [148, 104] },
  ],
} as const;

export type EnemyAnimationName = keyof typeof ENEMY_ANIMATIONS;