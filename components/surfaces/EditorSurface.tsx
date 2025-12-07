
import * as React from 'react';
import { useAuraStore } from '../../store';
import { FileText, Type } from 'lucide-react';
import { AuraDocType } from '../../types';

export const EditorSurface: React.FC = () => {
  const { currentDocument, setCurrentDocument } = useAuraStore();

  // Garante que sempre haja um documento ao abrir o editor
  React.useEffect(() => {
    if (!currentDocument) {
      setCurrentDocument({
        title: 'Novo documento',
        content: '',
        docType: 'generic',
      });
    }
  }, [currentDocument, setCurrentDocument]);

  if (!currentDocument) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDocument({ ...currentDocument, title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentDocument({ ...currentDocument, content: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDocument({ ...currentDocument, docType: e.target.value as AuraDocType });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="relative w-full h-full max-h-[85vh] bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header (Toolbar) */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">AURA Editor</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Modo Rascunho</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-2 py-1">
                <Type className="w-3 h-3 text-gray-400" />
                <select 
                   value={currentDocument.docType}
                   onChange={handleTypeChange}
                   className="text-xs text-gray-700 bg-transparent outline-none cursor-pointer font-medium"
                >
                    <option value="generic">Genérico</option>
                    <option value="memo">Memorando</option>
                    <option value="letter">Carta</option>
                    <option value="analysis">Análise</option>
                    <option value="petition">Petição</option>
                    <option value="resume">Resumo</option>
                </select>
             </div>
          </div>
        </div>

        {/* Paper Content */}
        <div className="flex-1 overflow-y-auto bg-white px-8 py-8 sm:px-12">
          <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
            <input
              type="text"
              value={currentDocument.title}
              onChange={handleTitleChange}
              placeholder="Sem título"
              className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none bg-transparent mb-6"
            />
            <textarea
              value={currentDocument.content}
              onChange={handleContentChange}
              placeholder="Comece a escrever ou peça para a AURA criar um texto..."
              className="w-full flex-1 resize-none text-base leading-relaxed text-gray-800 placeholder-gray-300 outline-none bg-transparent font-serif"
              spellCheck={false}
            />
          </div>
        </div>
        
        {/* Footer Status */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex justify-between items-center text-[10px] text-gray-500">
           <span>{currentDocument.content.length} caracteres</span>
           <span>Salvo na memória local</span>
        </div>
      </div>
    </div>
  );
};
