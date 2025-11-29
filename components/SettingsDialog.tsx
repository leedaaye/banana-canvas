import React from 'react';
import { X, Save, ShieldCheck, Settings2 } from 'lucide-react';
import { GenerationSettings } from '../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenerationSettings;
  onSave: (settings: GenerationSettings) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = React.useState(settings);

  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/50">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-banana-500" />
            代理服务配置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Connection Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> 连接设置
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Base URL (接口地址)
              </label>
              <input
                type="text"
                value={localSettings.baseUrl}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, baseUrl: e.target.value })
                }
                placeholder="https://your-new-api-domain.com/v1"
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-banana-500 focus:border-transparent outline-none transition-all font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                对于 New API，通常填写 <code>https://domain.com/v1</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key (密钥) <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={localSettings.apiKey}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, apiKey: e.target.value })
                }
                placeholder="sk-..."
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-banana-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-800 my-4"></div>

          {/* Model Mapping */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> 模型映射
            </h3>
            <p className="text-xs text-gray-400">
              将界面按钮映射到您在 New API/One API 中配置的具体模型 ID。
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                "Nano Banana" 模型 ID
              </label>
              <input
                type="text"
                value={localSettings.modelNanoId}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, modelNanoId: e.target.value })
                }
                placeholder="gemini-2.5-flash-image"
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-banana-500 focus:border-transparent outline-none transition-all font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                "Nano Banana Pro" 模型 ID
              </label>
              <input
                type="text"
                value={localSettings.modelProId}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, modelProId: e.target.value })
                }
                placeholder="gemini-3-pro-image-preview"
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-banana-500 focus:border-transparent outline-none transition-all font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-800">
            <button
              type="submit"
              className="flex items-center gap-2 bg-banana-600 hover:bg-banana-500 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-banana-900/20"
            >
              <Save className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsDialog;