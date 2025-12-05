
import * as React from 'react';
import { useAuraStore } from '../store';
import { SurfaceType } from '../types';
import { ShoppingSurface } from './surfaces/ShoppingSurface';
import { AgendaSurface } from './surfaces/AgendaSurface';
import { TasksSurface } from './surfaces/TasksSurface';
import { NewsSurface } from './surfaces/NewsSurface';
import { WeatherSurface } from './surfaces/WeatherSurface';
import { X } from 'lucide-react';

export const SurfaceManager: React.FC = () => {
  const { activeSurface, setActiveSurface } = useAuraStore();
  const [displayedSurface, setDisplayedSurface] = React.useState<SurfaceType>(SurfaceType.NONE);

  React.useEffect(() => {
    if (activeSurface !== SurfaceType.NONE) {
      setDisplayedSurface(activeSurface);
    } else {
      const timer = setTimeout(() => setDisplayedSurface(SurfaceType.NONE), 500);
      return () => clearTimeout(timer);
    }
  }, [activeSurface]);

  const renderContent = () => {
    switch (displayedSurface) {
      case SurfaceType.SHOPPING: return <ShoppingSurface />;
      case SurfaceType.AGENDA: return <AgendaSurface />;
      case SurfaceType.TASKS: return <TasksSurface />;
      case SurfaceType.NEWS: return <NewsSurface />;
      case SurfaceType.WEATHER: return <WeatherSurface />;
      default: return null;
    }
  };

  const isActive = activeSurface !== SurfaceType.NONE;

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-full md:w-[450px] bg-white/80 backdrop-blur-2xl border-l border-gray-200 p-6 shadow-2xl z-20 flex flex-col 
      transition-transform duration-500 ease-in-out transform 
      ${isActive ? 'translate-x-0' : 'translate-x-full'}`}
    >
       <button 
         onClick={() => setActiveSurface(SurfaceType.NONE)}
         className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-800 transition-colors z-30"
       >
         <X className="w-5 h-5" />
       </button>
       
       <div className={`mt-8 h-full overflow-hidden transition-opacity duration-500 delay-100 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
          {renderContent()}
       </div>
    </div>
  );
};
