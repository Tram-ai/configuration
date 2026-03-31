export interface Provider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  apiKey: string;
  defaultModel: string;
}

export interface ThemeColors {
  bg: string;
  fg: string;
  accent: string;
  border: string;
  card: string;
  muted: string;
  mutedFg: string;
  primary: string;
  primaryFg: string;
  secondary: string;
  secondaryFg: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
}

export type ApprovalMode = 'plan' | 'default' | 'auto-edit' | 'yolo';

export interface ProxyConfig {
  enabled: boolean;
  mode: 'system' | 'custom' | 'off';
  url: string;
}

export interface TramConfig {
  $version: number;
  modelProviders: Record<string, ProviderEntry[]>;
  env: Record<string, string>;
  security: {
    auth: {
      selectedType: string;
    };
    proxy?: string;
    proxyMode?: string;
  };
  model: {
    name?: string;
  };
  tools: {
    approvalMode: ApprovalMode;
  };
  ui: {
    theme: string;
    customThemes?: Record<string, unknown>;
  };
  general?: {
    douyinMcpEndpoint?: string;
    siliconFlowApiKey?: string;
  };
}

export interface ProviderEntry {
  id: string;
  name: string;
  upstreamModelId?: string;
  envKey?: string;
  baseUrl?: string;
}

export const PROVIDER_PRESETS: Record<string, {
  type: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  defaultModel: string;
}> = {
  OpenAI: {
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
  },
  Anthropic: {
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-20250514',
  },
  'Google Gemini': {
    type: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.5-pro',
  },
  'Vertex AI': {
    type: 'vertex-ai',
    baseUrl: '',
    apiKeyEnvVar: 'GOOGLE_APPLICATION_CREDENTIALS',
    defaultModel: 'gemini-2.5-pro',
  },
  SiliconFlow: {
    type: 'openai',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKeyEnvVar: 'SILICONFLOW_API_KEY',
    defaultModel: 'Qwen/Qwen3-Coder',
  },
  Cerebras: {
    type: 'openai',
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKeyEnvVar: 'CEREBRAS_API_KEY',
    defaultModel: 'llama-4-scout-17b-16e-instruct',
  },
  Groq: {
    type: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnvVar: 'GROQ_API_KEY',
    defaultModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
  },
  Pollinations: {
    type: 'openai',
    baseUrl: 'https://gen.pollinations.ai/v1',
    apiKeyEnvVar: '',
    defaultModel: 'openai',
  },
  DashScope: {
    type: 'openai',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnvVar: 'DASHSCOPE_API_KEY',
    defaultModel: 'qwen3-coder',
  },
  'OpenRouter': {
    type: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    defaultModel: 'qwen/qwen3-coder',
  },
};

export const APPROVAL_MODES: { value: ApprovalMode; label: string; description: string; icon: string }[] = [
  { value: 'default', label: '审批模式', description: '每个工具调用都需要审批', icon: '🔒' },
  { value: 'auto-edit', label: '自动编辑', description: '自动批准文件编辑', icon: '✏️' },
  { value: 'yolo', label: 'YOLO', description: '全自动模式，无需审批', icon: '🚀' },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'qwen-dark',
    name: 'Qwen Dark',
    colors: { bg: '#0b0e14', fg: '#bfbdb6', accent: '#FFD700', border: '#3D4149', card: '#0a0c11', muted: '#1c1f26', mutedFg: '#646A71', primary: '#FFD700', primaryFg: '#0b0e14', secondary: '#1c1f26', secondaryFg: '#bfbdb6' },
  },
  {
    id: 'qwen-light',
    name: 'Qwen Light',
    colors: { bg: '#f8f9fa', fg: '#5c6166', accent: '#399ee6', border: '#CCCFD3', card: '#ffffff', muted: '#eef0f2', mutedFg: '#ABADB1', primary: '#399ee6', primaryFg: '#ffffff', secondary: '#eef0f2', secondaryFg: '#5c6166' },
  },
  {
    id: 'ayu-dark',
    name: 'Ayu',
    colors: { bg: '#0b0e14', fg: '#aeaca6', accent: '#FFB454', border: '#3D4149', card: '#0a0c11', muted: '#1c1f26', mutedFg: '#646A71', primary: '#FFB454', primaryFg: '#0b0e14', secondary: '#1c1f26', secondaryFg: '#aeaca6' },
  },
  {
    id: 'ayu-light',
    name: 'Ayu Light',
    colors: { bg: '#f8f9fa', fg: '#5c6166', accent: '#f2ae49', border: '#a6aaaf', card: '#ffffff', muted: '#eef0f2', mutedFg: '#ABADB1', primary: '#f2ae49', primaryFg: '#f8f9fa', secondary: '#eef0f2', secondaryFg: '#5c6166' },
  },
  {
    id: 'atom-one-dark',
    name: 'Atom One',
    colors: { bg: '#282c34', fg: '#abb2bf', accent: '#e6c07b', border: '#5c6370', card: '#21252b', muted: '#2c313a', mutedFg: '#5c6370', primary: '#61aeee', primaryFg: '#282c34', secondary: '#2c313a', secondaryFg: '#abb2bf' },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: { bg: '#282a36', fg: '#a3afb7', accent: '#fff783', border: '#6272a4', card: '#21222c', muted: '#343746', mutedFg: '#6272a4', primary: '#ff79c6', primaryFg: '#282a36', secondary: '#343746', secondaryFg: '#a3afb7' },
  },
  {
    id: 'default-dark',
    name: 'Default',
    colors: { bg: '#1E1E2E', fg: '#CDD6F4', accent: '#F9E2AF', border: '#6C7086', card: '#181825', muted: '#262637', mutedFg: '#6C7086', primary: '#89B4FA', primaryFg: '#1E1E2E', secondary: '#262637', secondaryFg: '#CDD6F4' },
  },
  {
    id: 'default-light',
    name: 'Default Light',
    colors: { bg: '#FAFAFA', fg: '#333333', accent: '#D5A40A', border: '#97a0b0', card: '#ffffff', muted: '#f0f0f0', mutedFg: '#97a0b0', primary: '#3B82F6', primaryFg: '#ffffff', secondary: '#f0f0f0', secondaryFg: '#333333' },
  },
  {
    id: 'github-dark',
    name: 'GitHub',
    colors: { bg: '#24292e', fg: '#c0c4c8', accent: '#FFAB70', border: '#6A737D', card: '#1f2428', muted: '#2d3239', mutedFg: '#6A737D', primary: '#79B8FF', primaryFg: '#24292e', secondary: '#2d3239', secondaryFg: '#c0c4c8' },
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    colors: { bg: '#f8f8f8', fg: '#24292E', accent: '#990073', border: '#999', card: '#ffffff', muted: '#f0f0f0', mutedFg: '#999', primary: '#445588', primaryFg: '#f8f8f8', secondary: '#f0f0f0', secondaryFg: '#24292E' },
  },
  {
    id: 'google-code',
    name: 'Google Code',
    colors: { bg: '#ffffff', fg: '#444', accent: '#660', border: '#c0c0c0', card: '#f8f8f8', muted: '#f5f5f5', mutedFg: '#5f6368', primary: '#008', primaryFg: '#ffffff', secondary: '#f5f5f5', secondaryFg: '#444' },
  },
  {
    id: 'shades-of-purple',
    name: 'Shades Of Purple',
    colors: { bg: '#2d2b57', fg: '#e3dfff', accent: '#fad000', border: '#726c86', card: '#262450', muted: '#383566', mutedFg: '#726c86', primary: '#a599e9', primaryFg: '#2d2b57', secondary: '#383566', secondaryFg: '#e3dfff' },
  },
  {
    id: 'xcode',
    name: 'Xcode',
    colors: { bg: '#ffffff', fg: '#444', accent: '#836C28', border: '#c0c0c0', card: '#f8f8f8', muted: '#f5f5f5', mutedFg: '#c0c0c0', primary: '#1c00cf', primaryFg: '#ffffff', secondary: '#f5f5f5', secondaryFg: '#444' },
  },
  {
    id: 'ansi',
    name: 'ANSI',
    colors: { bg: '#000000', fg: '#ffffff', accent: '#ffff00', border: '#808080', card: '#111111', muted: '#1a1a1a', mutedFg: '#808080', primary: '#00ffff', primaryFg: '#000000', secondary: '#1a1a1a', secondaryFg: '#ffffff' },
  },
  {
    id: 'ansi-light',
    name: 'ANSI Light',
    colors: { bg: '#ffffff', fg: '#444', accent: '#ffa500', border: '#cccccc', card: '#f8f8f8', muted: '#f0f0f0', mutedFg: '#999', primary: '#0000ff', primaryFg: '#ffffff', secondary: '#f0f0f0', secondaryFg: '#444' },
  },
];
