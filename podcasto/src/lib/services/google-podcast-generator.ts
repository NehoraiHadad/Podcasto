import { GoogleGenAI } from '@google/genai';

interface PodcastConfig {
  language?: string;
  speaker1_role?: string;
  speaker2_role?: string;
  podcast_name?: string;
  conversation_style?: string[];
  creativity_level?: number;
  additional_instructions?: string;
}

interface TelegramData {
  results?: {
    [channel: string]: Array<{
      text?: string;
      urls?: string[];
      media_description?: string;
      timestamp?: string;
    }>;
  };
  total_messages?: number;
}

interface GeneratePodcastParams {
  episodeId: string;
  podcastId: string;
  telegramData: TelegramData;
  language: string;
}

interface PodcastGenerationResult {
  audioBuffer: Buffer;
  duration: number;
  title?: string;
  description?: string;
  script?: Array<{ speaker: string; text: string }>;
}

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

export class GooglePodcastGenerator {
  private client: GoogleGenAI;
  private config: PodcastConfig;

  constructor(config: PodcastConfig) {
    this.config = config;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates a complete podcast from Telegram data
   */
  async generatePodcast(params: GeneratePodcastParams): Promise<PodcastGenerationResult> {
    console.log(`[GOOGLE_GEN] Starting podcast generation for episode: ${params.episodeId}`);

    // Step 1: Extract and prepare content from Telegram data
    const content = this.extractContentFromTelegram(params.telegramData);
    if (!content || content.trim().length < 50) {
      throw new Error('Insufficient content extracted from Telegram data');
    }

    console.log(`[GOOGLE_GEN] Extracted ${content.length} characters of content`);

    // Step 2: Generate podcast script using Gemini
    const script = await this.generatePodcastScript(content, params.language);
    console.log(`[GOOGLE_GEN] Generated script with ${script.length} segments`);

    // Step 3: Generate audio using Google TTS
    const audioResult = await this.generateAudio(script, params.language);
    console.log(`[GOOGLE_GEN] Generated audio with duration: ${audioResult.duration}s`);

    // Step 4: Generate title and description
    const metadata = await this.generateMetadata(content, script, params.language);

    return {
      audioBuffer: audioResult.audioBuffer,
      duration: audioResult.duration,
      title: metadata.title,
      description: metadata.description,
      script
    };
  }

  /**
   * Extracts and formats content from Telegram data
   */
  private extractContentFromTelegram(data: TelegramData): string {
    if (!data.results) {
      throw new Error('No results found in Telegram data');
    }

    const allMessages: string[] = [];

    for (const [channel, messages] of Object.entries(data.results)) {
      console.log(`[GOOGLE_GEN] Processing ${messages.length} messages from channel: ${channel}`);
      
      for (const message of messages) {
        const parts: string[] = [];
        
        // Add text content
        if (message.text && message.text.trim()) {
          parts.push(message.text.trim());
        }
        
        // Add URLs if any
        if (message.urls && message.urls.length > 0) {
          parts.push(`URLs mentioned: ${message.urls.join(', ')}`);
        }
        
        // Add media descriptions
        if (message.media_description) {
          parts.push(`Media: ${message.media_description}`);
        }
        
        if (parts.length > 0) {
          allMessages.push(parts.join('\n'));
        }
      }
    }

    const combinedContent = allMessages.join('\n\n---\n\n');
    
    // Limit content length to stay within Gemini limits
    const maxLength = 100000; // Characters
    if (combinedContent.length > maxLength) {
      console.log(`[GOOGLE_GEN] Truncating content from ${combinedContent.length} to ${maxLength} characters`);
      return combinedContent.substring(0, maxLength) + '\n\n[Content truncated for length...]';
    }

    return combinedContent;
  }

  /**
   * Generates a podcast script using Gemini
   */
  private async generatePodcastScript(
    content: string, 
    language: string
  ): Promise<Array<{ speaker: string; text: string }>> {
    
    const speaker1 = this.config.speaker1_role || 'Speaker 1';
    const speaker2 = this.config.speaker2_role || 'Speaker 2';
    const podcastName = this.config.podcast_name || 'The Podcast';
    const creativity = (this.config.creativity_level || 70) / 100;
    const additionalInstructions = this.config.additional_instructions || '';

    const prompt = this.buildScriptPrompt(content, language, speaker1, speaker2, podcastName, additionalInstructions);

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: {
          temperature: creativity,
        }
      });

      const scriptText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!scriptText) {
        throw new Error('No script generated by Gemini');
      }

      return this.parseScript(scriptText, speaker1, speaker2);
    } catch (error) {
      console.error('[GOOGLE_GEN] Error generating script:', error);
      throw new Error(`Failed to generate podcast script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Builds the prompt for script generation
   */
  private buildScriptPrompt(
    content: string,
    language: string,
    speaker1: string,
    speaker2: string,
    podcastName: string,
    additionalInstructions: string
  ): string {
    const languageInstructions = language === 'he' 
      ? 'Generate the podcast script in Hebrew. Use natural, conversational Hebrew.'
      : 'Generate the podcast script in English.';

    return `You are an AI scriptwriter for a podcast called "${podcastName}". 

Your task is to create an engaging, conversational podcast script between two speakers: ${speaker1} and ${speaker2}.

${languageInstructions}

CONTENT TO DISCUSS:
${content}

INSTRUCTIONS:
1. Create a natural, dynamic conversation between ${speaker1} and ${speaker2}
2. ${speaker1} should introduce topics and guide the conversation
3. ${speaker2} should provide detailed explanations and insights
4. Include natural transitions, reactions, and follow-up questions
5. Make it engaging with appropriate enthusiasm and curiosity
6. Keep the conversation flowing naturally
7. Length: Aim for 10-15 minutes of content (approximately 1500-2000 words)

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${additionalInstructions}` : ''}

FORMAT: Return the script in this exact format:
${speaker1}: [opening introduction and topic introduction]
${speaker2}: [response and first insight]
${speaker1}: [follow-up question or comment]
${speaker2}: [detailed explanation]
[Continue the conversation...]

Begin the script now:`;
  }

  /**
   * Parses the generated script into structured format
   */
  private parseScript(
    scriptText: string, 
    speaker1: string, 
    speaker2: string
  ): Array<{ speaker: string; text: string }> {
    const lines = scriptText.split('\n').filter(line => line.trim());
    const script: Array<{ speaker: string; text: string }> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Try to parse speaker format: "Speaker: text"
      const speaker1Match = trimmedLine.match(new RegExp(`^${speaker1}:\\s*(.+)`, 'i'));
      const speaker2Match = trimmedLine.match(new RegExp(`^${speaker2}:\\s*(.+)`, 'i'));
      
      if (speaker1Match) {
        script.push({ speaker: speaker1, text: speaker1Match[1].trim() });
      } else if (speaker2Match) {
        script.push({ speaker: speaker2, text: speaker2Match[1].trim() });
      }
    }

    if (script.length === 0) {
      throw new Error('Failed to parse any valid dialogue from the generated script');
    }

    console.log(`[GOOGLE_GEN] Parsed ${script.length} dialogue segments`);
    return script;
  }

  /**
   * Generates audio using Google TTS based on the provided example
   */
  private async generateAudio(
    script: Array<{ speaker: string; text: string }>,
    _language: string
  ): Promise<{ audioBuffer: Buffer; duration: number }> {
    
    const speaker1 = this.config.speaker1_role || 'Speaker 1';
    const speaker2 = this.config.speaker2_role || 'Speaker 2';

    console.log(`[GOOGLE_GEN] Generating audio for ${script.length} segments`);

    // Split script into smaller chunks to avoid timeout
    const maxChunkSize = 3000; // Max characters per API call
    const chunks = this.splitScriptIntoChunks(script, maxChunkSize);
    
    console.log(`[GOOGLE_GEN] Split into ${chunks.length} chunks for processing`);

    const allAudioChunks: Buffer[] = [];

    // Process each chunk separately
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkText = chunk.map(segment => `${segment.speaker}: ${segment.text}`).join('\n');
      
      console.log(`[GOOGLE_GEN] Processing chunk ${i + 1}/${chunks.length} (${chunkText.length} chars)`);

      const config = {
        temperature: 1,
        responseModalities: ['AUDIO' as const],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: speaker1,
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Zephyr'
                  }
                }
              },
              {
                speaker: speaker2,
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Puck'
                  }
                }
              },
            ]
          },
        },
      };

      const model = 'gemini-2.5-flash-preview-tts';
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Read aloud in a warm, welcoming tone:\n${chunkText}`,
            },
          ],
        },
      ];

      try {
        const response = await this.client.models.generateContentStream({
          model,
          config,
          contents,
        });

        const chunkAudioParts: Buffer[] = [];

        for await (const chunk of response) {
          if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
          }
          
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            let buffer = Buffer.from(inlineData.data || '', 'base64');
            
            // Convert to WAV if needed
            if (!inlineData.mimeType || !inlineData.mimeType.includes('wav')) {
              buffer = Buffer.from(this.convertToWav(inlineData.data || '', inlineData.mimeType || ''));
            }
            
            chunkAudioParts.push(buffer as Buffer);
          }
        }

        if (chunkAudioParts.length > 0) {
          const chunkAudio = Buffer.concat(chunkAudioParts);
          // Extract audio data without WAV header (skip first 44 bytes)
          const audioDataOnly = chunkAudio.slice(44);
          allAudioChunks.push(audioDataOnly);
          console.log(`[GOOGLE_GEN] Chunk ${i + 1} generated ${chunkAudio.length} bytes (${audioDataOnly.length} audio data)`);
        }

        // Add small delay between chunks to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`[GOOGLE_GEN] Error generating audio for chunk ${i + 1}:`, error);
        throw new Error(`Failed to generate audio for chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (allAudioChunks.length === 0) {
      throw new Error('No audio data generated');
    }

    // Combine all raw audio data
    const combinedRawAudio = Buffer.concat(allAudioChunks);
    
    // Create new WAV header for the combined audio
    const wavOptions: WavConversionOptions = {
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16
    };
    
    const wavHeader = this.createWavHeader(combinedRawAudio.length, wavOptions);
    const finalWavFile = Buffer.concat([wavHeader, combinedRawAudio]);
    
    // Calculate accurate duration based on sample rate and data length
    const totalSamples = combinedRawAudio.length / (wavOptions.bitsPerSample / 8);
    const accurateDuration = Math.round(totalSamples / wavOptions.sampleRate);
    
    console.log(`[GOOGLE_GEN] Generated total ${finalWavFile.length} bytes of WAV data`);
    console.log(`[GOOGLE_GEN] Raw audio data: ${combinedRawAudio.length} bytes`);
    console.log(`[GOOGLE_GEN] Calculated duration: ${accurateDuration}s`);

    return {
      audioBuffer: finalWavFile,
      duration: accurateDuration
    };
  }

  /**
   * Split script into smaller chunks to avoid API timeout
   */
  private splitScriptIntoChunks(
    script: Array<{ speaker: string; text: string }>,
    maxChunkSize: number
  ): Array<Array<{ speaker: string; text: string }>> {
    const chunks: Array<Array<{ speaker: string; text: string }>> = [];
    let currentChunk: Array<{ speaker: string; text: string }> = [];
    let currentSize = 0;

    for (const segment of script) {
      const segmentSize = segment.speaker.length + segment.text.length + 4; // +4 for ': ' and '\n'
      
      // If adding this segment would exceed the limit, start a new chunk
      if (currentSize + segmentSize > maxChunkSize && currentChunk.length > 0) {
        chunks.push([...currentChunk]);
        currentChunk = [];
        currentSize = 0;
      }
      
      currentChunk.push(segment);
      currentSize += segmentSize;
    }

    // Add the final chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Convert audio data to WAV format
   */
  private convertToWav(rawData: string, mimeType: string): Buffer {
    const options = this.parseMimeType(mimeType);
    const buffer = Buffer.from(rawData, 'base64');
    const wavHeader = this.createWavHeader(buffer.length, options);
    return Buffer.concat([wavHeader, buffer]) as Buffer;
  }

  /**
   * Parse MIME type to extract audio parameters
   */
  private parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');

    const options: Partial<WavConversionOptions> = {
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16
    };

    if (format && format.startsWith('L')) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }

    for (const param of params) {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'rate') {
        options.sampleRate = parseInt(value, 10);
      }
    }

    return options as WavConversionOptions;
  }

  /**
   * Create WAV file header
   */
  private createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);                      // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
    buffer.write('WAVE', 8);                      // Format
    buffer.write('fmt ', 12);                     // Subchunk1ID
    buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);        // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
    buffer.writeUInt32LE(byteRate, 28);           // ByteRate
    buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
    buffer.write('data', 36);                     // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

    return buffer;
  }

  /**
   * Generates title and description for the episode
   */
  private async generateMetadata(
    content: string,
    script: Array<{ speaker: string; text: string }>,
    language: string
  ): Promise<{ title: string; description: string }> {
    
    const prompt = `Based on the following content and podcast script, generate:
1. A compelling episode title (max 100 characters)
2. A brief episode description (max 300 characters)

Content summary: ${content.substring(0, 1000)}...

Podcast script preview: ${script.slice(0, 3).map(s => `${s.speaker}: ${s.text}`).join('\n')}

${language === 'he' ? 'Respond in Hebrew.' : 'Respond in English.'}

Format:
TITLE: [title here]
DESCRIPTION: [description here]`;

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: {
          temperature: 0.7,
        }
      });

      const metadataText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const titleMatch = metadataText.match(/TITLE:\s*(.+)/);
      const descriptionMatch = metadataText.match(/DESCRIPTION:\s*(.+)/);

      return {
        title: titleMatch?.[1]?.trim() || `Episode ${new Date().toLocaleDateString()}`,
        description: descriptionMatch?.[1]?.trim() || 'Auto-generated podcast episode'
      };

    } catch (error) {
      console.error('[GOOGLE_GEN] Error generating metadata:', error);
      return {
        title: `Episode ${new Date().toLocaleDateString()}`,
        description: 'Auto-generated podcast episode'
      };
    }
  }
} 