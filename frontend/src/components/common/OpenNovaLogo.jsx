const OpenNovaLogo = ({ size = 48, className = "" }) => {
  // Generate unique ID for this instance to avoid conflicts
  const uniqueId = `opennova-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-xl"
      >
        <defs>
          {/* Primary Gradient */}
          <linearGradient id={`primary-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="25%" stopColor="#3B82F6" />
            <stop offset="75%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          
          {/* Accent Gradient */}
          <linearGradient id={`accent-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          
          {/* Glow Filter */}
          <filter id={`glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Shadow Filter */}
          <filter id={`shadow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25"/>
          </filter>
        </defs>
        
        {/* Main Container - Hexagonal Shape */}
        <polygon
          points="60,8 95,30 95,90 60,112 25,90 25,30"
          fill={`url(#primary-${uniqueId})`}
          filter={`url(#shadow-${uniqueId})`}
        />
        
        {/* Inner Hexagon */}
        <polygon
          points="60,18 85,35 85,85 60,102 35,85 35,35"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        
        {/* Central Innovation Symbol */}
        <g transform="translate(60,60)" filter={`url(#glow-${uniqueId})`}>
          {/* Central Star/Nova Symbol */}
          <g>
            {/* Main Star Points */}
            <polygon
              points="0,-20 6,-6 20,-6 10,2 16,16 0,8 -16,16 -10,2 -20,-6 -6,-6"
              fill="white"
              opacity="0.95"
            />
            
            {/* Inner Core */}
            <circle cx="0" cy="0" r="6" fill="white" opacity="0.8"/>
            
            {/* Energy Rings */}
            <circle cx="0" cy="0" r="12" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="0" cy="0" r="16" fill="none" stroke="white" strokeWidth="1" opacity="0.4"/>
          </g>
        </g>
        
        {/* Corner Innovation Nodes */}
        <g transform="translate(60,60)">
          {/* Top Node - Hotels */}
          <g transform="translate(0,-35)">
            <circle r="5" fill={`url(#accent-${uniqueId})`} opacity="0.9">
              <animate attributeName="r" values="5;7;5" dur="3s" repeatCount="indefinite"/>
            </circle>
            <text y="2" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">🏨</text>
          </g>
          
          {/* Right Node - Shops */}
          <g transform="translate(30,18)">
            <circle r="4" fill="white" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text y="2" textAnchor="middle" fill="#3B82F6" fontSize="7" fontWeight="bold">🛍️</text>
          </g>
          
          {/* Bottom Right Node - Hospitals */}
          <g transform="translate(30,-18)">
            <circle r="4.5" fill={`url(#accent-${uniqueId})`} opacity="0.7">
              <animate attributeName="r" values="4.5;6;4.5" dur="4s" repeatCount="indefinite"/>
            </circle>
            <text y="2" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">🏥</text>
          </g>
          
          {/* Left Nodes */}
          <g transform="translate(-30,18)">
            <circle r="3.5" fill="white" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite"/>
            </circle>
          </g>
          
          <g transform="translate(-30,-18)">
            <circle r="3" fill={`url(#accent-${uniqueId})`} opacity="0.5">
              <animate attributeName="r" values="3;5;3" dur="3.5s" repeatCount="indefinite"/>
            </circle>
          </g>
        </g>
        
        {/* Rotating Connection Lines */}
        <g transform="translate(60,60)">
          <g opacity="0.3">
            <line x1="-25" y1="-25" x2="25" y2="25" stroke="white" strokeWidth="0.5" strokeDasharray="4,2">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;360"
                dur="20s"
                repeatCount="indefinite"
              />
            </line>
            <line x1="25" y1="-25" x2="-25" y2="25" stroke="white" strokeWidth="0.5" strokeDasharray="4,2">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;-360"
                dur="25s"
                repeatCount="indefinite"
              />
            </line>
          </g>
        </g>
        
        {/* Outer Pulse Ring */}
        <polygon
          points="60,4 98,28 98,92 60,116 22,92 22,28"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        >
          <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite"/>
        </polygon>
      </svg>
    </div>
  );
};

export default OpenNovaLogo;