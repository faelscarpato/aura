import * as React from 'react';
import { useAuraStore } from '../../store';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';

export const NewsSurface: React.FC = () => {
  const { news, loadNews, newsTopic } = useAuraStore();

  React.useEffect(() => {
    loadNews();
  }, [loadNews]);

  return (
    <div className="w-full h-full flex flex-col text-gray-800">
       <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
            <Newspaper className="text-blue-600 w-6 h-6" />
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-medium tracking-wide">Briefing Diário</h2>
          <button
            onClick={() => loadNews(newsTopic || undefined)}
            className="p-2 rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-800 transition-colors"
            title="Atualizar notícias"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2">
        {news.map((item) => (
            <div key={item.id} className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-blue-500/30 transition-all">
                <div className="h-32 w-full overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">{item.source}</span>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                    </div>
                    <h3 className="font-medium text-lg leading-tight mb-2 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.summary}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
