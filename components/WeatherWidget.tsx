
import * as React from 'react';
import { useAuraStore } from '../store';
import { AnimatedWeatherIcon } from './icons/AnimatedWeatherIcon';
import { MapPin, Clock } from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const { weather, location, loadWeather } = useAuraStore();
  const [displayState, setDisplayState] = React.useState(0); // 0: Location, 1: Weather, 2: Time

  React.useEffect(() => {
    if (location && !weather) {
        loadWeather();
    }
  }, [location, weather, loadWeather]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDisplayState((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Se não houver dados de clima, mostra apenas hora ou loading
  if (!weather) {
      return (
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100/50 px-3 py-1.5 rounded-full border border-gray-200">
            <Clock className="w-3 h-3" />
            <span>{timeString}</span>
        </div>
      );
  }

  return (
    <div className="h-8 flex items-center justify-center min-w-[100px]">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-white px-3 py-1.5 rounded-full transition-all duration-500 ease-in-out border border-gray-200 shadow-sm hover:shadow-md">
            {displayState === 0 && (
                <div key="loc" className="flex items-center gap-1.5 animate-fade-in-down">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="truncate max-w-[120px]">{weather.location}</span>
                </div>
            )}
            {displayState === 1 && (
                <div key="weather" className="flex items-center gap-1.5 animate-fade-in-down">
                    <div className="w-5 h-5">
                        <AnimatedWeatherIcon condition={weather.current.condition.main} className="w-full h-full" />
                    </div>
                    <span>{Math.round(weather.current.temp)}°</span>
                </div>
            )}
            {displayState === 2 && (
                <div key="time" className="flex items-center gap-1.5 animate-fade-in-down">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span>{timeString}</span>
                </div>
            )}
        </div>
    </div>
  );
};
