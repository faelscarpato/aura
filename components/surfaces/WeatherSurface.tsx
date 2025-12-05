
import * as React from 'react';
import { useAuraStore } from '../../store';
import { CloudRain, Droplets, Wind, RefreshCw, ThermometerSun } from 'lucide-react';
import { AnimatedWeatherIcon } from '../icons/AnimatedWeatherIcon';

export const WeatherSurface: React.FC = () => {
  const { weather, loadWeather } = useAuraStore();

  React.useEffect(() => {
    const shouldUpdate = !weather || (new Date().getTime() - new Date(weather.updatedAt).getTime() > 3600000);
    if (shouldUpdate) {
      loadWeather();
    }
  }, [loadWeather, weather]);

  if (!weather) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-2 text-blue-500" />
        <p className="text-sm font-medium">Obtendo previsão...</p>
      </div>
    );
  }

  // Determina background baseado na condição
  const getBgClass = () => {
    const cond = weather.current.condition.main.toLowerCase();
    if (cond.includes('rain') || cond.includes('thunder') || cond.includes('drizzle')) return 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900';
    if (cond.includes('cloud')) return 'bg-gradient-to-br from-gray-400 via-slate-500 to-slate-600';
    if (cond.includes('snow')) return 'bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 text-slate-700';
    return 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700'; // Clear/Default
  };

  const bgClass = getBgClass();
  const isLightText = !bgClass.includes('from-blue-100'); // Snow has dark text

  return (
    <div className={`w-full h-full flex flex-col ${isLightText ? 'text-white' : 'text-slate-800'} overflow-hidden`}>
      {/* Header Principal */}
      <div className={`p-6 pb-4 flex flex-col items-center relative transition-colors duration-1000 ${bgClass}`}>
        <h2 className="text-2xl font-medium tracking-tight drop-shadow-md text-center">{weather.location}</h2>
        <span className="text-xs opacity-80 mb-4">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        
        <div className="flex flex-col items-center gap-2">
          <AnimatedWeatherIcon condition={weather.current.condition.main} className="w-32 h-32 drop-shadow-xl my-2" />
          <div className="flex flex-col items-center">
            <span className="text-7xl font-bold tracking-tighter drop-shadow-lg">{Math.round(weather.current.temp)}°</span>
            <span className="text-xl font-medium opacity-90 capitalize mt-1">{weather.current.condition.description}</span>
          </div>
        </div>

        {/* Detalhes Rápidos */}
        <div className={`mt-6 w-full grid grid-cols-3 gap-2 text-center text-xs py-3 rounded-xl backdrop-blur-md ${isLightText ? 'bg-white/10 border border-white/10' : 'bg-white/40 border border-white/20'}`}>
            <div className="flex flex-col items-center gap-1">
            <Wind className="w-4 h-4 opacity-70" />
            <span className="font-semibold">{weather.current.wind_speed} km/h</span>
            </div>
            <div className="flex flex-col items-center gap-1">
            <Droplets className="w-4 h-4 opacity-70" />
            <span className="font-semibold">{weather.current.humidity}%</span>
            </div>
            <div className="flex flex-col items-center gap-1">
            <ThermometerSun className="w-4 h-4 opacity-70" />
            <span className="font-semibold">{Math.round(weather.current.feels_like)}°</span>
            </div>
        </div>
      </div>

      {/* Previsão Horária e Diária */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Horária */}
        <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Hoje</p>
            <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide px-1">
            {weather.hourly.map((h, idx) => (
                <div key={idx} className="flex flex-col items-center min-w-[3.5rem] space-y-2">
                <span className="text-xs text-gray-500 font-medium">{h.time}</span>
                <div className="w-8 h-8">
                    <AnimatedWeatherIcon condition={h.condition.main} className="w-full h-full" />
                </div>
                <span className="text-sm font-bold text-gray-700">{Math.round(h.temp)}°</span>
                </div>
            ))}
            </div>
        </div>

        {/* Diária */}
        <div className="p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">7 Dias</p>
            <div className="space-y-4">
            {weather.daily.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between group hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
                <span className="w-12 font-medium text-gray-700">{d.day}</span>
                <div className="flex items-center gap-3 flex-1 justify-center">
                    <div className="flex flex-col items-center w-8">
                        <CloudRain className={`w-4 h-4 text-blue-400 transition-opacity ${d.condition.main.toLowerCase().includes('rain') ? 'opacity-100' : 'opacity-0'}`} />
                        {d.condition.main.toLowerCase().includes('rain') && <span className="text-[9px] text-blue-400 font-bold">50%</span>}
                    </div>
                    <div className="w-8 h-8">
                        <AnimatedWeatherIcon condition={d.condition.main} className="w-full h-full scale-75" />
                    </div>
                </div>
                <div className="flex gap-4 w-24 justify-end text-sm">
                    <span className="font-bold text-gray-800">{Math.round(d.max)}°</span>
                    <span className="text-gray-400">{Math.round(d.min)}°</span>
                </div>
                </div>
            ))}
            </div>
        </div>
        
        <div className="p-4 pt-0 text-center">
            <p className="text-[10px] text-gray-300">
                Fonte: OpenWeatherMap • Atualizado {new Date(weather.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
        </div>
      </div>
    </div>
  );
};
