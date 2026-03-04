import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  CircularProgress,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import type { SplashImage } from '../lib/types';
import { useTranslation } from 'react-i18next';

interface ImageCardProps {
  image: SplashImage;
  onReplace: (index: number, file: File, resolutionMode: 'original' | 'follow' | 'custom' | 'direct', customWidth?: number, customHeight?: number) => void;
  disabled?: boolean;
  replacing?: boolean;
  replaceProgress?: number;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onReplace,
  disabled = false,
  replacing = false,
  replaceProgress = 0,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [resolutionMode, setResolutionMode] = useState<'original' | 'follow' | 'custom' | 'direct'>('follow');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');

  const handleReplaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResolutionMode('follow');
    setCustomWidth('');
    setCustomHeight('');
    setReplaceDialogOpen(true);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const width = resolutionMode === 'custom' ? parseInt(customWidth, 10) : undefined;
      const height = resolutionMode === 'custom' ? parseInt(customHeight, 10) : undefined;
      // 先关闭对话框，再处理文件
      setReplaceDialogOpen(false);
      // 重置 input 值，允许重复选择同一文件
      e.target.value = '';
      // 使用 setTimeout 让对话框关闭动画完成
      setTimeout(() => {
        onReplace(image.index, file, resolutionMode, width, height);
      }, 10);
    }
  };

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          overflow: 'visible',
          borderRadius: 2,
          boxShadow: theme.shadows[2],
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: theme.shadows[6],
            transform: 'translateY(-2px)',
          },
          '&:hover .replace-button': {
            opacity: 1,
          },
          width: '100%',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: `${(image.height / image.width) * 100}%`,
            bgcolor: theme.palette.action.hover,
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          onClick={handlePreviewClick}
        >
          {replacing && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                zIndex: 10,
              }}
            >
              <CircularProgress size={40} color="secondary" />
              <Typography variant="caption" sx={{ mt: 2, color: 'white' }}>
                {t('card.processing')} {Math.round(replaceProgress)}%
              </Typography>
            </Box>
          )}
          <CardMedia
            component="img"
            image={image.previewUrl}
            alt={image.name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              bgcolor: '#f5f5f5',
            }}
          />
          <IconButton
            className="replace-button"
            size="small"
            onClick={handleReplaceClick}
            disabled={disabled || replacing}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: 0,
              transition: 'opacity 0.2s',
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'background.paper',
              },
              '&.Mui-disabled': {
                opacity: 0,
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
        <CardContent sx={{ p: 1.5 }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            noWrap
            sx={{ fontSize: '0.8rem', mb: 1 }}
          >
            {image.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={`${image.width}×${image.height}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
            <Chip
              label={`#${image.index}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{image.name}</Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', bgcolor: '#f5f5f5' }}>
          <img
            src={image.previewUrl}
            alt={image.name}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>{t('card.close')}</Button>
          {!disabled && (
            <Button
              variant="contained"
              onClick={() => {
                setPreviewOpen(false);
                setReplaceDialogOpen(true);
              }}
              startIcon={<EditIcon />}
            >
              {t('card.replace')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={replaceDialogOpen} onClose={() => setReplaceDialogOpen(false)}>
        <DialogTitle>{t('card.replace')}</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('card.selectNew')}
          </Typography>

          <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
            <FormLabel component="legend">{t('card.resolutionSettings')}</FormLabel>
            <RadioGroup
              value={resolutionMode}
              onChange={(e) => setResolutionMode(e.target.value as 'original' | 'follow' | 'custom' | 'direct')}
            >
              <FormControlLabel
                value="follow"
                control={<Radio />}
                label={`${t('card.followOriginal')}（${t('card.autoAdapt')}，${t('card.max')} ${image.width}×${image.height}）`}
              />
              <FormControlLabel
                value="original"
                control={<Radio />}
                label={`${t('card.noConversion')}（${t('card.forceOriginal')}，${t('card.max')} ${image.width}×${image.height}）`}
              />
              <FormControlLabel
                value="custom"
                control={<Radio />}
                label={`${t('card.custom')}（${t('card.width')} × ${t('card.height')}）`}
              />
              <FormControlLabel
                value="direct"
                control={<Radio />}
                label={`${t('card.directUpload')} - ${t('card.directUploadDesc')}`}
              />
            </RadioGroup>
          </FormControl>

          {resolutionMode === 'custom' && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label={t('card.width')}
                type="number"
                size="small"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ flex: 1 }}
              />
              <TextField
                label={t('card.height')}
                type="number"
                size="small"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ flex: 1 }}
              />
            </Box>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'block', margin: '0 auto' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplaceDialogOpen(false)}>{t('card.cancel')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
