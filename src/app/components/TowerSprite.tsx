import { useEffect, useRef, useState } from 'react';
import towersSheetUrl from '../../imports/towers-hd.png?url';
import { TOWER_ATLAS, TowerType } from './towerAtlas';

interface TowerSpriteProps {
  type?: TowerType;
  size?: number;
  selected?: boolean;
}

function drawTowerFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: (typeof TOWER_ATLAS)[TowerType],
  size: number
) {
  ctx.clearRect(0, 0, size, size);

  const [sx, sy, sw, sh] = frame.textureRect;
  const [cx, cy, cw, ch] = frame.colorRect;
  const [sourceW, sourceH] = frame.sourceSize;

  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = sourceW;
  frameCanvas.height = sourceH;

  const frameCtx = frameCanvas.getContext('2d');
  if (!frameCtx) return;

  const cutCanvas = document.createElement('canvas');
  cutCanvas.width = cw;
  cutCanvas.height = ch;

  const cutCtx = cutCanvas.getContext('2d');
  if (!cutCtx) return;

  if (frame.rotated) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sw;
    tempCanvas.height = sh;

    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    cutCtx.save();
    cutCtx.translate(0, ch);
    cutCtx.rotate(-Math.PI / 2);
    cutCtx.drawImage(tempCanvas, 0, 0);
    cutCtx.restore();
  } else {
    cutCtx.drawImage(image, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  frameCtx.drawImage(cutCanvas, cx, cy, cw, ch);

  const scale = size / Math.max(sourceW, sourceH);
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  const dx = (size - drawW) / 2;
  const dy = (size - drawH) / 2;

  // Bóng dưới tower
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.filter = 'blur(2px)';
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 0.78, size * 0.28, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(frameCanvas, dx, dy, drawW, drawH);
}

export function TowerSprite({
  type = 'crossbow',
  size = 88,
  selected = false,
}: TowerSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = towersSheetUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageReady(true);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !imageReady) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawTowerFrame(ctx, image, TOWER_ATLAS[type], size);
  }, [imageReady, type, size]);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        filter: selected ? 'drop-shadow(0 0 10px #facc15)' : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          display: 'block',
        }}
      />
    </div>
  );
}