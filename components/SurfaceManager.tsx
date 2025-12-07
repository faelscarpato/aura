
import * as React from 'react';
import { useAuraStore } from '../store';
import { SurfaceType } from '../types';
import { ShoppingSurface } from './surfaces/ShoppingSurface';
import { AgendaSurface } from './surfaces/AgendaSurface';
import { TasksSurface } from './surfaces/TasksSurface';
import { NewsSurface } from './surfaces/NewsSurface';
import { EditorSurface } from './surfaces/EditorSurface';
import { VisionSurface } from './surfaces/VisionSurface';
import { X } from 'lucide-react';

const SIDE_SURFACES = [SurfaceType.SHOPPING, SurfaceType.AGENDA, SurfaceType.TASKS, SurfaceType.NEWS];
const FULL_SURFACES = [SurfaceType.EDITOR, SurfaceType.VISION];

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

  const renderContent = (surface: SurfaceType) => {
    switch (surface) {
      case SurfaceType.SHOPPING: return <ShoppingSurface />;
      case SurfaceType.AGENDA: return <AgendaSurface />;
      case SurfaceType.TASKS: return <TasksSurface />;
      case SurfaceType.NEWS: return <NewsSurface />;
      case SurfaceType.EDITOR: return <EditorSurface />;
      case SurfaceType.VISION: return <VisionSurface />;
      default: return null;
    }
  };

  const isSideContent = SIDE_SURFACES.includes(displayedSurface);
  const isFullContent = FULL_SURFACES.includes(displayedSurface);

  // Determine if we should show the container based on activeSurface (for entrance animation)
  // or displayedSurface (for exit animation)
  // Actually, we use activeSurface to trigger the "out" animation, and displayedSurface to keep content alive.

  const showSide = SIDE_SURFACES.includes(activeSurface) || (activeSurface === SurfaceType.NONE && isSideContent);
  const showFull = FULL_SURFACES.includes(activeSurface) || (activeSurface === SurfaceType.NONE && isFullContent);

  return (
    <>
      {/* Full Screen Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500
        ${showFull ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Only render content if it's a full screen type to avoid flashing side content in full container */}
        {isFullContent && (
          <div className="w-full h-full relative">
            <button
              onClick={() => setActiveSurface(SurfaceType.NONE)}
              className="absolute top-6 right-6 p-2 rounded-full text-white hover:bg-white/20 transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
            {renderContent(displayedSurface)}
          </div>
        )}
      </div>

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white/80 backdrop-blur-2xl border-l border-gray-200 shadow-2xl z-40 transition-transform duration-500 ease-in-out transform
        ${showSide ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <button
          onClick={() => setActiveSurface(SurfaceType.NONE)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-800 transition-colors z-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="h-full w-full overflow-hidden">
          {isSideContent && renderContent(displayedSurface)}
        </div>
      </div>
    </>
  );
};