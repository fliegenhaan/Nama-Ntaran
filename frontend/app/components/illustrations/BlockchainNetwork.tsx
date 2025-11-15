export default function BlockchainNetworkIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Central Node */}
      <g id="central-node">
        <circle cx="200" cy="150" r="30" fill="#667eea" opacity="0.2" />
        <circle cx="200" cy="150" r="20" fill="#667eea" />
        <circle cx="200" cy="150" r="10" fill="#ffffff" opacity="0.5" />
      </g>

      {/* Outer Nodes */}
      <g id="outer-nodes">
        {/* Top */}
        <circle cx="200" cy="50" r="15" fill="#4facfe" />
        <line x1="200" y1="130" x2="200" y2="65" stroke="#667eea" strokeWidth="2" opacity="0.5" />

        {/* Right */}
        <circle cx="320" cy="150" r="15" fill="#764ba2" />
        <line x1="220" y1="150" x2="305" y2="150" stroke="#667eea" strokeWidth="2" opacity="0.5" />

        {/* Bottom */}
        <circle cx="200" cy="250" r="15" fill="#fbbf24" />
        <line x1="200" y1="170" x2="200" y2="235" stroke="#667eea" strokeWidth="2" opacity="0.5" />

        {/* Left */}
        <circle cx="80" cy="150" r="15" fill="#ef4444" />
        <line x1="180" y1="150" x2="95" y2="150" stroke="#667eea" strokeWidth="2" opacity="0.5" />
      </g>

      {/* Data Flow Animation Points */}
      <g id="data-flow">
        <circle cx="200" cy="90" r="4" fill="#ffffff">
          <animate attributeName="cy" values="65;130;65" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="260" cy="150" r="4" fill="#ffffff">
          <animate attributeName="cx" values="305;220;305" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="210" r="4" fill="#ffffff">
          <animate attributeName="cy" values="235;170;235" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="140" cy="150" r="4" fill="#ffffff">
          <animate attributeName="cx" values="95;180;95" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Labels */}
      <text x="200" y="40" textAnchor="middle" fill="#667eea" fontSize="12" fontWeight="bold">
        Pemerintah
      </text>
      <text x="335" y="155" textAnchor="start" fill="#764ba2" fontSize="12" fontWeight="bold">
        Katering
      </text>
      <text x="200" y="275" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">
        Sekolah
      </text>
      <text x="65" y="155" textAnchor="end" fill="#ef4444" fontSize="12" fontWeight="bold">
        Publik
      </text>
    </svg>
  );
}
