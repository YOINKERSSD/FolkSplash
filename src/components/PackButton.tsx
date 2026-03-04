import React from 'react';
import { Button, Box, CircularProgress, LinearProgress, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';

interface PackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  progress?: number;
  imageCount?: number;
}

export const PackButton: React.FC<PackButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  progress = 0,
  imageCount = 0,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
      <Button
        variant="contained"
        size="large"
        onClick={onClick}
        disabled={disabled || loading || imageCount === 0}
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <DownloadIcon />
          )
        }
        sx={{
          px: { xs: 3, sm: 4 },
          py: 1.5,
          fontSize: { xs: '0.95rem', sm: '1.1rem' },
          minWidth: { xs: '160px', sm: '200px' },
        }}
      >
        {loading ? t('pack.packing') : t('pack.packAndDownload')}
      </Button>
      {loading && (
        <Box sx={{ mt: 2, maxWidth: 600, mx: 'auto', px: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'secondary.main',
              }
            }}
          />
          <Typography variant="caption" color="inherit" sx={{ mt: 0.5, display: 'block' }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};
