import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Link,
  useTheme,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useTranslation } from 'react-i18next';

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <CodeIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {t('about.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {t('about.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom>
          {t('about.author')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Avatar
            sx={{ width: 48, height: 48 }}
            src="https://q.qlogo.cn/headimg_dl?dst_uin=3231515355&spec=640&img_type=jpg"
          >
            <CodeIcon />
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight="medium">
              Mstzuzaka Yuki
            </Typography>
            <Link
              href="https://github.com/matsuzaka-yuki/FolkSplash"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <GitHubIcon fontSize="small" />
              {t('about.githubPage')}
            </Link>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom>
          {t('about.features')}
        </Typography>
        <Box sx={{ mt: 2 }}>
          {[
            t('about.feature1'),
            t('about.feature2'),
            t('about.feature3'),
            t('about.feature4'),
            t('about.feature5'),
            t('about.feature6'),
          ].map((feature, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
                borderBottom: index < 5 ? `1px solid ${theme.palette.divider}` : 'none',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                }}
              />
              <Typography variant="body2">{feature}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
