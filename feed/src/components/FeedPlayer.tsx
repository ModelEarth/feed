import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, CardMedia, Typography, CircularProgress, Chip, Box } from '@mui/material';
import axios from 'axios';

interface FeedPlayerProps {
  feedUrls: string; // Pipe-separated URLs
  feedType?: string; // Type of feed (nasa, seeclickfix, bsky, etc.)
  feedFields?: string[]; // Fields to display from the feed
}

interface FeedItem {
  title?: string;
  description?: string;
  url?: string;
  date?: string;
  explanation?: string;
  media_type?: string;
  source?: string;
  [key: string]: any; // Allow for dynamic fields
}

function detectFeedType(url: string): string {
  if (url.includes('api.nasa.gov')) return 'nasa';
  if (url.includes('seeclickfix.com')) return 'seeclickfix';
  if (url.includes('bsky.app')) return 'bsky';
  if (url.includes('docs.google.com/spreadsheets')) return 'googlesheet';
  return 'default';
}

function buildFeedMap(feedUrls: string) {
  return feedUrls.split('|').reduce((acc, entry) => {
    const [key, url] = entry.split('=');
    if (key && url) acc[key.trim()] = url.trim();
    return acc;
  }, {} as Record<string, string>);
}

function getFeedFromHash(feedMap: Record<string, string>) {
  if (window.location.hash && window.location.hash.includes('feed=')) {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const feedParam = params.get('feed');
    if (feedParam && feedMap[feedParam]) {
      return feedParam;
    }
  }
  return null;
}

function setFeedHash(feedKey: string) {
  window.location.hash = `feed=${encodeURIComponent(feedKey)}`;
}

const FeedPlayer: React.FC<FeedPlayerProps> = ({ feedUrls, feedType = 'default', feedFields = [] }) => {
  const feedMap = buildFeedMap(feedUrls);
  const feedKeys = Object.keys(feedMap);
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFeed, setActiveFeed] = useState<string | null>(null);

  useEffect(() => {
    if (feedKeys.length === 0) return;
    const feedFromHash = getFeedFromHash(feedMap);
    if (feedFromHash) {
      setActiveFeed(feedFromHash);
    } else {
      const defaultFeed = feedKeys[0];
      setActiveFeed(defaultFeed);
      setFeedHash(defaultFeed);
    }
  }, [feedUrls]);

  useEffect(() => {
    const onHashChange = () => {
      const feedFromHash = getFeedFromHash(feedMap);
      if (feedFromHash) {
        setActiveFeed(feedFromHash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [feedMap]);

  const handleFeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFeedKey = e.target.value;
    setFeedHash(newFeedKey);
  };

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        if (!activeFeed) return;
        const selectedUrl = feedMap[activeFeed];
        if (!selectedUrl) throw new Error('No matching feed found for activeFeed');
        const type = detectFeedType(selectedUrl);
        let url = selectedUrl;
        if (type === 'googlesheet') {
          if (!url.includes('/gviz/tq?')) {
            const matches = url.match(/\/d\/(.*?)(\/|$)/);
            if (matches && matches[1]) {
              url = `https://docs.google.com/spreadsheets/d/${matches[1]}/gviz/tq?tqx=out:csv`;
            }
          }
        }
        const response = await axios.get(url);
        let data = response.data;
        let items: FeedItem[] = [];
        switch (type) {
          case 'nasa':
            data = Array.isArray(data) ? data : [data];
            items = data.map((item: any) => ({ ...item, source: 'NASA APOD' }));
            break;
          case 'seeclickfix':
            const issues = response.data.issues || response.data;
            items = Array.isArray(issues) ? issues.map((item: any) => ({ ...item, source: 'SeeClickFix' })) : [];
            break;
          case 'bsky':
            const itemsArr = response.data.items || response.data;
            items = Array.isArray(itemsArr) ? itemsArr.map((item: any) => ({ ...item, source: 'BlueSky' })) : [];
            break;
          case 'googlesheet':
            const rows = data.split('\n').map((row: string) => row.split(','));
            const headers = rows[0];
            items = rows.slice(1).map((row: string[]) => {
              const item: Record<string, any> = {};
              headers.forEach((header: string, index: number) => {
                item[header.trim()] = row[index]?.trim() || '';
              });
              return { ...item, source: 'GoogleSheet' };
            });
            break;
          default:
            items = Array.isArray(data) ? data : [data];
        }
        if (items.length === 0) throw new Error('No feed data available');
        setFeeds(items);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch feed data');
        setLoading(false);
      }
    };
    if (activeFeed) {
      fetchFeeds();
    }
  }, [feedUrls, activeFeed]);

  if (loading) {
    return (
      <Grid container justifyContent="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ mt: 4 }}>
        {error}
      </Typography>
    );
  }

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <select value={activeFeed || ''} onChange={handleFeedChange} style={{ fontSize: '1rem', padding: '0.5rem' }}>
          {feedKeys.map(key => (
            <option key={key} value={key}>
              {key.toUpperCase()} Feed
            </option>
          ))}
        </select>
      </Box>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {feeds.map((item, index) => (
          <Box key={index} sx={{ width: { xs: '100%', md: '50%' }, p: 1.5 }}>
            <Card>
              {item.media_type === 'image' && item.url && (
                <CardMedia
                  component="img"
                  height="300"
                  image={item.url}
                  alt={item.title || 'Feed image'}
                  sx={{ objectFit: 'contain' }}
                />
              )}
              {item.media_type === 'video' && item.url && (
                <iframe
                  width="100%"
                  height="300"
                  src={item.url}
                  title={item.title || 'Feed video'}
                  frameBorder="0"
                  allowFullScreen
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  {item.title && (
                    <Typography gutterBottom variant="h6" component="div">
                      {item.title}
                    </Typography>
                  )}
                  {item.source && (
                    <Chip 
                      label={item.source} 
                      size="small" 
                      color={
                        item.source === 'NASA APOD' ? 'primary' : 
                        item.source === 'SeeClickFix' ? 'secondary' : 
                        'default'
                      }
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
                {item.description && (
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                )}
                {item.date && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Date: {item.date}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Grid>
    </>
  );
};

export default FeedPlayer; 