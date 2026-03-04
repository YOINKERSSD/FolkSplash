import React from 'react';
import { Box, Typography } from '@mui/material';
import type { SplashImage } from '../lib/types';
import { ImageCard } from './ImageCard';
import { useTranslation } from 'react-i18next';

interface ImageGalleryProps {
  images: SplashImage[];
  onReplace: (index: number, file: File, resolutionMode: 'original' | 'follow' | 'custom' | 'direct', customWidth?: number, customHeight?: number) => void;
  disabled?: boolean;
  replacingIndex?: number | null;
  replaceProgress?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onReplace,
  disabled = false,
  replacingIndex = null,
  replaceProgress = 0,
}) => {
  const { t } = useTranslation();
  if (images.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {t('gallery.imageList')} ({images.length} {t('gallery.images')})
      </Typography>
      <Box
        sx={{
          columnCount: { xs: 2, sm: 3, md: 4, lg: 5 },
          columnGap: { xs: 1, sm: 1.5, md: 2 },
        }}
      >
        {images.map((image) => (
          <Box
            key={image.index}
            sx={{
              breakInside: 'avoid',
              mb: { xs: 1, sm: 1.5, md: 2 },
            }}
          >
            <ImageCard
              image={image}
              onReplace={onReplace}
              disabled={disabled}
              replacing={replacingIndex === image.index}
              replaceProgress={replacingIndex === image.index ? replaceProgress : 0}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
