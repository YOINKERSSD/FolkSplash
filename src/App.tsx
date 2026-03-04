import { useState } from 'react';
import { Box, Alert, LinearProgress } from '@mui/material';
import { useSplashStore } from './store/useSplashStore';
import { FileUpload } from './components/FileUpload';
import { ImageGallery } from './components/ImageGallery';
import { PackButton } from './components/PackButton';
import { PackImageButton } from './components/PackImageButton';
import { Layout } from './components/Layout';
import { AboutPage } from './components/AboutPage';

function HomePage() {
  const {
    splashData,
    isLoading,
    error,
    progress,
    replacingIndex,
    replaceProgress,
    isPackingImages,
    packImagesProgress,
    loadSplash,
    replaceImage,
    packAndDownload,
    packImagesAndDownload,
    reset,
  } = useSplashStore();

  const handleFileSelect = (file: File) => {
    loadSplash(file);
  };

  const handleReplace = async (index: number, file: File, resolutionMode: 'original' | 'follow' | 'custom' | 'direct', customWidth?: number, customHeight?: number) => {
    try {
      await replaceImage(index, file, resolutionMode, customWidth, customHeight);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePack = async () => {
    try {
      await packAndDownload();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePackImages = async () => {
    try {
      await packImagesAndDownload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={reset}>
          {error}
        </Alert>
      )}

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      {!splashData ? (
        <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
      ) : (
        <>
          <FileUpload
            onFileSelect={handleFileSelect}
            disabled={isLoading}
          />

          <ImageGallery
            images={splashData.images}
            onReplace={handleReplace}
            disabled={isLoading}
            replacingIndex={replacingIndex}
            replaceProgress={replaceProgress}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <PackImageButton
              onClick={handlePackImages}
              disabled={isLoading || isPackingImages}
              loading={isPackingImages}
              progress={packImagesProgress}
              imageCount={splashData.images.length}
            />
            <PackButton
              onClick={handlePack}
              disabled={isLoading || isPackingImages}
              loading={isLoading}
              progress={progress}
              imageCount={splashData.images.length}
            />
          </Box>
        </>
      )}
    </Box>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <Layout onNavigate={setCurrentPage}>
      {currentPage === 'home' ? <HomePage /> : <AboutPage />}
    </Layout>
  );
}

export default App;
