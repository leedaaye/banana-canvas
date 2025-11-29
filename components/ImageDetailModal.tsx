
import React from 'react';
import { X, Download, Copy, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { HistoryItem } from '../types';

interface ImageDetailModalProps {
  item: HistoryItem | null;
  onClose: () => void;
  onReuse: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({ item, onClose, onReuse, onDelete }) => {
  if (!item) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(item.params.prompt);
    // Could add toast here
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-sm animate-fade-in">
      {/* Close Button (Absolute Top Right) */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-white bg-black/50 rounded-full hover:bg-gray-800 transition-colors md:hidden"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content Container */}
      <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
        
        {/* Left: Image Canvas */}
        <div 
          className="flex-1 bg-[#0b0f19] flex items-center justify-center p-4 md:p-8 relative group"
          onClick={onClose} // Click outside image to close
        >
          <img 
            src={item.imageUrl} 
            alt="Detail" 
            className="max-w-full max-h-full object-contain shadow-2xl shadow-black/50 rounded-md"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
          />
        </div>

        {/* Right: Details Panel */}
        <div className="w-full md:w-[400px] bg-[#111827] border-l border-gray-800 flex flex-col h-[50%] md:h-full shadow-2xl z-40">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-2 text-banana-500">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-bold text-white">详情</h2>
            </div>
            <button 
              onClick={onClose}
              className="hidden md:block text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Prompt Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">提示词 (Prompt)</label>
                <button 
                  onClick={handleCopyPrompt}
                  className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-3 h-3" /> 复制
                </button>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-gray-300 text-sm italic leading-relaxed">
                "{item.params.prompt}"
              </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                <div className="text-[10px] text-gray-500 uppercase mb-1">分辨率</div>
                <div className="font-mono text-white font-medium">{item.params.resolution}</div>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                <div className="text-[10px] text-gray-500 uppercase mb-1">比例</div>
                <div className="font-mono text-white font-medium">{item.params.aspectRatio}</div>
              </div>
            </div>

            {/* Model Info */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">模型 (Model)</label>
              <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-sm font-medium text-gray-200 truncate">{item.params.model}</span>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-800 space-y-3 bg-gray-900/50">
            <a 
              href={item.imageUrl} 
              download={`banana-${item.id}.png`}
              className="flex items-center justify-center gap-2 w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              下载壁纸
            </a>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { onReuse(item); onClose(); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                复用参数
              </button>
              <button 
                onClick={() => { onDelete(item.id); onClose(); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-700 hover:bg-red-900/20 hover:border-red-800 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ImageDetailModal;
