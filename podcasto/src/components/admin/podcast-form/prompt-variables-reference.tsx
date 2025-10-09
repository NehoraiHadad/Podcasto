'use client';

import { Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Component that displays available variables for custom script prompts
 */
export function PromptVariablesReference() {
  const variables = [
    {
      name: '{language}',
      description: 'Language of the podcast',
      example: 'english, hebrew'
    },
    {
      name: '{speaker1_role}',
      description: 'Role of the first speaker',
      example: 'host, interviewer, moderator'
    },
    {
      name: '{speaker2_role}',
      description: 'Role of the second speaker (may be dynamically set based on content)',
      example: 'expert, analyst, guest'
    },
    {
      name: '{speaker1_gender}',
      description: 'Gender of the first speaker',
      example: 'male, female'
    },
    {
      name: '{speaker2_gender}',
      description: 'Gender of the second speaker',
      example: 'male, female'
    },
    {
      name: '{podcast_name}',
      description: 'Name of the podcast',
      example: 'Daily Tech News'
    },
    {
      name: '{target_duration}',
      description: 'Target duration in minutes',
      example: '10'
    },
    {
      name: '{content}',
      description: 'Formatted content from Telegram messages to discuss',
      example: 'Message list with dates and channels'
    },
    {
      name: '{additional_instructions}',
      description: 'Additional instructions from the basic config',
      example: 'Focus on technical details'
    },
    {
      name: '{voice_info}',
      description: 'Information about selected voices for this episode',
      example: 'Voice configuration details'
    },
    {
      name: '{content_info}',
      description: 'Content analysis results (type, confidence, reasoning)',
      example: 'Content type: technology, Role: Technical Expert'
    },
    {
      name: '{adaptive_instructions}',
      description: 'Dynamic instructions based on content volume (compression/expansion strategy)',
      example: 'Compression strategy for high-volume content'
    },
    {
      name: '{channel_context}',
      description: 'Information about source channels',
      example: '(discussing content from Channel1, Channel2)'
    },
    {
      name: '{content_type}',
      description: 'Type of content detected',
      example: 'news, technology, entertainment, finance'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Available Variables
        </CardTitle>
        <CardDescription>
          Use these variables in your custom prompt template. They will be replaced with actual values when generating scripts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Variables must be wrapped in curly braces exactly as shown below. Example: <code className="bg-muted px-1 py-0.5 rounded">{'Create a {language} podcast between {speaker1_role} and {speaker2_role}'}</code>
          </AlertDescription>
        </Alert>

        <div className="grid gap-3">
          {variables.map((variable) => (
            <div key={variable.name} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {variable.name}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">{variable.description}</p>
              {variable.example && (
                <p className="text-xs text-muted-foreground italic">
                  Example: {variable.example}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
