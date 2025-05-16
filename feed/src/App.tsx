import React from 'react';
import { ThemeProvider, createTheme, Container, Typography, Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import FeedPlayer from './components/FeedPlayer';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0B3D91', // NASA blue
    },
    secondary: {
      main: '#FC3D21', // NASA red
    },
  },
});

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Example URLs from the Feed Player Sheet
const nasaFeedUrl = `https://api.nasa.gov/planetary/apod?api_key=frAegZk3UR4WxM1Ltc0FyGgEfGMkd8kXr5jEWGOG&start_date=2024-01-01&end_date=${today}`;
const seeclickfixUrl = 'https://seeclickfix.com/api/v2/issues?status=open&per_page=5';
const bskyUrl = 'https://bsky.app/profile/did:plc:ileopdnhib52emw3veem5zxk/rss';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Multi-Feed Demo
          </Typography>

          {/* NASA APOD Feed */}
          <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
            NASA Astronomy Picture of the Day
          </Typography>
          <FeedPlayer 
            feedUrls={`nasa=${nasaFeedUrl}`}
            feedType="nasa"
            feedFields={['title', 'date', 'explanation', 'url', 'hdurl', 'media_type']}
          />

          {/* Multi-Feed Example */}
          <Typography variant="h4" gutterBottom sx={{ mt: 6 }}>
            Combined Feeds Demo
          </Typography>
          <FeedPlayer 
            feedUrls={`nasa=${nasaFeedUrl}|seeclickfix=${seeclickfixUrl}|bsky=${bskyUrl}`}
            feedType="mixed"
            feedFields={['title', 'date', 'explanation', 'url', 'summary', 'description', 'content', 'media_type']}
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
