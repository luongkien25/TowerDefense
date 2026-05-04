interface GameMapStylesProps {
  reducedEffects: boolean;
}

export function GameMapStyles({ reducedEffects }: GameMapStylesProps) {
  return (
    <style>
      {`
        @keyframes projectileFade {
          0% {
            opacity: 1;
            filter: drop-shadow(0 0 8px currentColor);
          }

          100% {
            opacity: 0;
            filter: drop-shadow(0 0 0px currentColor);
          }
        }

        @keyframes hitFlash {
          0% {
            opacity: 0.95;
            transform: scale(0.5);
          }

          100% {
            opacity: 0;
            transform: scale(1.8);
          }
        }

        @keyframes enemyAttackLunge {
          0%, 100% {
            transform: translate3d(-50%, -50%, 0) scale(1);
          }

          35% {
            transform: translate3d(-46%, -50%, 0) scale(1.08);
          }

          60% {
            transform: translate3d(-52%, -50%, 0) scale(0.98);
          }
        }

        @keyframes blockerHitShake {
          0%, 100% {
            filter: brightness(1);
          }

          25% {
            filter: brightness(1.35);
          }

          40% {
            transform: translate(-50%, -50%) rotate(var(--blocker-rotation)) translateX(-3px);
          }

          70% {
            transform: translate(-50%, -50%) rotate(var(--blocker-rotation)) translateX(3px);
          }
        }

        ${reducedEffects ? '* { animation-duration: 1ms !important; transition-duration: 1ms !important; }' : ''}
      `}
    </style>
  );
}
