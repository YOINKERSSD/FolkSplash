import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper, alpha, useTheme } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTranslation } from 'react-i18next';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled = false }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.img')) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <Paper
      elevation={0}
      sx={{
        border: 2,
        borderColor: isDragOver
          ? theme.palette.primary.main
          : alpha(theme.palette.text.primary, 0.12),
        borderRadius: 3,
        p: { xs: 3, sm: 4, md: 6 },
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        bgcolor: isDragOver
          ? alpha(theme.palette.primary.main, 0.04)
          : 'transparent',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: disabled ? alpha(theme.palette.text.primary, 0.12) : theme.palette.primary.main,
          bgcolor: disabled ? 'transparent' : alpha(theme.palette.primary.main, 0.02),
        },
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".img"
        onChange={handleFileInput}
        style={{ display: 'none' }}
        id="file-upload"
        disabled={disabled}
      />
      <label htmlFor="file-upload" style={{ cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', display: 'block' }}>
        {selectedFile ? (
          <Box>
            <InsertDriveFileIcon sx={{ fontSize: { xs: 48, sm: 56, md: 64 }, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" color="text.primary" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              {selectedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
        ) : (
          <Box>
            <CloudUploadIcon sx={{ fontSize: { xs: 48, sm: 56, md: 64 }, color: theme.palette.text.secondary, mb: 2 }} />
            <Typography variant="h6" color="text.primary" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              {t('upload.dragDrop')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('upload.support')}
            </Typography>
          </Box>
        )}
      </label>
    </Paper>
  );
};
