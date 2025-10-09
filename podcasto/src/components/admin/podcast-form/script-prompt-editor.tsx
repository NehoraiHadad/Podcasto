'use client';

import { useState, useEffect } from 'react';
import { FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PromptVariablesReference } from './prompt-variables-reference';
import { DEFAULT_SCRIPT_PROMPT } from '@/lib/constants/default-script-prompt';

interface ScriptPromptEditorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Editor component for custom script generation prompts
 * Allows admins to customize the prompt template used for generating episode scripts
 */
export function ScriptPromptEditor({ value = '', onChange, disabled = false }: ScriptPromptEditorProps) {
  // Show default prompt if no custom value is provided
  const displayValue = value || DEFAULT_SCRIPT_PROMPT;
  const [localValue, setLocalValue] = useState(displayValue);
  const [showVariables, setShowVariables] = useState(false);

  // Sync localValue with displayValue when value prop changes
  useEffect(() => {
    setLocalValue(displayValue);
  }, [displayValue]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleReset = () => {
    setLocalValue(DEFAULT_SCRIPT_PROMPT);
    onChange('');
  };

  // Check if we're using the default prompt (empty or matches default)
  const isUsingDefault = !value || value.trim() === '';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Script Generation Prompt
          </CardTitle>
          <CardDescription>
            Customize the prompt template used for generating podcast scripts. The default prompt is displayed below and can be modified to fit your needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUsingDefault && (
            <Alert>
              <AlertDescription>
                <strong>Currently using default prompt.</strong> The default prompt is displayed below. You can modify it to create a custom version.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="scriptPrompt">
                Prompt Template
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVariables(!showVariables)}
                >
                  {showVariables ? 'Hide' : 'Show'} Variables
                </Button>
                {!isUsingDefault && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Default
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset to Default Prompt?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will discard your custom prompt and revert to the default system prompt for script generation. The default prompt will be displayed in the editor.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>
                          Reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            <Textarea
              id="scriptPrompt"
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              placeholder="The default prompt template will be displayed here..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              {isUsingDefault ? (
                <>The default prompt template is shown above. You can edit it to create a custom version. To save the default as-is, simply save the form without changes.</>
              ) : (
                <>Use curly braces to insert dynamic variables. Example: <code className="bg-muted px-1 py-0.5 rounded">{"You are creating a {language} podcast..."}</code></>
              )}
            </p>
          </div>

          {showVariables && (
            <div className="mt-4">
              <PromptVariablesReference />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
