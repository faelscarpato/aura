import * as React from 'react';
import { useAuraStore } from '../../store';
import { Newspaper, ExternalLink, RefreshCw, Clock, Globe } from 'lucide-react';

export const NewsSurface: React.FC = () => {
  const { news, loadNews, newsTopic } = useAuraStore();

  React.useEffect(() => {
    if (news.length === 0) {
      loadNews();
    }
  }, [loadNews, news.length]);

  return (
    <div className="w-full h-full flex flex-col text-gray-800">
       {/* Header */}
       <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <Newspaper className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Briefing</h2>
            <p className="text-xs text-gray-500 font-medium">
              {newsTopic ? `Tópico: ${newsTopic}` : 'Principais manchetes do dia'}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadNews(newsTopic || undefined)}
          className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-all duration-300"
          title="Atualizar notícias"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((item, index) => (
              <a 
                key={item.id} 
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className={`
                  group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 
                  hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 ease-out
                  ${index === 0 ? 'md:col-span-2 md:flex-row md:h-64' : 'h-auto'}
                `}
              >
                  {/* Image Container */}
                  <div className={`relative overflow-hidden bg-gray-100 ${index === 0 ? 'h-48 md:h-full md:w-2/5' : 'h-40 w-full'}`}>
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      
                      {/* Floating Source Badge (Mobile/Card view) */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-md shadow-sm">
                          <Globe className="w-3 h-3" />
                          {item.source}
                        </span>
                      </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between relative">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                              <Clock className="w-3 h-3" />
                              <span>Hoje</span>
                           </div>
                           <ExternalLink className="w-4 h-4 text-blue-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </div>
                        
                        <h3 className={`font-bold text-gray-900 leading-tight group-hover:text-blue-700 transition-colors ${index === 0 ? 'text-xl mb-3' : 'text-base mb-2'}`}>
                          {item.title}
                        </h3>
                        
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 group-hover:text-gray-600">
                          {item.summary}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        Ler matéria completa
                      </div>
                  </div>
              </a>
          ))}
        </div>
        
        {news.length === 0 && (
           <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <p>Nenhuma notícia carregada.</p>
              <button onClick={() => loadNews()} className="mt-2 text-blue-500 text-sm hover:underline">Tentar novamente</button>
           </div>
        )}
      </div>
    </div>
  );
};