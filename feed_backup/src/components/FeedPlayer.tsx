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

const FeedPlayer: React.FC<FeedPlayerProps> = ({ feedUrls, feedType = 'default', feedFields = [] }) => {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processFeedItem = (item: any, type: string, sourceUrl: string): FeedItem => {
    switch (type.toLowerCase()) {
      case 'nasa':
        return {
          title: item.title,
          description: item.explanation,
          url: item.url,
          date: item.date,
          media_type: item.media_type,
          source: 'NASA APOD'
        };
      
      case 'seeclickfix':
        return {
          title: item.summary || item.title,
          description: item.description,
          url: item.html_url || item.url,
          date: item.created_at || item.date,
          source: 'SeeClickFix',
          media_type: 'text'
        };

      case 'bsky':
        return {
          title: item.title,
          description: item.content || item.description,
          url: item.link || item.url,
          date: item.pubDate || item.date,
          source: 'BlueSky',
          media_type: 'text'
        };

      default:
        const processedItem: FeedItem = { source: sourceUrl };
        if (feedFields.length > 0) {
          feedFields.forEach(field => {
            processedItem[field] = item[field];
          });
        } else {
          Object.assign(processedItem, item);
        }
        return processedItem;
    }
  };

  const detectFeedType = (url: string): string => {
    if (url.includes('api.nasa.gov')) return 'nasa';
    if (url.includes('seeclickfix.com')) return 'seeclickfix';
    if (url.includes('bsky.app')) return 'bsky';
    if (url.includes('docs.google.com/spreadsheets')) return 'googlesheet';
    return 'default';
  };

  const processGoogleSheetUrl = (url: string): string => {
    // If URL is already in the correct format, return as is
    if (url.includes('/pub?') || url.includes('/gviz/tq?')) {
      return url;
    }

    // Extract sheet ID and convert to proper format
    const matches = url.match(/\/d\/(.*?)(\/|$)/);
    if (matches && matches[1]) {
      return `https://docs.google.com/spreadsheets/d/${matches[1]}/gviz/tq?tqx=out:csv`;
    }
    return url;
  };

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        // Split the URLs by pipe character and remove any whitespace
        const urls = feedUrls.split('|')
          .map(url => url.trim())
          .filter(url => url)
          .map(url => {
            const feedType = detectFeedType(url);
            return feedType === 'googlesheet' ? processGoogleSheetUrl(url) : url;
          });
        
        if (urls.length === 0) {
          throw new Error('No valid feed URLs provided');
        }

        // Fetch data from all URLs
        const feedPromises = urls.map(async (url) => {
          try {
            const response = await axios.get(url);
            let data = response.data;
            const currentFeedType = feedType === 'mixed' ? detectFeedType(url) : feedType;

            // Handle different feed types
            switch (currentFeedType.toLowerCase()) {
              case 'nasa':
                data = Array.isArray(data) ? data : [data];
                return data.map((item: Record<string, any>) => processFeedItem(item, 'nasa', url));
              
              case 'seeclickfix':
                const issues = response.data.issues || response.data;
                return Array.isArray(issues) 
                  ? issues.map((item: Record<string, any>) => processFeedItem(item, 'seeclickfix', url))
                  : [];

              case 'bsky':
                const items = response.data.items || response.data;
                return Array.isArray(items)
                  ? items.map((item: Record<string, any>) => processFeedItem(item, 'bsky', url))
                  : [];

              case 'googlesheet':
                // Convert CSV data to array of objects
                const rows = data.split('\n').map((row: string) => row.split(','));
                const headers = rows[0];
                return rows.slice(1).map((row: string[]) => {
                  const item: Record<string, any> = {};
                  headers.forEach((header: string, index: number) => {
                    item[header.trim()] = row[index]?.trim() || '';
                  });
                  return processFeedItem(item, 'googlesheet', url);
                });

              default:
                if (feedFields.length > 0) {
                  return Array.isArray(data) 
                    ? data.map(item => processFeedItem(item, 'default', url)) 
                    : [processFeedItem(data, 'default', url)];
                }
                return Array.isArray(data) ? data : [data];
            }
          } catch (err) {
            console.error(`Error fetching from ${url}:`, err);
            return []; // Return empty array for failed feed instead of breaking all feeds
          }
        });

        const results = await Promise.all(feedPromises);
        const flattenedResults = results.flat();
        
        if (flattenedResults.length === 0) {
          throw new Error('No feed data available');
        }

        setFeeds(flattenedResults);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch feed data');
        setLoading(false);
        console.error('Feed fetch error:', err);
      }
    };

    fetchFeeds();
  }, [feedUrls, feedType, feedFields]);

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
  );
};

export default FeedPlayer; 