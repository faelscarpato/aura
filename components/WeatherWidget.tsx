
import * as React from 'react';
import { Clock } from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const [timeString, setTimeString] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      setTimeString(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center min-w-[100px]">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-white px-3 py-1.5 rounded-full transition-all duration-500 ease-in-out border border-gray-200 shadow-sm hover:shadow-md">
            <div className="flex items-center gap-1.5 animate-fade-in-down">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span>{timeString}</span>
            </div>
        </div>
    </div>
  );
};
