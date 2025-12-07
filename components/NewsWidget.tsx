
import * as React from 'react';
import { useAuraStore } from '../store';
import { RefreshCw, Newspaper, ExternalLink, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

export const NewsWidget: React.FC = () => {
  const { news, loadNews, newsTopic } = useAuraStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (news.length === 0) {
      loadNews();
    }
  }, [loadNews, news.length]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    await Promise.all([
      loadNews(newsTopic || undefined),
      new Promise(resolve => setTimeout(resolve, 800)) // Minimo de tempo para ver a animação
    ]);
    setIsLoading(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Se não expandido, mostra apenas a primeira (manchete). Se expandido, mostra até 6.
  const displayNews = isExpanded ? news : news.slice(0, 1);

  return (
    <div 
      className={`
        bg-white border border-gray-200 shadow-lg rounded-2xl flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden
        ${isExpanded ? 'w-[400px] h-[500px]' : 'w-[300px] h-[80px] hover:w-[320px]'}
      `}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors shrink-0"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`p-2 bg-blue-50 rounded-lg border border-blue-100 transition-colors ${isExpanded ? 'bg-blue-100' : ''}`}>
            <Newspaper className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 leading-none truncate">
              {newsTopic ? `Notícias: ${newsTopic}` : 'Briefing do Dia'}
            </h3>
            {!isExpanded && news.length > 0 && (
              <span className="text-[10px] text-gray-400 truncate mt-1">
                 {news[0].source} • {news[0].title}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
           {isExpanded && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-all disabled:opacity-50 mr-1"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
           )}
           {isExpanded ? <Minimize2 className="w-4 h-4 text-gray-400" /> : <Maximize2 className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`flex-1 overflow-y-auto bg-gray-50/50 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         <div className="p-4 pt-0 space-y-3">
            {news.length === 0 ? (
              <div className="text-center py-10">
                 {isLoading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                       <RefreshCw className="w-5 h-5 animate-spin" />
                       <span className="text-xs">Buscando novidades...</span>
                    </div>
                 ) : (
                    <p className="text-sm text-gray-400">Nenhuma notícia encontrada.</p>
                 )}
              </div>
            ) : (
              displayNews.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block bg-white p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex gap-3 items-start">
                    {item.imageUrl && (
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                          {item.source}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h4>
                      {isExpanded && (
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))
            )}
            
            <div className="pt-2 text-center">
               <span className="text-[10px] text-gray-400">
                  Powered by Google News
               </span>
            </div>
         </div>
      </div>
    </div>
  );
};
