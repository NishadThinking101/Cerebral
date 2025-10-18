import type { AudioFile } from '@/shared/types';

export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  color: string;
  audioFiles: AudioFile[];
  instrument?: string;
  effects?: Effect[];
}

export interface Effect {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  parameters: { [key: string]: number };
}
