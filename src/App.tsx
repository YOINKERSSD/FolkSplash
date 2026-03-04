import { useState } from 'react';
import { Box, Alert, LinearProgress } from '@mui/material';
import { useSplashStore } from './store/useSplashStore';
import { FileUpload } from './components/FileUpload';
import { ImageGallery } from './components/ImageGallery';
import { PackButton } from './components/PackButton';
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
    loadSplash,
    replaceImage,
    packAndDownload,
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

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
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

          <PackButton
            onClick={handlePack}
            disabled={isLoading}
            loading={isLoading}
            progress={progress}
            imageCount={splashData.images.length}
          />
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
