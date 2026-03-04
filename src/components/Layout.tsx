import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Avatar,
  Link,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
}

const drawerWidth = 280;

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
        transitions: {
          duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
          },
          easing: {
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
          },
        },
      }),
    [mode],
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  const menuItems = [
    { text: t('layout.home'), icon: <HomeIcon />, page: 'home' },
    { text: t('layout.about'), icon: <PersonIcon />, page: 'about' },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {t('layout.title')}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {t('layout.subtitle')}
        </Typography>
      </Box>
      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                onNavigate(item.page);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src="https://q.qlogo.cn/headimg_dl?dst_uin=3231515355&spec=640&img_type=jpg"
            sx={{ width: 40, height: 40 }}
          >
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {t('layout.author')}
            </Typography>
            <Link
              href="https://github.com/matsuzaka-yuki/FolkSplash"
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <GitHubIcon fontSize="inherit" />
              {t('layout.github')}
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            bgcolor: 'primary.main',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="h1" fontWeight="600" sx={{ flexGrow: 1 }}>
              {t('layout.title')}
            </Typography>
            <Tooltip title={i18n.language === 'en' ? 'English' : '中文'}>
              <IconButton
                sx={{ ml: 1 }}
                onClick={handleLanguageToggle}
                color="inherit"
              >
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton
                sx={{ ml: 1 }}
                onClick={handleToggleColorMode}
                color="inherit"
              >
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
    </ThemeProvider>
  );
};
