
import * as React from 'react';

interface Props {
  condition: string;
  className?: string;
}

export const AnimatedWeatherIcon: React.FC<Props> = ({ condition, className = "w-12 h-12" }) => {
  const norm = condition.toLowerCase();

  // Sol (Clear)
  if (norm.includes('clear') || norm.includes('sun')) {
    return (
      <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="12" className="fill-yellow-400 animate-sun-pulse origin-center" />
        <g className="animate-spin-slow origin-center">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="32"
              y1="10"
              x2="32"
              y2="4"
              className="stroke-yellow-400 stroke-[3] stroke-linecap-round"
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
        </g>
      </svg>
    );
  }

  // Nuvens (Clouds)
  if (norm.includes('cloud')) {
    return (
      <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M46 22a14 14 0 0 0-13.6 10.4 10 10 0 0 0-19.4 5.6c0 5.5 4.5 10 10 10h24c7.7 0 14-6.3 14-14s-6.3-14-14-14z"
          className="fill-gray-300 animate-pulse-slow"
        />
        <path
          d="M36 22a14 14 0 0 0-13.6 10.4 10 10 0 0 0-19.4 5.6c0 5.5 4.5 10 10 10h24c7.7 0 14-6.3 14-14s-6.3-14-14-14z"
          className="fill-gray-100/90 transform translate-x-[-4px] translate-y-[4px] animate-cloud-drift"
        />
      </svg>
    );
  }

  // Chuva (Rain)
  if (norm.includes('rain') || norm.includes('drizzle')) {
    return (
      <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M40 16a12 12 0 0 0-11.6 9 9 9 0 0 0-16.4 5c0 5 4 9 9 9h20c6.6 0 12-5.4 12-12s-5.4-12-12-12z"
          className="fill-gray-400"
        />
        <g className="stroke-blue-400 stroke-[2] stroke-linecap-round">
          <line x1="24" y1="42" x2="20" y2="52" className="animate-[rain_1s_linear_infinite]" />
          <line x1="32" y1="42" x2="28" y2="52" className="animate-[rain_1.2s_linear_infinite_0.4s]" />
          <line x1="40" y1="42" x2="36" y2="52" className="animate-[rain_0.9s_linear_infinite_0.2s]" />
        </g>
      </svg>
    );
  }

  // Trovoada (Thunder)
  if (norm.includes('thunder') || norm.includes('storm')) {
    return (
      <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M40 14a12 12 0 0 0-11.6 9 9 9 0 0 0-16.4 5c0 5 4 9 9 9h20c6.6 0 12-5.4 12-12s-5.4-12-12-12z"
          className="fill-gray-500"
        />
        <path
          d="M34 38l-8 12h6l-2 10 10-14h-6l4-8z"
          className="fill-yellow-400 animate-pulse"
        />
      </svg>
    );
  }

  // Neve (Snow)
  if (norm.includes('snow')) {
    return (
      <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M40 16a12 12 0 0 0-11.6 9 9 9 0 0 0-16.4 5c0 5 4 9 9 9h20c6.6 0 12-5.4 12-12s-5.4-12-12-12z"
          className="fill-gray-300"
        />
        <g className="fill-white">
          <circle cx="24" cy="46" r="2" className="animate-bounce" style={{ animationDuration: '2s' }} />
          <circle cx="32" cy="46" r="2" className="animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }} />
          <circle cx="40" cy="46" r="2" className="animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0.5s' }} />
        </g>
      </svg>
    );
  }

  // Padrão (Sol com nuvens)
  return (
    <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="10" className="fill-yellow-400 animate-sun-pulse origin-center" />
      <path
        d="M44 28a10 10 0 0 0-9.6 7.4 7 7 0 0 0-13.4 3.6c0 3.8 3.1 7 7 7h16c5.5 0 10-4.5 10-10s-4.5-10-10-10z"
        className="fill-white/80 animate-cloud-drift"
      />
    </svg>
  );
};
