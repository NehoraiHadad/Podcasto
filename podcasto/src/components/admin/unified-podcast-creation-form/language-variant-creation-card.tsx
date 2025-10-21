'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Control } from 'react-hook-form';
import type { PodcastGroupCreationFormValues } from './schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { CoverImageField } from '@/components/shared';

/**
 * Props for LanguageVariantCreationCard component
 */
export interface LanguageVariantCreationCardProps {
  index: number;
  control: Control<PodcastGroupCreationFormValues>;
  onRemove: () => void;
  canRemove?: boolean;
  showLanguageLabel?: boolean;
}

/**
 * Language Variant Creation Card Component
 *
 * Displays a full podcast creation form for a single language variant
 */
export function LanguageVariantCreationCard({
  index,
  control,
  onRemove,
  canRemove = true,
  showLanguageLabel = true,
}: LanguageVariantCreationCardProps) {
  // Mixing techniques options
  const mixingTechniques = [
    { id: 'rhetorical-questions', label: 'Rhetorical Questions' },
    { id: 'personal-anecdotes', label: 'Personal Anecdotes' },
    { id: 'analogies', label: 'Analogies' },
    { id: 'humor', label: 'Humor' },
    { id: 'storytelling', label: 'Storytelling' },
    { id: 'data-visualization', label: 'Data Visualization' },
  ];

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {showLanguageLabel ? `Language Variant #${index + 1}` : 'Podcast Configuration'}
          </CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
              aria-label="Remove language variant"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={control}
              name={`languages.${index}.language_code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language Code</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="he">Hebrew</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.is_primary`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Primary Language</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Podcast Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter podcast title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter podcast description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CoverImageField
              control={control}
              name={`languages.${index}.cover_image`}
              description="Provide a cover image URL. Leave empty to use Telegram channel photo."
            />
          </TabsContent>

          {/* Content Source Tab */}
          <TabsContent value="content" className="space-y-4">
            <FormField
              control={control}
              name={`languages.${index}.contentSource`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Source</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="telegram">Telegram Channel</SelectItem>
                      <SelectItem value="urls">URLs</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.telegramChannel`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Channel</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="@channelname" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.telegramHours`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Hours to Fetch</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <FormField
              control={control}
              name={`languages.${index}.creator`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Creator name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.podcastName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Podcast Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Podcast name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.outputLanguage`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select output language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hebrew">Hebrew</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.slogan`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slogan (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Podcast slogan" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.creativityLevel`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creativity Level: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`languages.${index}.episodeFrequency`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Episode Frequency (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4">
            <FormField
              control={control}
              name={`languages.${index}.conversationStyle`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversation Style</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="engaging">Engaging</SelectItem>
                      <SelectItem value="dynamic">Dynamic</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.speaker1Role`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speaker 1 Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="interviewer">Interviewer</SelectItem>
                      <SelectItem value="host">Host</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.speaker2Role`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speaker 2 Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="domain-expert">Domain Expert</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.mixingTechniques`}
              render={() => (
                <FormItem>
                  <FormLabel>Mixing Techniques</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {mixingTechniques.map((technique) => (
                      <FormField
                        key={technique.id}
                        control={control}
                        name={`languages.${index}.mixingTechniques`}
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={technique.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(technique.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, technique.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== technique.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {technique.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`languages.${index}.additionalInstructions`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any additional instructions" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
