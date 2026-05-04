interface RoadBlockerSpriteProps {
  damaged: boolean;
}

export function RoadBlockerSprite({ damaged }: RoadBlockerSpriteProps) {
  return (
    <div
      className={`relative size-full drop-shadow-[0_8px_8px_rgba(0,0,0,0.45)] ${
        damaged ? 'brightness-90 saturate-90' : ''
      }`}
    >
      <div className="absolute left-1/2 top-[58%] h-[22%] w-[82%] -translate-x-1/2 -translate-y-1/2 rotate-[-9deg] rounded-full border border-amber-950/70 bg-gradient-to-b from-amber-700 to-amber-950 shadow-md" />
      <div className="absolute left-1/2 top-[50%] h-[22%] w-[88%] -translate-x-1/2 -translate-y-1/2 rotate-[8deg] rounded-full border border-amber-950/70 bg-gradient-to-b from-yellow-800 to-amber-950 shadow-md" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 86"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M8 68 C18 51 26 45 38 58 C45 31 64 24 76 45 C88 47 95 55 94 69 C73 81 29 82 8 68Z"
          fill="#26231f"
          opacity="0.28"
        />

        <path
          d="M12 57 L27 32 L43 39 L52 17 L73 31 L89 58 L73 73 L30 72Z"
          fill="#6b665c"
          stroke="#2f2b25"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <path d="M27 32 L35 58 L12 57Z" fill="#817a6d" opacity="0.95" />
        <path d="M43 39 L35 58 L52 17Z" fill="#9a9182" opacity="0.9" />
        <path d="M52 17 L63 58 L73 31Z" fill="#756f64" />
        <path d="M73 31 L63 58 L89 58Z" fill="#8c8476" />
        <path d="M30 72 L35 58 L63 58 L73 73Z" fill="#4f4b43" />

        {damaged && (
          <>
            <path
              d="M45 40 L39 54 L50 50 L44 66"
              fill="none"
              stroke="#2c2924"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M66 43 L59 54 L69 57"
              fill="none"
              stroke="#2c2924"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        <path
          d="M17 57 L28 39 M53 19 L43 42 M75 35 L85 56"
          fill="none"
          stroke="#c7bfae"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
