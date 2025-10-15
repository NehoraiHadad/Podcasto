import { ProcessingStage } from './enums';
import type { StageConfig } from './interfaces';

/**
 * Map of stages to their display configurations
 */
export const STAGE_CONFIGS: Record<ProcessingStage, Omit<StageConfig, 'stage'>> = {
  [ProcessingStage.CREATED]: {
    label: 'Created',
    description: 'Episode record created',
    color: 'gray'
  },
  [ProcessingStage.TELEGRAM_QUEUED]: {
    label: 'Queued for Telegram',
    description: 'Waiting to fetch content from Telegram',
    color: 'blue'
  },
  [ProcessingStage.TELEGRAM_PROCESSING]: {
    label: 'Fetching Content',
    description: 'Collecting messages from Telegram channels',
    color: 'blue'
  },
  [ProcessingStage.TELEGRAM_COMPLETED]: {
    label: 'Content Collected',
    description: 'Telegram content successfully fetched',
    color: 'green'
  },
  [ProcessingStage.TELEGRAM_FAILED]: {
    label: 'Telegram Failed',
    description: 'Failed to fetch content from Telegram',
    color: 'red'
  },
  [ProcessingStage.SCRIPT_QUEUED]: {
    label: 'Queued for Script',
    description: 'Waiting to generate podcast script',
    color: 'blue'
  },
  [ProcessingStage.SCRIPT_PROCESSING]: {
    label: 'Generating Script',
    description: 'Creating podcast conversation script',
    color: 'blue'
  },
  [ProcessingStage.SCRIPT_COMPLETED]: {
    label: 'Script Ready',
    description: 'Podcast script generated successfully',
    color: 'green'
  },
  [ProcessingStage.SCRIPT_FAILED]: {
    label: 'Script Failed',
    description: 'Failed to generate podcast script',
    color: 'red'
  },
  [ProcessingStage.AUDIO_QUEUED]: {
    label: 'Queued for Audio',
    description: 'Waiting to generate audio',
    color: 'blue'
  },
  [ProcessingStage.AUDIO_PROCESSING]: {
    label: 'Generating Audio',
    description: 'Converting script to audio using TTS',
    color: 'blue'
  },
  [ProcessingStage.AUDIO_COMPLETED]: {
    label: 'Audio Ready',
    description: 'Audio file generated successfully',
    color: 'green'
  },
  [ProcessingStage.AUDIO_FAILED]: {
    label: 'Audio Failed',
    description: 'Failed to generate audio',
    color: 'red'
  },
  [ProcessingStage.POST_PROCESSING]: {
    label: 'Post-Processing',
    description: 'Finalizing episode for publication',
    color: 'blue'
  },
  [ProcessingStage.PUBLISHED]: {
    label: 'Published',
    description: 'Episode published and ready',
    color: 'green'
  },
  [ProcessingStage.FAILED]: {
    label: 'Failed',
    description: 'Episode processing failed',
    color: 'red'
  }
};
