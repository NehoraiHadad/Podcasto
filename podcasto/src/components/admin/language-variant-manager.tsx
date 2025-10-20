'use client';

import { useState } from 'react';
import { Trash2, Edit, Star, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PodcastLanguageWithPodcast } from '@/lib/db/api/podcast-groups/types';
import { LanguageBadge } from './language-badge';
import {
  removeLanguageVariantAction,
  setPrimaryLanguageAction,
} from '@/lib/actions/podcast-group-actions';

/**
 * Props for LanguageVariantManager component
 */
export interface LanguageVariantManagerProps {
  /** Podcast group ID */
  podcastGroupId: string;
  /** Array of language variants with podcast data */
  languages: PodcastLanguageWithPodcast[];
  /** Callback when variants are updated (for parent to refresh data) */
  onUpdate: () => void | Promise<void>;
}

/**
 * Language Variant Manager Component
 *
 * Manages language variants for a podcast group. Displays existing variants
 * and provides actions to edit, delete, or set as primary.
 *
 * @example
 * ```tsx
 * <LanguageVariantManager
 *   podcastGroupId={groupId}
 *   languages={group.languages}
 *   onUpdate={() => refetch()}
 * />
 * ```
 */
export function LanguageVariantManager({
  podcastGroupId,
  languages,
  onUpdate,
}: LanguageVariantManagerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingPrimary, setIsSettingPrimary] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!selectedLanguageId) return;

    setIsDeleting(true);
    const result = await removeLanguageVariantAction(selectedLanguageId, podcastGroupId);

    if (result.success) {
      toast.success('Language variant removed successfully');
      setDeleteDialogOpen(false);
      setSelectedLanguageId(null);
      await onUpdate();
    } else {
      toast.error(result.error || 'Failed to remove language variant');
    }
    setIsDeleting(false);
  };

  const handleSetPrimary = async (languageCode: string) => {
    setIsSettingPrimary(languageCode);
    const result = await setPrimaryLanguageAction(podcastGroupId, languageCode);

    if (result.success) {
      toast.success('Primary language updated');
      await onUpdate();
    } else {
      toast.error(result.error || 'Failed to set primary language');
    }
    setIsSettingPrimary(null);
  };

  const openDeleteDialog = (languageId: string) => {
    setSelectedLanguageId(languageId);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Language Variants</CardTitle>
          <CardDescription>
            Manage language versions of this podcast group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {languages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No language variants added yet
            </p>
          ) : (
            <div className="space-y-3">
              {languages.map((language) => (
                <div
                  key={language.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <LanguageBadge
                      languageCode={language.language_code}
                      isPrimary={language.is_primary}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{language.title}</p>
                      {language.podcast && (
                        <p className="text-sm text-muted-foreground truncate">
                          Podcast: {language.podcast.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!language.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(language.language_code)}
                        disabled={isSettingPrimary === language.language_code}
                        aria-label="Set as primary language"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Edit language variant"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(language.id)}
                      aria-label="Delete language variant"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" className="w-full" aria-label="Add new language variant">
            <Plus className="h-4 w-4 mr-2" />
            Add Language
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Language Variant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this language variant? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
