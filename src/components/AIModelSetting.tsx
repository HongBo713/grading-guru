import React, { useState, useEffect } from 'react';
import { Settings, Key, AlertTriangle, ChevronDown } from 'lucide-react';

type ModelProvider = 'openai' | 'onnx';

interface ProviderSettings {
  enabled: boolean;
  apiKey: string;
  models: string[];
  selectedModel?: string;
  modelPath?: string;
}

interface AISettings {
  activeProvider: ModelProvider | null;
  openai: ProviderSettings;
  onnx: ProviderSettings & {
    modelPath: string;
  };
}

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
}

const AVAILABLE_MODELS = {
  openai: [
    'gpt-4o-2024-08-06',    // GPT-4 Omega
    'gpt-4o-mini-2024-07-18', // GPT-4 Omega Mini
    'gpt-4-turbo-2024-04-09',  // GPT-4 Turbo
  ]
};

const AIModelSettings: React.FC = () => {
  const [settings, setSettings] = useState<AISettings>({
    activeProvider: null,
    openai: {
      enabled: false,
      apiKey: '',
      models: AVAILABLE_MODELS.openai,
      selectedModel: AVAILABLE_MODELS.openai[0]
    },
    onnx: {
      enabled: false,
      apiKey: '',
      modelPath: '',
      models: []
    }
  });

  const [savedStatus, setSavedStatus] = useState<string>('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('aiModelSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleToggleProvider = (provider: ModelProvider) => {
    setSettings(prev => {
      // If this provider is already active, disable it
      if (prev.activeProvider === provider) {
        return {
          ...prev,
          activeProvider: null,
          [provider]: {
            ...prev[provider],
            enabled: false
          }
        };
      }

      // Create updated settings with all providers disabled
      const updatedSettings = {
        ...prev,
        activeProvider: provider,
        openai: { ...prev.openai, enabled: false },
        onnx: { 
          ...prev.onnx, 
          enabled: false,
          modelPath: prev.onnx.modelPath 
        }
      };

      // Enable the selected provider
      if (provider === 'onnx') {
        updatedSettings.onnx = {
          ...updatedSettings.onnx,
          enabled: true,
          modelPath: updatedSettings.onnx.modelPath
        };
      } else {
        const providerSettings = {
          ...updatedSettings[provider],
          enabled: true
        };
        updatedSettings[provider] = providerSettings;
      }

      return updatedSettings;
    });
  };

  const handleApiKeyChange = (provider: ModelProvider, value: string) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: value
      }
    }));
  };

  const handleModelChange = (provider: ModelProvider, model: string) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        selectedModel: model
      }
    }));
  };

  const handleModelPathChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      onnx: {
        ...prev.onnx,
        modelPath: value
      }
    }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('aiModelSettings', JSON.stringify(settings));
      setSavedStatus('Settings saved successfully!');
    } catch (error) {
      setSavedStatus('Error saving settings: Storage might be full or disabled');
    }
    setTimeout(() => setSavedStatus(''), 3000);
  };

  const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] ${
        enabled ? 'bg-blue-600' : 'bg-[#2D2D2D]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const ModelSelect: React.FC<{
    provider: ModelProvider;
    models: string[];
    selectedModel?: string;
  }> = ({ provider, models, selectedModel }) => (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => handleModelChange(provider, e.target.value)}
        className="w-full appearance-none bg-[#1E1E1E] text-white rounded border border-[#404040] px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {models.map((model) => (
          <option key={model} value={model} className="bg-[#1E1E1E]">
            {model}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );

  const renderProviderSection = (provider: ModelProvider, title: string) => (
    <div className={`space-y-4 bg-[#252526] rounded-lg p-4 transition-colors ${
      settings.activeProvider === provider ? 'ring-2 ring-blue-500' : ''
    }`}>
      <div className="flex items-center justify-between">
        <label className="text-lg font-semibold text-white">{title}</label>
        <ToggleSwitch
          enabled={settings[provider].enabled}
          onToggle={() => handleToggleProvider(provider)}
        />
      </div>
      {settings[provider].enabled && (
        <div className="space-y-4">
          {provider !== 'onnx' && (
            <div className="space-y-2">
              <label className="block text-sm text-gray-300">Model</label>
              <ModelSelect
                provider={provider}
                models={AVAILABLE_MODELS[provider]}
                selectedModel={settings[provider].selectedModel}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">
              {provider === 'onnx' ? 'Model Path' : 'API Key'}
            </label>
            {provider === 'onnx' ? (
              <input
                type="text"
                className="w-full bg-[#1E1E1E] text-white rounded border border-[#404040] px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter path to ONNX model"
                value={settings.onnx.modelPath}
                onChange={(e) => handleModelPathChange(e.target.value)}
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  className="flex-1 bg-[#1E1E1E] text-white rounded border border-[#404040] px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Enter ${title} API key`}
                  value={settings[provider].apiKey}
                  onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                />
                <Key className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          {provider === 'onnx' && (
            <div className="mt-2 flex items-start p-4 rounded-md bg-[#2D2D2D] text-yellow-300 border border-yellow-600/20">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
              <span className="text-sm">
                Make sure the ONNX model is compatible with your system and has the required dependencies installed.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {renderProviderSection('openai', 'OpenAI')}
        {/* {renderProviderSection('onnx', 'ONNX Local Model')} */}

        <div className="flex justify-end gap-4 pt-4">
          {savedStatus && (
            <div className="bg-green-900/50 text-green-400 border border-green-600/20 px-4 py-2 rounded-md">
              {savedStatus}
            </div>
          )}
          <button
            onClick={saveSettings}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E]"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIModelSettings;