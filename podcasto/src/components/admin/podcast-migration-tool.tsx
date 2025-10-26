'use client';

import { useState, useEffect } from 'react';
import { createPodcastGroupAction } from '@/lib/actions/podcast-group-actions';
import { getLanguageFlag, getLanguageName, getSupportedLanguageCodes } from '@/lib/utils/language-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Search, Globe, ChevronRight } from 'lucide-react';
import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at?: Date | null;
  podcast_group_id?: string | null;
}

interface PodcastWithLanguage extends Podcast {
  detected_language?: string;
}

/**
 * Podcast Migration Tool Component
 *
 * Allows admins to:
 * 1. Search for podcasts
 * 2. View potential duplicates
 * 3. Select podcasts to merge
 * 4. Assign languages
 * 5. Set primary language
 * 6. Create podcast group
 */
export function PodcastMigrationTool() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPodcasts, setSelectedPodcasts] = useState<PodcastWithLanguage[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [merging, setMerging] = useState(false);
  const [baseTitle, setBaseTitle] = useState('');
  const [baseDescription, setBaseDescription] = useState('');

  // Load podcasts on mount
  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      // Fetch podcasts via API route
      const response = await fetch('/api/podcasts?eligible_for_migration=true');
      if (!response.ok) {
        throw new Error('Failed to fetch podcasts');
      }
      const data = await response.json();
      setPodcasts(data);
    } catch (error) {
      console.error('Failed to load podcasts:', error);
      toast.error('Failed to load podcasts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPodcasts = podcasts.filter(podcast =>
    podcast.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPodcast = (podcast: Podcast) => {
    if (selectedPodcasts.some(p => p.id === podcast.id)) {
      setSelectedPodcasts(selectedPodcasts.filter(p => p.id !== podcast.id));
    } else {
      setSelectedPodcasts([...selectedPodcasts, podcast]);
    }
  };

  const handleOpenMergeDialog = () => {
    if (selectedPodcasts.length < 2) {
      toast.error('Please select at least 2 podcasts to merge');
      return;
    }

    // Set default base title from first selected podcast
    if (selectedPodcasts.length > 0) {
      const firstPodcast = selectedPodcasts[0];
      // Remove language suffix if present
      const cleanTitle = firstPodcast.title
        .replace(/\s+(hebrew|english|arabic|spanish|french|german|russian)$/i, '')
        .trim();
      setBaseTitle(cleanTitle);
      setBaseDescription(firstPodcast.description || '');
    }

    setShowMergeDialog(true);
  };

  const handleUpdateLanguage = (podcastId: string, languageCode: string) => {
    setSelectedPodcasts(selected =>
      selected.map(p =>
        p.id === podcastId ? { ...p, detected_language: languageCode } : p
      )
    );
  };

  const handleMerge = async () => {
    try {
      setMerging(true);

      // Validate all podcasts have language assigned
      const missingLanguages = selectedPodcasts.filter(p => !p.detected_language);
      if (missingLanguages.length > 0) {
        toast.error('Please assign a language to all selected podcasts');
        return;
      }

      // Check for duplicate languages
      const languageCodes = selectedPodcasts.map(p => p.detected_language!);
      const uniqueLanguages = new Set(languageCodes);
      if (languageCodes.length !== uniqueLanguages.size) {
        toast.error('Each podcast must have a unique language');
        return;
      }

      // Determine primary language (first one selected by default)
      const primaryLanguage = selectedPodcasts[0].detected_language!;

      // Create podcast group
      const result = await createPodcastGroupAction({
        base_title: baseTitle,
        base_description: baseDescription,
        base_cover_image: selectedPodcasts[0].cover_image || undefined,
        languages: selectedPodcasts.map(podcast => ({
          language_code: podcast.detected_language!,
          title: podcast.title,
          description: podcast.description || undefined,
          cover_image: podcast.cover_image || undefined,
          is_primary: podcast.detected_language === primaryLanguage,
          podcast_id: podcast.id
        }))
      });

      if (result.success) {
        toast.success('Podcast group created successfully!');
        setShowMergeDialog(false);
        setSelectedPodcasts([]);
        setBaseTitle('');
        setBaseDescription('');
        loadPodcasts(); // Reload to remove merged podcasts from list
      } else {
        toast.error(result.error || 'Failed to create podcast group');
      }
    } catch (error) {
      console.error('Failed to merge podcasts:', error);
      toast.error('Failed to merge podcasts');
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Podcasts to Merge</CardTitle>
          <CardDescription>
            Search for podcasts that are language variants of the same show.
            Select at least 2 podcasts to create a multilingual podcast group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search podcasts by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Podcasts Summary */}
          {selectedPodcasts.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
              <Badge variant="default">{selectedPodcasts.length} selected</Badge>
              <span className="text-sm text-muted-foreground flex-1">
                {selectedPodcasts.map(p => p.title).join(', ')}
              </span>
              <Button onClick={handleOpenMergeDialog} size="sm">
                Merge into Group
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Podcasts Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPodcasts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {searchQuery
                        ? 'No podcasts found matching your search'
                        : 'No eligible podcasts available for migration'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPodcasts.map((podcast) => {
                    const isSelected = selectedPodcasts.some(p => p.id === podcast.id);
                    return (
                      <TableRow
                        key={podcast.id}
                        className={isSelected ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectPodcast(podcast)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{podcast.title}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {podcast.description || 'No description'}
                        </TableCell>
                        <TableCell>
                          {podcast.created_at
                            ? formatUserDate(podcast.created_at, DATE_FORMATS.DISPLAY_DATE)
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Merge Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Multilingual Podcast Group</DialogTitle>
            <DialogDescription>
              Configure the base information and assign languages to each podcast variant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Base Information */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Base Title</label>
                <Input
                  value={baseTitle}
                  onChange={(e) => setBaseTitle(e.target.value)}
                  placeholder="Enter the language-neutral podcast title"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be the primary identifier for the podcast group
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Base Description (Optional)</label>
                <Input
                  value={baseDescription}
                  onChange={(e) => setBaseDescription(e.target.value)}
                  placeholder="Enter a language-neutral description"
                />
              </div>
            </div>

            {/* Language Assignment */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Assign Languages</h4>
              <div className="space-y-3">
                {selectedPodcasts.map((podcast, index) => (
                  <div
                    key={podcast.id}
                    className="flex items-center gap-3 p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{podcast.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-md">
                        {podcast.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={podcast.detected_language || ''}
                        onValueChange={(value) => handleUpdateLanguage(podcast.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select language">
                            {podcast.detected_language && (
                              <div className="flex items-center gap-2">
                                <span>{getLanguageFlag(podcast.detected_language)}</span>
                                <span>{getLanguageName(podcast.detected_language)}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {getSupportedLanguageCodes().map((code) => (
                            <SelectItem key={code} value={code}>
                              <div className="flex items-center gap-2">
                                <span>{getLanguageFlag(code)}</span>
                                <span>{getLanguageName(code)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                The first podcast will be set as the primary language variant
              </p>
            </div>

            {/* Preview */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Preview</h4>
              <div className="bg-muted/30 p-4 rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">{baseTitle || 'Untitled Group'}</span>
                  <Badge variant="default" className="text-xs">
                    {selectedPodcasts.length} Languages
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPodcasts.map(podcast => (
                    podcast.detected_language && (
                      <Badge key={podcast.id} variant="outline">
                        {getLanguageFlag(podcast.detected_language)}{' '}
                        {getLanguageName(podcast.detected_language)}
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMergeDialog(false)}
              disabled={merging}
            >
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={merging || !baseTitle}>
              {merging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Group...
                </>
              ) : (
                'Create Podcast Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
