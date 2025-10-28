'use client';

import { Trash2, Radio } from 'lucide-react';
import { Control, UseFormReturn } from 'react-hook-form';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormSelectField } from '@/components/ui/form-fields';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { type OutputLanguage } from '@/lib/constants/languages';

import {
  BasicInfoSection,
  ContentSourceSection,
  FormatSection,
  ScheduleSection,
  StyleSection,
  ImageUploadSection,
  AdminSettingsSection,
} from './index';

/**
 * Language code mapping for auto-syncing with output language
 */
const LANGUAGE_CODE_MAP: Record<string, OutputLanguage> = {
  // GA Languages (23)
  'en': 'english',
  'ar': 'arabic',
  'bn': 'bengali',
  'zh': 'chinese',
  'cmn': 'chinese',
  'cs': 'czech',
  'da': 'danish',
  'nl': 'dutch',
  'fi': 'finnish',
  'fr': 'french',
  'de': 'german',
  'el': 'greek',
  'hi': 'hindi',
  'hu': 'hungarian',
  'id': 'indonesian',
  'it': 'italian',
  'ja': 'japanese',
  'ko': 'korean',
  'pl': 'polish',
  'pt': 'portuguese',
  'ru': 'russian',
  'sk': 'slovak',
  'es': 'spanish',
  'sv': 'swedish',
  'tr': 'turkish',
  // Preview Languages (8)
  'he': 'hebrew',
  'th': 'thai',
  'uk': 'ukrainian',
  'vi': 'vietnamese',
  'ro': 'romanian',
  'ta': 'tamil',
  'te': 'telugu',
  'mr': 'marathi',
};

/**
 * Language code options (ISO 639-1)
 */
const LANGUAGE_CODE_OPTIONS = [
  { value: 'en', label: 'English (en)' },
  { value: 'ar', label: 'Arabic (ar)' },
  { value: 'bn', label: 'Bengali (bn)' },
  { value: 'zh', label: 'Chinese (zh)' },
  { value: 'cs', label: 'Czech (cs)' },
  { value: 'da', label: 'Danish (da)' },
  { value: 'nl', label: 'Dutch (nl)' },
  { value: 'fi', label: 'Finnish (fi)' },
  { value: 'fr', label: 'French (fr)' },
  { value: 'de', label: 'German (de)' },
  { value: 'el', label: 'Greek (el)' },
  { value: 'hi', label: 'Hindi (hi)' },
  { value: 'hu', label: 'Hungarian (hu)' },
  { value: 'id', label: 'Indonesian (id)' },
  { value: 'it', label: 'Italian (it)' },
  { value: 'ja', label: 'Japanese (ja)' },
  { value: 'ko', label: 'Korean (ko)' },
  { value: 'pl', label: 'Polish (pl)' },
  { value: 'pt', label: 'Portuguese (pt)' },
  { value: 'ru', label: 'Russian (ru)' },
  { value: 'sk', label: 'Slovak (sk)' },
  { value: 'es', label: 'Spanish (es)' },
  { value: 'sv', label: 'Swedish (sv)' },
  { value: 'tr', label: 'Turkish (tr)' },
  { value: 'he', label: 'Hebrew (he)' },
  { value: 'th', label: 'Thai (th)' },
  { value: 'uk', label: 'Ukrainian (uk)' },
  { value: 'vi', label: 'Vietnamese (vi)' },
  { value: 'ro', label: 'Romanian (ro)' },
  { value: 'ta', label: 'Tamil (ta)' },
  { value: 'te', label: 'Telugu (te)' },
  { value: 'mr', label: 'Marathi (mr)' },
];

interface LanguageVariantCardProps {
  index: number;
  control: Control<any>;
  form: UseFormReturn<any>;
  onRemove: () => void;
  onSetPrimary: () => void;
  canRemove: boolean;
  isPrimary: boolean;
  showLanguageControls: boolean;
}

/**
 * Language Variant Card Component
 *
 * A comprehensive card component representing a single language variant in a multi-language podcast group.
 * Includes all podcast configuration sections and language-specific controls.
 *
 * Features:
 * - Language code selection with auto-sync to output language
 * - Primary language designation (radio control)
 * - All podcast form sections (basic info, content, format, schedule, style, image, admin)
 * - Tabbed interface for better space management
 * - Remove action with validation
 *
 * @param index - The index of this variant in the languages array
 * @param control - React Hook Form control
 * @param form - Complete form instance for setValue/watch
 * @param onRemove - Callback to remove this variant
 * @param onSetPrimary - Callback to set this variant as primary
 * @param canRemove - Whether removal is allowed (false if last variant)
 * @param isPrimary - Whether this variant is the primary language
 * @param showLanguageControls - Whether to show language/primary controls (false in single-language mode)
 */
export function LanguageVariantCard({
  index,
  control,
  form,
  onRemove,
  onSetPrimary,
  canRemove,
  isPrimary,
  showLanguageControls,
}: LanguageVariantCardProps) {
  // Watch language_code for auto-sync
  const languageCode = form.watch(`languages.${index}.language_code`);

  // Map language code to output language
  const mapLanguageCodeToOutputLanguage = (code: string): OutputLanguage => {
    return LANGUAGE_CODE_MAP[code.toLowerCase()] || 'english';
  };

  // Auto-sync language field when language_code changes
  useEffect(() => {
    if (languageCode) {
      const outputLang = mapLanguageCodeToOutputLanguage(languageCode);
      form.setValue(`languages.${index}.language`, outputLang);
    }
  }, [languageCode, index, form]);

  return (
    <Card className={`relative ${isPrimary ? 'border-primary border-2' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>
              {showLanguageControls ? `Language Variant ${index + 1}` : 'Podcast Configuration'}
            </CardTitle>
            {isPrimary && showLanguageControls && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Primary
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showLanguageControls && !isPrimary && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSetPrimary}
                aria-label="Set as primary language"
                title="Set as primary language"
              >
                <Radio className="h-4 w-4" />
              </Button>
            )}
            {canRemove && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onRemove}
                aria-label="Remove language variant"
                title="Remove this variant"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-7">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Language Controls - Only shown in multi-language mode */}
          {showLanguageControls && (
            <div className="mt-4 space-y-4 rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-medium">Language Settings</h4>

              <FormSelectField
                control={control}
                name={`languages.${index}.language_code`}
                label="Language Code"
                placeholder="Select language code"
                description="ISO 639-1 language code (affects metadata and auto-syncs with audio language)"
                options={LANGUAGE_CODE_OPTIONS}
              />

              <FormField
                control={control}
                name={`languages.${index}.is_primary`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSetPrimary();
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as Primary Language</FormLabel>
                      <FormDescription>
                        The primary language is the default for the podcast group
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <BasicInfoSection control={control} />
          </TabsContent>

          {/* Content Source Tab */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <ContentSourceSection control={control} />
          </TabsContent>

          {/* Format Tab */}
          <TabsContent value="format" className="space-y-4 mt-4">
            <FormatSection control={control} setValue={form.setValue} />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <ScheduleSection control={control} />
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4 mt-4">
            <StyleSection control={control} />
          </TabsContent>

          {/* Image Tab */}
          <TabsContent value="image" className="space-y-4 mt-4">
            <ImageUploadSection
              control={control}
              showAIGeneration={true}
              telegramChannel={form.watch(`languages.${index}.telegramChannelName`)}
              podcastTitle={form.watch(`languages.${index}.title`) || 'My Podcast'}
            />
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <AdminSettingsSection control={control} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
