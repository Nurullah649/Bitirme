export interface AnalysisResult {
  id: string;
  imageUri: string;
  timestamp: string;
  diseaseName: string;
  confidence: number;
  recommendation: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  location: string;
}