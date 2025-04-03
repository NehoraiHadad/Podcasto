'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PodcastFormMode } from './types';

interface FormActionButtonsProps {
  mode: PodcastFormMode;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export function FormActionButtons({ mode, isSubmitting, onCancel }: FormActionButtonsProps) {
  const router = useRouter();
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };
  
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 space-y-4 space-y-reverse sm:space-y-0 mt-6">
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleCancel}
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting 
          ? (mode === 'create' ? 'Creating...' : 'Saving...') 
          : (mode === 'create' ? 'Create Podcast' : 'Save Changes')
        }
      </Button>
    </div>
  );
} 