export default function FoodDeliveryIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Food Delivery Person */}
      <g id="delivery-person">
        {/* Body */}
        <ellipse cx="200" cy="180" rx="40" ry="60" fill="#667eea" opacity="0.8" />

        {/* Head */}
        <circle cx="200" cy="140" r="25" fill="#fbbf24" />

        {/* Helmet */}
        <path
          d="M 180 135 Q 180 120 200 120 Q 220 120 220 135 Z"
          fill="#4facfe"
        />

        {/* Food Box */}
        <rect x="230" y="160" width="50" height="50" rx="5" fill="#764ba2" opacity="0.9" />
        <rect x="235" y="165" width="40" height="40" rx="3" fill="#ffffff" opacity="0.3" />

        {/* Steam from food */}
        <path d="M 245 155 Q 245 145 250 145" stroke="#667eea" strokeWidth="2" opacity="0.6" />
        <path d="M 255 155 Q 255 140 260 140" stroke="#667eea" strokeWidth="2" opacity="0.6" />
        <path d="M 265 155 Q 265 145 270 145" stroke="#667eea" strokeWidth="2" opacity="0.6" />
      </g>

      {/* School Building */}
      <g id="school">
        <rect x="50" y="200" width="80" height="60" fill="#4facfe" opacity="0.8" />
        <polygon points="50,200 90,170 130,200" fill="#667eea" />

        {/* Windows */}
        <rect x="60" y="210" width="15" height="15" fill="#ffffff" opacity="0.7" />
        <rect x="85" y="210" width="15" height="15" fill="#ffffff" opacity="0.7" />
        <rect x="105" y="210" width="15" height="15" fill="#ffffff" opacity="0.7" />

        {/* Door */}
        <rect x="85" y="235" width="15" height="25" fill="#764ba2" />
      </g>

      {/* Blockchain Network Lines */}
      <g id="blockchain-network" opacity="0.4">
        <line x1="130" y1="220" x2="180" y2="180" stroke="#667eea" strokeWidth="2" strokeDasharray="5,5" />
        <line x1="230" y1="180" x2="280" y2="220" stroke="#4facfe" strokeWidth="2" strokeDasharray="5,5" />
        <circle cx="130" cy="220" r="5" fill="#667eea" />
        <circle cx="230" cy="180" r="5" fill="#4facfe" />
        <circle cx="280" cy="220" r="5" fill="#764ba2" />
      </g>

      {/* Floating Food Icons */}
      <g id="food-icons" opacity="0.6">
        {/* Apple */}
        <circle cx="320" cy="100" r="15" fill="#ef4444" />
        <path d="M 320 85 Q 320 80 325 80" stroke="#22c55e" strokeWidth="2" />

        {/* Carrot */}
        <path d="M 80 100 L 70 130 L 90 130 Z" fill="#f97316" />
        <path d="M 80 100 L 75 90 L 85 90 Z" fill="#22c55e" />

        {/* Rice Bowl */}
        <ellipse cx="350" cy="200" rx="20" ry="12" fill="#fbbf24" />
        <rect x="330" y="195" width="40" height="15" fill="#fbbf24" opacity="0.8" />
      </g>
    </svg>
  );
}
