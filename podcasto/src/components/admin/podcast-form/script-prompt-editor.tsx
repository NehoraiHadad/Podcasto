'use client';

import { useState } from 'react';
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
  const [localValue, setLocalValue] = useState(value);
  const [showVariables, setShowVariables] = useState(false);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleReset = () => {
    handleChange('');
  };

  const isEmpty = !localValue || localValue.trim() === '';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Custom Script Generation Prompt
          </CardTitle>
          <CardDescription>
            Define a custom prompt template for generating podcast scripts. Leave empty to use the default system prompt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEmpty && (
            <Alert>
              <AlertDescription>
                <strong>Currently using default prompt.</strong> Add a custom prompt below to override the default behavior.
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
                {!isEmpty && (
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
                          This will clear your custom prompt and revert to using the default system prompt for script generation. This action cannot be undone.
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
              placeholder="Enter your custom prompt template here. Use variables like {language}, {speaker1_role}, {content}, etc."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Use curly braces to insert dynamic variables. Example: <code className="bg-muted px-1 py-0.5 rounded">{"You are creating a {language} podcast..."}</code>
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
