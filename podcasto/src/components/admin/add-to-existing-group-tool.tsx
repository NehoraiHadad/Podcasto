'use client';

import { useState, useEffect } from 'react';
import { addLanguageVariantAction } from '@/lib/actions/podcast-group-actions';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Search, Plus } from 'lucide-react';
import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at?: Date | null;
}

interface PodcastGroup {
  id: string;
  base_title: string;
  languages: Array<{
    language_code: string;
    title: string;
    is_primary: boolean;
  }>;
  language_count: number;
}

/**
 * Add to Existing Group Tool
 *
 * Allows admins to add legacy podcasts to existing podcast groups
 */
export function AddToExistingGroupTool() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [groups, setGroups] = useState<PodcastGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected state
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load podcasts eligible for migration
      const podcastsResponse = await fetch('/api/podcasts?eligible_for_migration=true');
      if (!podcastsResponse.ok) throw new Error('Failed to fetch podcasts');
      const podcastsData = await podcastsResponse.json();
      setPodcasts(podcastsData);

      // Load podcast groups
      const groupsResponse = await fetch('/api/podcast-groups');
      if (!groupsResponse.ok) throw new Error('Failed to fetch podcast groups');
      const groupsData = await groupsResponse.json();
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPodcasts = podcasts.filter(podcast =>
    podcast.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedGroupData = groups.find(g => g.id === selectedGroup);
  const usedLanguages = selectedGroupData?.languages.map(l => l.language_code) || [];
  const availableLanguages = getSupportedLanguageCodes().filter(
    code => !usedLanguages.includes(code)
  );

  const handleAdd = async () => {
    if (!selectedPodcast || !selectedGroup || !selectedLanguage) {
      toast.error('Please select a podcast, group, and language');
      return;
    }

    try {
      setAdding(true);

      const result = await addLanguageVariantAction({
        podcast_group_id: selectedGroup,
        language_code: selectedLanguage,
        title: selectedPodcast.title,
        description: selectedPodcast.description || undefined,
        cover_image: selectedPodcast.cover_image || undefined,
        is_primary: isPrimary,
        podcast_id: selectedPodcast.id,
      });

      if (result.success) {
        toast.success(`Successfully added ${selectedPodcast.title} to group!`);

        // Reset selections
        setSelectedPodcast(null);
        setSelectedGroup('');
        setSelectedLanguage('');
        setIsPrimary(false);

        // Reload data
        await loadData();
      } else {
        toast.error(result.error || 'Failed to add podcast to group');
      }
    } catch (error) {
      console.error('Failed to add podcast to group:', error);
      toast.error('Failed to add podcast to group');
    } finally {
      setAdding(false);
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
      {/* Selection Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Add Podcast to Existing Group</CardTitle>
          <CardDescription>
            Select a legacy podcast and add it as a language variant to an existing podcast group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Group Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">1. Select Podcast Group</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a podcast group...">
                  {selectedGroupData && (
                    <div className="flex items-center gap-2">
                      <span>{selectedGroupData.base_title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedGroupData.language_count} {selectedGroupData.language_count === 1 ? 'language' : 'languages'}
                      </Badge>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <span>{group.base_title}</span>
                      <span className="text-xs text-muted-foreground">
                        ({group.languages.map(l => l.language_code).join(', ')})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGroupData && (
              <p className="text-xs text-muted-foreground mt-1">
                Existing languages: {selectedGroupData.languages.map(l => `${getLanguageFlag(l.language_code)} ${getLanguageName(l.language_code)}`).join(', ')}
              </p>
            )}
          </div>

          {/* Language Selection */}
          {selectedGroup && (
            <div>
              <label className="text-sm font-medium mb-2 block">2. Select Language for New Variant</label>
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={availableLanguages.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a language...">
                    {selectedLanguage && (
                      <div className="flex items-center gap-2">
                        <span>{getLanguageFlag(selectedLanguage)}</span>
                        <span>{getLanguageName(selectedLanguage)}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((code) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-2">
                        <span>{getLanguageFlag(code)}</span>
                        <span>{getLanguageName(code)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableLanguages.length === 0 && (
                <p className="text-xs text-destructive mt-1">
                  All supported languages are already used in this group
                </p>
              )}
            </div>
          )}

          {/* Primary Language Toggle */}
          {selectedGroup && selectedLanguage && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-primary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="is-primary" className="text-sm">
                Set as primary language for this group
              </label>
            </div>
          )}

          {/* Selected Podcast Display */}
          {selectedPodcast && (
            <div className="p-3 bg-primary/10 rounded-md border">
              <p className="text-sm font-medium mb-1">Selected Podcast:</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedPodcast.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedPodcast.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPodcast(null)}
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Add Button */}
          {selectedPodcast && selectedGroup && selectedLanguage && (
            <Button
              onClick={handleAdd}
              disabled={adding}
              className="w-full"
            >
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding to Group...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Group
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Podcast Selection Table */}
      {!selectedPodcast && selectedGroup && selectedLanguage && (
        <Card>
          <CardHeader>
            <CardTitle>3. Select Podcast</CardTitle>
            <CardDescription>
              Choose a legacy podcast to add to the selected group
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

            {/* Podcasts Table */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPodcasts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        {searchQuery
                          ? 'No podcasts found matching your search'
                          : 'No eligible podcasts available'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPodcasts.map((podcast) => (
                      <TableRow key={podcast.id}>
                        <TableCell className="font-medium">{podcast.title}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {podcast.description || 'No description'}
                        </TableCell>
                        <TableCell>
                          {podcast.created_at
                            ? formatUserDate(podcast.created_at, DATE_FORMATS.DISPLAY_DATE)
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPodcast(podcast)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
