import { useEffect, useRef, useState } from 'react';
import enemiesSheetUrl from '../../imports/enemies_underground_2-hd.png?url';
import { ENEMY_ANIMATIONS, EnemyAnimationName } from './enemyAtlas';

interface EnemySpriteProps {
  size?: number;
  animation?: EnemyAnimationName;
  paused?: boolean;
  flipX?: boolean;
  speed?: number;
}

const ENEMY_FRAME_WIDTH = 148;
const ENEMY_FRAME_HEIGHT = 104;

function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: (typeof ENEMY_ANIMATIONS)[EnemyAnimationName][number],
  size: number
) {
  ctx.clearRect(0, 0, size, size);

  const [sx, sy, sw, sh] = frame.textureRect;
  const [cx, cy, cw, ch] = frame.colorRect;
  const [sourceW, sourceH] = frame.sourceSize;
  const stableSourceW = Math.max(sourceW, ENEMY_FRAME_WIDTH);
  const stableSourceH = Math.max(sourceH, ENEMY_FRAME_HEIGHT);
  const stableOffsetX = (stableSourceW - sourceW) / 2;
  const stableOffsetY = stableSourceH - sourceH;

  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = stableSourceW;
  frameCanvas.height = stableSourceH;

  const frameCtx = frameCanvas.getContext('2d');
  if (!frameCtx) return;

  const cutCanvas = document.createElement('canvas');
  cutCanvas.width = cw;
  cutCanvas.height = ch;

  const cutCtx = cutCanvas.getContext('2d');
  if (!cutCtx) return;

  if (frame.rotated) {
    cutCtx.save();
    cutCtx.translate(0, ch);
    cutCtx.rotate(-Math.PI / 2);
    cutCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    cutCtx.restore();
  } else {
    cutCtx.drawImage(image, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  frameCtx.drawImage(cutCanvas, cx + stableOffsetX, cy + stableOffsetY, cw, ch);

  const scale = size / Math.max(stableSourceW, stableSourceH);
  const drawW = stableSourceW * scale;
  const drawH = stableSourceH * scale;
  const dx = (size - drawW) / 2;
  const dy = (size - drawH) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.filter = 'blur(2px)';
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 0.78, size * 0.2, size * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(frameCanvas, dx, dy, drawW, drawH);
}

export function EnemySprite({
  size = 110,
  animation = 'walkSide',
  paused = false,
  flipX = false,
  speed = 75,
}: EnemySpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageReady, setImageReady] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = ENEMY_ANIMATIONS[animation];
  const currentFrame = frames[frameIndex % frames.length];

  useEffect(() => {
    const img = new Image();
    img.src = enemiesSheetUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageReady(true);
    };
  }, []);

  useEffect(() => {
    setFrameIndex(0);
  }, [animation]);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, speed);

    return () => clearInterval(interval);
  }, [paused, speed, frames.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !imageReady) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawFrame(ctx, image, currentFrame, size);
  }, [currentFrame, imageReady, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        display: 'block',
        transform: flipX ? 'scaleX(-1)' : undefined,
      }}
    />
  );
}
