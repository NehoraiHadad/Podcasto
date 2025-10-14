import { imageToasts } from '@/components/admin/shared/image-management';
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
      imageToasts.savePodcastFirst();
      return;
    }

    setIsLoadingGallery(true);
    try {
      const result = await listPodcastImagesGallery(podcastId);

      if (result.success && result.images) {
        setGalleryImages(result.images);
        setShowGallery(true);

        if (result.images.length === 0) {
          imageToasts.galleryEmpty();
        } else {
          imageToasts.galleryLoadSuccess(result.images.length);
        }
      } else {
        imageToasts.loadGalleryError(result.error);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      imageToasts.loadGalleryError();
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleSelectFromGallery = (image: GalleryImage) => {
    onImageGenerated?.(image.url);
    setShowGallery(false);
    imageToasts.imageSelectedFromGallery();
  };

  const handleDeleteGalleryImage = async (image: GalleryImage) => {
    try {
      const result = await deleteGalleryImage(image.key);

      if (result.success) {
        setGalleryImages(prev => prev.filter(img => img.key !== image.key));
        imageToasts.deleteSuccess();
      } else {
        imageToasts.deleteGalleryImageError(result.error);
      }
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      imageToasts.deleteGalleryImageError();
    }
  };

  return {
    handleLoadGallery,
    handleSelectFromGallery,
    handleDeleteGalleryImage
  };
}
