
import React, { useState, useEffect } from 'react';
import { 
  Settings, Sparkles, Menu, Upload, Zap, Image as ImageIcon,
  Layers, CheckCircle, Circle, Trash2, Download, X
} from 'lucide-react';
import { 
  AspectRatio, Resolution, GenerationParams, 
  GenerationSettings, HistoryItem 
} from './types';
import * as db from './services/storage';
import { generateImage } from './services/geminiService';
import SettingsDialog from './components/SettingsDialog';
import ImageDetailModal from './components/ImageDetailModal';

// Initial constants
const INITIAL_SETTINGS: GenerationSettings = {
  apiKey: localStorage.getItem('banana_api_key') || '',
  baseUrl: localStorage.getItem('banana_base_url') || '',
  modelNanoId: localStorage.getItem('banana_model_nano') || 'gemini-2.5-flash-image',
  modelProId: localStorage.getItem('banana_model_pro') || 'gemini-3-pro-image-preview',
};

// Internal mapping for UI selection
enum UiModelSelection {
  NANO = 'NANO',
  PRO = 'PRO'
}

function App() {
  // -- State --
  const [settings, setSettings] = useState<GenerationSettings>(INITIAL_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile toggle
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation Params
  const [prompt, setPrompt] = useState('');
  const [uiModel, setUiModel] = useState<UiModelSelection>(UiModelSelection.NANO);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.DEFAULT);
  const [resolution, setResolution] = useState<Resolution>(Resolution.RES_1K);
  const [refImage, setRefImage] = useState<string | null>(null);

  // Selected Image for Detail Modal
  const [selectedImage, setSelectedImage] = useState<HistoryItem | null>(null);

  // -- Batch Selection State --
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // -- Effects --

  // Load History on Mount
  useEffect(() => {
    db.getAllHistory().then(setHistory).catch(console.error);
  }, []);

  // Save Settings when changed
  const handleSaveSettings = (newSettings: GenerationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('banana_api_key', newSettings.apiKey);
    localStorage.setItem('banana_base_url', newSettings.baseUrl);
    localStorage.setItem('banana_model_nano', newSettings.modelNanoId);
    localStorage.setItem('banana_model_pro', newSettings.modelProId);
  };

  // -- Handlers --

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("图片过大，请使用 5MB 以下的图片。");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setRefImage(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("请输入提示词。");
      return;
    }
    if (!settings.apiKey) {
      setIsSettingsOpen(true);
      setError("请先配置 API Key。");
      return;
    }

    setIsLoading(true);
    setError(null);
    // On mobile, close sidebar when generating to show results
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    // Determine actual model ID based on settings
    const actualModelId = uiModel === UiModelSelection.NANO ? settings.modelNanoId : settings.modelProId;

    const params: GenerationParams = {
      prompt,
      model: actualModelId, 
      aspectRatio,
      resolution,
      referenceImage: refImage || undefined
    };

    try {
      const imageUrl = await generateImage(settings, params);
      
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        params: params,
        imageUrl: imageUrl
      };

      await db.saveHistoryItem(newItem);
      // Add to top
      const newHistory = [newItem, ...history];
      setHistory(newHistory);
      
      // Auto open detail for the new image? Optional. 
      // Let's scroll to top instead (default behavior of grid update).
      
    } catch (err: any) {
      setError(err.message || "生成失败。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReuseParams = (item: HistoryItem) => {
    setPrompt(item.params.prompt);
    
    // Try to map back to UI selection if possible
    if (item.params.model === settings.modelProId) {
        setUiModel(UiModelSelection.PRO);
    } else {
        setUiModel(UiModelSelection.NANO);
    }

    setAspectRatio(item.params.aspectRatio);
    setResolution(item.params.resolution);
    if (item.params.referenceImage) {
      setRefImage(item.params.referenceImage);
    } else {
      setRefImage(null);
    }
    
    // Open sidebar to show controls
    setIsSidebarOpen(true);
  };

  const handleDeleteHistory = async (id: string) => {
    await db.deleteHistoryItem(id);
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // -- Batch Handlers --

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set()); // Clear selection when toggling
  };

  const toggleItemSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(history.map(item => item.id));
      setSelectedIds(allIds);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = window.confirm(`确定要永久删除选中的 ${selectedIds.size} 张图片吗？此操作无法撤销。`);
    if (!confirmed) return;

    try {
      setIsBatchProcessing(true);
      const idsToDelete = Array.from(selectedIds);
      
      // Execute delete
      await Promise.all(idsToDelete.map(id => db.deleteHistoryItem(id)));
      
      // Update local state
      setHistory(prev => prev.filter(item => !selectedIds.has(item.id)));
      
      // Clear selection
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Batch delete failed", err);
      alert("删除操作部分或全部失败，请重试。");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;

    const itemsToDownload = history.filter(item => selectedIds.has(item.id));
    
    // Stagger downloads to prevent browser blocking
    for (let i = 0; i < itemsToDownload.length; i++) {
      const item = itemsToDownload[i];
      setTimeout(() => {
          const link = document.createElement('a');
          link.href = item.imageUrl;
          link.download = `banana-${item.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }, i * 500);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0f19] text-gray-100 font-sans selection:bg-banana-500/30 overflow-hidden">
      
      {/* -------------------- LEFT SIDEBAR (GENERATOR) -------------------- */}
      <aside 
        className={`
          fixed md:relative z-40 w-[340px] h-full bg-[#111827] border-r border-gray-800 
          transform transition-transform duration-300 ease-in-out flex flex-col shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-banana-400 to-banana-600 rounded-lg flex items-center justify-center text-gray-950 font-bold shadow-lg shadow-banana-500/20">
                B
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Banana Canvas
              </h1>
            </div>
            {/* Mobile Close */}
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-500"
            >
              <Menu className="w-5 h-5" />
            </button>
        </div>

        {/* Scrollable Controls */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          
          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-banana-500" />
                提示词 (PROMPT)
              </label>
              <span className="text-[10px] text-gray-600">{prompt.length}/2000</span>
            </div>
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你的想象..."
                className="w-full h-32 bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 focus:border-banana-500 focus:ring-1 focus:ring-banana-500 outline-none resize-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setPrompt('')}
                className="absolute bottom-2 right-2 text-[10px] text-gray-500 hover:text-white bg-gray-800/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                清空
              </button>
            </div>
          </div>

          <div className="border-t border-gray-800"></div>

          {/* Settings Section */}
          <div className="space-y-4">
            
            {/* Model */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">模型 (MODEL)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUiModel(UiModelSelection.NANO)}
                  className={`
                    p-3 rounded-lg border text-left transition-all relative overflow-hidden group
                    ${uiModel === UiModelSelection.NANO 
                      ? 'bg-banana-500/10 border-banana-500/50' 
                      : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'}
                  `}
                >
                  <div className={`text-sm font-medium ${uiModel === UiModelSelection.NANO ? 'text-banana-400' : 'text-gray-400'}`}>Nano Banana</div>
                  <div className="text-[10px] text-gray-600">Flash Speed</div>
                  {uiModel === UiModelSelection.NANO && <div className="absolute top-0 right-0 w-2 h-2 bg-banana-500 rounded-bl-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
                </button>

                <button
                  type="button"
                  onClick={() => setUiModel(UiModelSelection.PRO)}
                  className={`
                    p-3 rounded-lg border text-left transition-all relative overflow-visible group
                    ${uiModel === UiModelSelection.PRO 
                      ? 'bg-purple-500/10 border-purple-500/50' 
                      : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'}
                  `}
                >
                  <div className={`text-sm font-medium ${uiModel === UiModelSelection.PRO ? 'text-purple-400' : 'text-gray-400'}`}>Nano Banana Pro</div>
                  <div className="text-[10px] text-gray-600">High Quality</div>
                  <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-lg z-10">NEW</div>
                </button>
              </div>
            </div>

            {/* Visual Style / Ref Image */}
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">参考图 (REFERENCE)</label>
                {refImage && <button type="button" onClick={() => setRefImage(null)} className="text-[10px] text-red-400 hover:text-red-300">移除</button>}
               </div>
               
               {!refImage ? (
                   <label className="flex items-center justify-center w-full h-16 border border-gray-800 border-dashed rounded-lg cursor-pointer bg-gray-900/30 hover:bg-gray-900/60 hover:border-gray-600 transition-all group">
                    <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-gray-500 group-hover:text-banana-500 transition-colors" />
                        <span className="text-xs text-gray-500">上传参考图片</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                  </label>
                ) : (
                  <div className="relative w-full h-24 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 group">
                    <img src={refImage} alt="Ref" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
            </div>

            {/* Dimensions Grid */}
            <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">尺寸 (DIMENSIONS)</label>
               <div className="grid grid-cols-3 gap-2">
                 {[
                    { label: 'Default', value: AspectRatio.DEFAULT },
                    { label: '1:1', value: AspectRatio.SQUARE },
                    { label: '3:4', value: AspectRatio.PORTRAIT_3_4 },
                    { label: '4:3', value: AspectRatio.LANDSCAPE_4_3 },
                    { label: '9:16', value: AspectRatio.PORTRAIT_9_16 },
                    { label: '16:9', value: AspectRatio.LANDSCAPE_16_9 },
                 ].map((opt) => (
                   <button
                    type="button"
                    key={opt.label}
                    onClick={() => setAspectRatio(opt.value)}
                    className={`
                      py-2 rounded-md border text-[10px] font-medium transition-all
                      ${aspectRatio === opt.value
                        ? 'bg-gray-800 border-gray-600 text-white shadow-inner' 
                        : 'bg-gray-900/30 border-gray-800 text-gray-500 hover:bg-gray-800 hover:border-gray-700'}
                    `}
                   >
                     {opt.label}
                   </button>
                 ))}
               </div>
            </div>

             {/* Resolution */}
             <div className={`space-y-2 ${uiModel !== UiModelSelection.PRO ? 'opacity-50 pointer-events-none' : ''}`}>
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">分辨率 (RESOLUTION)</label>
               <div className="flex bg-gray-900/30 rounded-lg p-1 border border-gray-800">
                 {[Resolution.RES_1K, Resolution.RES_2K, Resolution.RES_4K].map((res) => (
                   <button
                    type="button"
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`
                      flex-1 py-1.5 text-[10px] font-bold rounded transition-all
                      ${resolution === res 
                        ? 'bg-gray-700 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300'}
                    `}
                   >
                     {res}
                   </button>
                 ))}
               </div>
            </div>

          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg animate-fade-in leading-relaxed">
              {error}
            </div>
          )}

        </div>

        {/* Footer / Generate Action */}
        <div className="p-5 border-t border-gray-800 bg-[#111827] z-10 shrink-0 space-y-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className={`
              w-full py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-banana-500/10 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]
              ${isLoading 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-banana-600 to-banana-500 text-white hover:from-banana-500 hover:to-banana-400'}
            `}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                <span>GENERATING...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>生成图片 (GENERATE)</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-white transition-colors py-2"
          >
            <Settings className="w-3 h-3" />
            <span>配置代理服务</span>
          </button>
        </div>
      </aside>

      {/* -------------------- MAIN CONTENT (GALLERY) -------------------- */}
      <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-[#0b0f19]">
        
        {/* Top Bar */}
        <header className="h-16 relative flex items-center justify-center px-6 border-b border-gray-800/50 bg-[#0b0f19]/90 backdrop-blur z-20 shrink-0">
          
          {/* Default Mode Header */}
          {!isSelectionMode ? (
            <>
              {/* Left Group: Mobile Menu + Batch Button */}
              <div className="absolute left-6 flex items-center gap-3">
                 <button 
                    type="button"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg md:hidden"
                  >
                    <Menu className="w-6 h-6" />
                  </button>

                 {/* Toggle Batch Mode */}
                 {history.length > 0 && (
                  <button 
                    type="button"
                    onClick={toggleSelectionMode}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700/50"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">批量管理</span>
                  </button>
                )}
              </div>
              
              {/* Center Title */}
              <h2 className="text-2xl font-black tracking-widest bg-gradient-to-r from-blue-400 via-purple-400 to-banana-500 bg-clip-text text-transparent uppercase italic">
                Explore Gallery
              </h2>

              {/* Right Placeholder (Empty for balance if needed, or actions) */}
              <div className="absolute right-6"></div>
            </>
          ) : (
            /* Batch Mode Toolbar */
            <div className="w-full flex items-center justify-between animate-fade-in">
               <div className="flex items-center gap-4">
                  <button 
                     type="button"
                     onClick={toggleSelectionMode}
                     disabled={isBatchProcessing}
                     className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                  >
                     <X className="w-5 h-5" />
                  </button>
                  <span className="font-bold text-white">已选择 {selectedIds.size} 项</span>
               </div>
               
               <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleSelectAll}
                    disabled={isBatchProcessing}
                    className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {selectedIds.size === history.length ? '取消全选' : '全选'}
                  </button>
                  
                  <div className="h-6 w-px bg-gray-700 mx-1"></div>

                  <button
                     type="button"
                     onClick={handleBatchDownload}
                     disabled={selectedIds.size === 0 || isBatchProcessing}
                     className={`p-2 rounded-lg transition-colors ${selectedIds.size > 0 && !isBatchProcessing ? 'text-banana-400 hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed'}`}
                     title="批量下载"
                  >
                     <Download className="w-5 h-5" />
                  </button>

                  <button
                     type="button"
                     onClick={handleBatchDelete}
                     disabled={selectedIds.size === 0 || isBatchProcessing}
                     className={`p-2 rounded-lg transition-colors ${selectedIds.size > 0 && !isBatchProcessing ? 'text-red-400 hover:bg-red-900/20' : 'text-gray-600 cursor-not-allowed'}`}
                     title="批量删除"
                  >
                     {isBatchProcessing ? (
                       <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                     ) : (
                       <Trash2 className="w-5 h-5" />
                     )}
                  </button>
               </div>
            </div>
          )}
        </header>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-4">
              <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center">
                 <ImageIcon className="w-10 h-10 opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-500">Canvas Empty</p>
                <p className="text-sm opacity-50">Create your first masterpiece</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {/* If Loading, show placeholder first */}
              {isLoading && (
                 <div className="aspect-square rounded-xl bg-gray-900 border border-gray-800 animate-pulse flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer"></div>
                    <Sparkles className="w-8 h-8 text-banana-500 animate-bounce" />
                 </div>
              )}

              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleItemSelection(item.id);
                    } else {
                      setSelectedImage(item);
                    }
                  }}
                  className={`
                    group relative aspect-square rounded-xl bg-gray-900 overflow-hidden cursor-pointer border transition-all hover:shadow-2xl hover:shadow-black/50
                    ${isSelectionMode && selectedIds.has(item.id) 
                      ? 'border-banana-500 ring-2 ring-banana-500/20' 
                      : 'border-transparent hover:border-gray-700 hover:-translate-y-1'}
                  `}
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.params.prompt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Selection Indicator */}
                  {isSelectionMode && (
                    <div className="absolute top-2 right-2 z-10 transition-transform transform scale-100 active:scale-90">
                       {selectedIds.has(item.id) ? (
                          <CheckCircle className="w-6 h-6 text-banana-500 fill-black" />
                       ) : (
                          <Circle className="w-6 h-6 text-white/70 hover:text-white fill-black/40" />
                       )}
                    </div>
                  )}

                  {/* Hover Overlay (Only in Normal Mode) */}
                  {!isSelectionMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <p className="text-white text-xs font-medium line-clamp-2 mb-2">{item.params.prompt}</p>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] text-gray-300 bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-sm">
                           {item.params.resolution}
                         </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Selected Overlay Tint */}
                  {isSelectionMode && selectedIds.has(item.id) && (
                    <div className="absolute inset-0 bg-banana-500/10 pointer-events-none"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* -------------------- MODALS -------------------- */}
      
      {/* Settings Modal */}
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Image Detail Lightbox */}
      {selectedImage && (
        <ImageDetailModal 
          item={selectedImage}
          onClose={() => setSelectedImage(null)}
          onReuse={handleReuseParams}
          onDelete={handleDeleteHistory}
        />
      )}

    </div>
  );
}

export default App;
