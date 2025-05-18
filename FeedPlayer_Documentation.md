# FeedPlayer Project Documentation

## Overview

**FeedPlayer** is a modern, extensible React-based web application for aggregating, merging, and displaying multimedia feeds from various sources (NASA, SeeClickFix, Google Sheets, CSV, and more). It supports multi-feed merging, dynamic configuration via Google Sheets, and user customization through settings and localStorage.

---

## Table of Contents

1. Project Structure
2. Key Features
3. Feed Types Supported
4. Multi-Feed (Pipe-Separated) Support
5. Google Sheets Integration
6. SeeClickFix Integration
7. LocalStorage Settings
8. Error Handling & User Experience
9. Build & Deployment
10. How to Add a New Feed
11. How to Test
12. Extending the Project
13. Known Issues & Limitations
14. Credits & Acknowledgements

---

## 1. Project Structure

```
/src
  /components
    FeedPlayer.jsx / FeedPlayer.tsx   # Main feed player component
    Popup/                            # Popup and modal components
  /Context
    ContextGoogle.jsx                 # Google Sheets context provider
  /utils
    formatTime.js                     # Utility for formatting time
  /scss
    _input.scss, _variables.scss      # SCSS styles
  App.jsx / App.tsx                   # Main app entry
  VideoPlayer/VideoPlayer.jsx         # Main video/image player logic
/dist                                 # Build output for deployment
```

---

## 2. Key Features

- Multi-source feed aggregation (NASA, SeeClickFix, BlueSky, CSV, Google Sheets, etc.)
- Pipe-separated multi-feed merging (combine multiple feeds in one view)
- Google Sheets as a dynamic feed source
- SeeClickFix integration with image filtering and location support
- User settings via localStorage (latitude/longitude)
- Friendly error handling and user messages
- Hash-based navigation and deep-linking
- Responsive, modern UI with Material-UI and custom SCSS
- Build and deploy to GitHub Pages

---

## 3. Feed Types Supported

- NASA APOD: Astronomy Picture of the Day via NASA API.
- SeeClickFix: Community issue reporting, filtered for image-rich issues.
- BlueSky: RSS/JSON feeds.
- CSV/JSON: Any public CSV or JSON feed.
- Google Sheets: Dynamic feed configuration and management.
- Custom: Any feed with a compatible API.

---

## 4. Multi-Feed (Pipe-Separated) Support

**Purpose:**  Allow users to merge multiple feeds into a single view by specifying multiple URLs separated by a pipe (`|`).

**How it works:**
- In the Google Sheet or feed config, enter multiple feed URLs separated by `|`.
- The FeedPlayer splits the string, fetches each feed, and merges the results for display.

**Example:**
```
https://api.nasa.gov/planetary/apod?api_key=YOUR_KEY|https://seeclickfix.com/api/v2/issues?lat=41.307&lng=-72.925&per_page=100
```

**Implementation:**
- The `loadFeed` function in `VideoPlayer.jsx` detects the pipe, splits the URLs, fetches each, and combines the results.

---

## 5. Google Sheets Integration

**Purpose:**  Allow non-developers to manage feeds, titles, and descriptions via a shared Google Sheet.

**How it works:**
- The app fetches a published CSV version of the Google Sheet.
- Each row represents a feed, with columns for title, description, URL, etc.
- The user can select feeds by name, and the app loads the corresponding URL(s).

**Implementation:**
- `ContextGoogle.jsx` fetches and parses the Google Sheet using Axios and PapaParse.
- The feed list is provided to the rest of the app via React Context.

---

## 6. SeeClickFix Integration

**Purpose:**  Display community-reported issues, focusing on those with images.

**Features:**
- Image Filtering: Only issues with images are shown.
- Limit: Only the first 5 image-rich issues per feed are displayed.
- Pipe Merge: Multiple SeeClickFix locations can be merged using pipe-separated URLs.
- Location Support: Uses latitude/longitude from localStorage or defaults.

**Implementation:**
- In `fetchMediaFromAPI` (in `VideoPlayer.jsx`):
  - Checks for `seeclickfix-311` feed.
  - Replaces `{latitude}` and `{longitude}` in the URL with values from localStorage (or defaults).
  - Filters issues for those with images and limits to 5.
  - Supports pipe-separated URLs for merging multiple locations.

---

## 7. LocalStorage Settings

**Purpose:**  Allow users to set their preferred latitude and longitude for location-based feeds (e.g., SeeClickFix).

**How it works:**
- Users can set latitude/longitude in the settings tab (`#sidetab=settings`).
- The app reads these values from localStorage and uses them in API requests.

**Implementation:**
- When constructing SeeClickFix URLs, the app checks localStorage for `latitude` and `longitude` and substitutes them into the URL.

---

## 8. Error Handling & User Experience

- Friendly error messages for API rate limits (429), bad requests (400), and unknown errors.
- Loading spinners and placeholders while feeds are loading.
- Hash-based navigation ensures the correct feed is loaded and the URL is preserved on reload.
- No blank/default feed flash: The app waits for the hash/feed to be processed before rendering.

---

## 9. Build & Deployment

**Build:**
- Run `yarn build` or `npm run build` to generate the latest static files in the `dist` folder.

**Deploy:**
- Commit and push the `dist` folder to the branch configured for GitHub Pages (e.g., `feature/multi-feed-support-v2`).
- GitHub Pages will serve the latest build from this branch.

---

## 10. How to Add a New Feed

1. **Via Google Sheet:**
   - Add a new row with the feed name, description, and URL (or pipe-separated URLs).
2. **Directly in code:**
   - Add the feed URL to the config or as a prop to the FeedPlayer component.

---

## 11. How to Test

- **Set location:**  In the browser console:
  ```js
  localStorage.setItem('latitude', '41.307');
  localStorage.setItem('longitude', '-72.925');
  ```
- **Test multi-feed:**  Use a pipe-separated URL in the feed config or Google Sheet.
- **Test error handling:**  Use an invalid API key or hit the NASA rate limit to see friendly error messages.
- **Test hash navigation:**  Visit `https://your-site/#feed=yourfeed` and refresh to ensure the hash is preserved.

---

## 12. Extending the Project

- **Add new feed types:**  Extend the `detectFeedType` and `processFeedItem` functions.
- **Add new settings:**  Store/retrieve new values in localStorage and use them in API requests.
- **UI enhancements:**  Use Material-UI or SCSS for further customization.

---

## 13. Known Issues & Limitations

- API rate limits: NASA DEMO_KEY is rate-limited; use your own key for production.
- CORS: Some feeds may require CORS proxies or server-side support.
- SeeClickFix: Only issues with images are shown; if none exist, the feed may appear empty.

---

## 14. Credits & Acknowledgements

- **Project Lead:** Kirthika Subramaniam
- **Contributors:** [List any other contributors]
- **APIs Used:** NASA APOD, SeeClickFix, BlueSky, Google Sheets, etc.
- **Libraries:** React, Material-UI, Axios, PapaParse, Vite, Yarn, SCSS

---

## Example: SeeClickFix Feed with Pipe Merge and Location

**Google Sheet row:**
| Feed Name      | URL                                                                                                                      |
|---------------|--------------------------------------------------------------------------------------------------------------------------|
| seeclickfix-2x | https://seeclickfix.com/api/v2/issues?lat={latitude}&lng={longitude}&per_page=100|https://seeclickfix.com/api/v2/issues?lat=40.7128&lng=-74.0060&per_page=100 |

- The first URL uses the user's localStorage lat/lon.
- The second URL is for New York City.
- The FeedPlayer will merge and display the first 5 image-rich issues from each.

---

If you need this documentation as a markdown file, PDF, or want to add diagrams/screenshots, let me know!
If you want even more technical detail (e.g., code snippets for each feature), I can provide that as well. 