
import * as React from 'react';
import { useAuraStore } from '../store';

interface SmartFrameImage {
  url: string;
  author?: string;
}

export const SmartFrameMode: React.FC = () => {
  const { isSmartFrameActive, registerActivity, emotion } = useAuraStore();
  const [images, setImages] = React.useState<SmartFrameImage[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isSmartFrameActive) return;

    const loadImages = async () => {
      // Fallback logic for demo purposes since we might not have an Unsplash key configured
      const fallbacks: SmartFrameImage[] = [
        { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80', author: 'Colin Watts' },
        { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80', author: 'Lukasz Szmigiel' },
        { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=1920&q=80', author: 'Jonas Weckschmied' },
        { url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1920&q=80', author: 'Sasha Freemind' },
      ];

      // In a real app, you would fetch from Unsplash API here using weather/emotion context
      // For now, we shuffle the fallbacks
      setImages([...fallbacks].sort(() => Math.random() - 0.5));
    };

    loadImages();
  }, [isSmartFrameActive, emotion]);

  React.useEffect(() => {
    if (!isSmartFrameActive || images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 15000); // Rotate every 15s
    return () => clearInterval(interval);
  }, [isSmartFrameActive, images]);

  if (!mounted) return null;

  return (
    <div 
      className={`fixed inset-0 z-[5] bg-black transition-opacity duration-1000 ease-in-out ${isSmartFrameActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={registerActivity}
    >
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${img.url})` }}
        >
           <div className="absolute inset-0 bg-black/20"></div>
        </div>
      ))}

      <div className="absolute bottom-12 left-0 right-0 text-center z-10 p-4">
        <h2 className="text-white/80 text-xl font-light tracking-[0.2em] uppercase mb-2">Modo Descanso</h2>
        <p className="text-white/60 text-sm">Toque para voltar</p>
        {images[currentIndex] && (
          <p className="text-white/40 text-xs mt-2">Foto por {images[currentIndex].author}</p>
        )}
      </div>
    </div>
  );
};
