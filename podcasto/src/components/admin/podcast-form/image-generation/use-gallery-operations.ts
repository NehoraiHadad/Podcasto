import { toast } from 'sonner';
import { listPodcastImagesGallery, deleteGalleryImage } from '@/lib/actions/podcast';
import type { GalleryImage } from './types';

export function useGalleryOperations(
  podcastId: string | undefined,
  setGalleryImages: (images: GalleryImage[] | ((prev: GalleryImage[]) => GalleryImage[])) => void,
  setShowGallery: (show: boolean) => void,
  setIsLoadingGallery: (loading: boolean) => void,
  onImageGenerated?: (imageUrl: string) => void
) {
  const handleLoadGallery = async () => {
    if (!podcastId) {
      toast.error('Please save the podcast first');
      return;
    }

    setIsLoadingGallery(true);
    try {
      const result = await listPodcastImagesGallery(podcastId);

      if (result.success && result.images) {
        setGalleryImages(result.images);
        setShowGallery(true);

        if (result.images.length === 0) {
          toast.info('No images found in gallery. Generate some images first!');
        } else {
          toast.success(`Found ${result.images.length} images in gallery`);
        }
      } else {
        toast.error(result.error || 'Failed to load gallery');
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast.error('Failed to load gallery');
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleSelectFromGallery = (image: GalleryImage) => {
    onImageGenerated?.(image.url);
    setShowGallery(false);
    toast.success('Image selected from gallery!');
  };

  const handleDeleteGalleryImage = async (image: GalleryImage) => {
    try {
      const result = await deleteGalleryImage(image.key);

      if (result.success) {
        setGalleryImages(prev => prev.filter(img => img.key !== image.key));
        toast.success('Image deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      toast.error('Failed to delete image');
    }
  };

  return {
    handleLoadGallery,
    handleSelectFromGallery,
    handleDeleteGalleryImage
  };
}
