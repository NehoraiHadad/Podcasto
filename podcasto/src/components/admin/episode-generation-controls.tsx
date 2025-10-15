'use client';

import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { generateEpisodeTitleAndDescription } from '@/lib/actions/episode/generation-actions';

interface EpisodeGenerationControlsProps {
  episodeId: string;
  currentTitle: string;
  currentDescription: string;
  onTitleGenerated: (title: string) => void;
  onDescriptionGenerated: (description: string) => void;
}

export function EpisodeGenerationControls({
  episodeId,
  currentTitle,
  currentDescription,
  onTitleGenerated,
  onDescriptionGenerated,
}: EpisodeGenerationControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [generationType, setGenerationType] = useState<'both' | 'title' | 'description'>('both');

  const handleGenerate = async (type: 'both' | 'title' | 'description') => {
    // Check if we're about to overwrite existing content
    const hasTitle = currentTitle.trim().length > 0;
    const hasDescription = currentDescription.trim().length > 0;
    
    const willOverwrite = 
      (type === 'both' && (hasTitle || hasDescription)) ||
      (type === 'title' && hasTitle) ||
      (type === 'description' && hasDescription);

    if (willOverwrite) {
      setGenerationType(type);
      setShowConfirmDialog(true);
      return;
    }

    await performGeneration(type);
  };

  const performGeneration = async (type: 'both' | 'title' | 'description') => {
    try {
      setIsGenerating(true);
      
      const result = await generateEpisodeTitleAndDescription(episodeId);
      
      if (result.success && result.title && result.description) {
        if (type === 'both' || type === 'title') {
          onTitleGenerated(result.title);
        }
        if (type === 'both' || type === 'description') {
          onDescriptionGenerated(result.description);
        }
        
        const message = type === 'both' 
          ? 'Title and description generated successfully'
          : type === 'title'
          ? 'Title generated successfully'
          : 'Description generated successfully';
          
        toast.success(message);
      } else {
        toast.error(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
      setShowConfirmDialog(false);
    }
  };

  const getConfirmMessage = () => {
    switch (generationType) {
      case 'both':
        return 'This will replace both the current title and description with AI-generated content.';
      case 'title':
        return 'This will replace the current title with AI-generated content.';
      case 'description':
        return 'This will replace the current description with AI-generated content.';
      default:
        return 'This will replace the current content with AI-generated content.';
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleGenerate('both')}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Generate Both
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleGenerate('title')}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Generate Title
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleGenerate('description')}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Generate Description
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Content Generation</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmMessage()} Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => performGeneration(generationType)}>
              Generate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 