import React, { useState } from 'react';
import { X, Key, Cpu, Volume2, VolumeX, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import type { StudioSettings } from '../../types/studio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudioSettings;
  onSave: (newSettings: StudioSettings) => void;
}

const AVAILABLE_MODELS = [
  { id: 'zai-org/GLM-5.3-Flash', name: 'GLM 5.3 Flash (Recommended)', desc: 'Ultra-fast inference & superior structured JSON code generation' },
  { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B', desc: 'Code AST comprehension & structured JSON' },
  { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B Instruct', desc: 'Powerful general reasoning & detailed explanations' },
  { id: 'mistralai/Mistral-Small-24B-Instruct-2501', name: 'Mistral Small 24B', desc: 'Fast & responsive open weights model' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [speechEnabled, setSpeechEnabled] = useState(settings.speechEnabled);
  const [showKey, setShowKey] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...settings,
      apiKey: apiKey.trim(),
      model,
      speechEnabled,
    });
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Workspace Settings</h3>
              <p className="text-xs text-slate-500">Configure Featherless AI & Studio Preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Featherless API Key
              </label>
              {apiKey ? (
                <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Key Saved
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 font-medium">Using Mock / Preset Mode</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="fl-..."
                className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono pr-10 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Stored locally in browser <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">localStorage</code>.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Inference Model
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    model === m.id
                      ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    checked={model === m.id}
                    onChange={() => setModel(m.id)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">{m.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Voice Narration Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                {speechEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Voice Narration</div>
                <div className="text-[11px] text-slate-400">Speak algorithmic reasoning aloud on each step</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                speechEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  speechEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <div className="text-[11px] text-slate-400 font-mono">
            api.featherless.ai/v1
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/30 cursor-pointer"
            >
              {saveToast ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
