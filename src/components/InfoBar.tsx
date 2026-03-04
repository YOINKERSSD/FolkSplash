import React from 'react';
import { Box, Chip, Stack, useTheme } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import { useTranslation } from 'react-i18next';

interface InfoBarProps {
  width: number;
  height: number;
  imageCount: number;
}

export const InfoBar: React.FC<InfoBarProps> = ({ width, height, imageCount }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      sx={{
        mt: 3,
        mb: 3,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        bgcolor: theme.palette.action.hover,
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={{ xs: 1, sm: 2 }} 
        justifyContent="center" 
        alignItems="center"
      >
        <Chip
          icon={<AspectRatioIcon />}
          label={`${t('infoBar.resolution')}：${width} × ${height}`}
          color="primary"
          variant="outlined"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        />
        <Chip
          icon={<ImageIcon />}
          label={`${t('infoBar.imageCount')}：${imageCount}`}
          color="primary"
          variant="outlined"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        />
      </Stack>
    </Box>
  );
};
