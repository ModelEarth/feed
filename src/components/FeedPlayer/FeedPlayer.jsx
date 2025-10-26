import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Context } from "../../Context/ContextGoogle";
import { formatTime } from "../../utils/formatTime";
import "./FeedPlayer.scss";
import axios from "axios";
import PropTypes from "prop-types";
import { FaChevronUp, FaChevronDown, FaPlay, FaPause } from "react-icons/fa";
import Popup from "../Popup/Popup";
import PageDisplay from "../PageDisplay/PageDisplay";
import MemberSense from "../MemberSenseComponents/MemberSenseLogin/MemberSense";
import MemberShowcase from "../MemberSenseComponents/MemberShowcase/MemberShowcase";
import DiscordChannelViewer from "../MemberSenseComponents/DiscordChannelViewer/DiscordChannelViewer";

// Function to determine correct path for cities.csv based on current location
const getCitiesCsvPath = () => {
  const currentPath = window.location.pathname;
  if (currentPath.includes('/dist')) {
    return '../../team/projects/map/cities.csv';
  } else if (currentPath.includes('/feed')) {
    return '../team/projects/map/cities.csv';
  } else {
    return 'team/projects/map/cities.csv';
  }
};
import Papa from "papaparse";

function FeedPlayer({
  autoplay = false,
  isFullScreen,
  setIsFullScreen,
  handleFullScreen,
  selectedOption,
  setSelectedOption,
  swiperData,
  setSwiperData,
  playerHashFromCache = true,
  pageContent = "", // Add page content prop
  showMemberSenseOverlay = false,
  setShowMemberSenseOverlay,
  memberSenseProps = {},
  // Menu-related props
  isMenu = false,
  setIsMenu,
  handleMenuClick,
  setCurrentView,
}) {
  
  // Utility function to detect if we're in dist context and adjust paths
  const getAssetPath = (assetPath) => {
    // Check if we're in dist context by looking at the feedplayer.js script tag
    const scripts = document.querySelectorAll('script[src*="feedplayer.js"]');
    
    if (scripts.length > 0) {
      const scriptSrc = scripts[0].src;
      
      // Check if this is a built/dist version by looking for assets/feedplayer.js in the path
      const isInDist = scriptSrc.includes('/assets/feedplayer.js');
      
      if (isInDist) {
        // Extract the base path from the script URL
        const scriptBasePath = scriptSrc.substring(0, scriptSrc.lastIndexOf('/assets/feedplayer.js'));
        
        // Remove 'src/' prefix and get just the path after src/
        let cleanPath;
        if (assetPath.startsWith('src/')) {
          cleanPath = assetPath.substring(4); // Remove 'src/' -> 'assets/images/intro-landscape.jpg'
        } else {
          cleanPath = assetPath;
        }
        
        // If cleanPath already starts with 'assets/', use it directly
        // Otherwise, add 'assets/' prefix
        const finalPath = cleanPath.startsWith('assets/') 
          ? `${scriptBasePath}/${cleanPath}`
          : `${scriptBasePath}/assets/${cleanPath}`;
        return finalPath;
      }
    }
    
    // Fallback: We're outside dist context, use original path logic
    const currentPath = window.location.pathname;
    let basePath;
    if (currentPath.includes('/feed/')) {
      basePath = currentPath.split('/feed/')[0] + '/feed';
    } else {
      basePath = '/feed';
    }
    return `${basePath}/${assetPath}`;
  };
  // The numbers here are the states to see in React Developer Tools
  const { mediaList, currentMedia, setCurrentMedia } = useContext(Context); // 0
  const [isPlaying, setIsPlaying] = useState(autoplay); // 1
  const [currentVolume, setCurrentVolume] = useState(1); // 2
  const [isMute, setIsMute] = useState(true); // 3
  const [imageElapsed, setImageElapsed] = useState(0); // 4
  const containerRef = useRef(null); // 5
  const videoRef = useRef(null); // 6
  const videoRangeRef = useRef(null); // 7
  const volumeRangeRef = useRef(null); // 8
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // 9
  const imageTimerRef = useRef(null); // 10

  const [duration, setDuration] = useState([0, 0]); // 11
  const [currentTime, setCurrentTime] = useState([0, 0]); // 12
  const [durationSec, setDurationSec] = useState(0); // 13
  const [currentSec, setCurrentTimeSec] = useState(0); // 14

  const [isDropdownActive, setIsDropdownActive] = useState(false); // 15
  const [index, setIndex] = useState(0); // 16
  const [selectedMediaList, setSelectedMediaList] = useState([]); // 17
  const [listofMedia, setListofMedia] = useState({}); // 18
  const [loadedFeeds, setLoadedFeeds] = useState([]); // 19
  const [loadingFeeds, setLoadingFeeds] = useState({}); // 20

  const [isLoading, setIsLoading] = useState(true); // 21
  const [activeFeed, setActiveFeed] = useState("nasa"); // 22
  const [isExpanded, setIsExpanded] = useState(false); // 23
  const imageRef = useRef(null); // 24
  const [isTallImage, setIsTallImage] = useState(false); // 25
  const [videoData, setVideoData] = useState(null); // 26
  const [showSceneIndicator, setShowSceneIndicator] = useState(false); // 27
  const [sceneDisplayTimeout, setSceneDisplayTimeout] = useState(null); // 28
  const [showFeedsDropdown, setShowFeedsDropdown] = useState(true); // 29 - Show by default
  const [isHovered, setIsHovered] = useState(false); // 30 - Track hover state
  const [userHasInteracted, setUserHasInteracted] = useState(false); // 31 - Track if user has manually played
  const [showDisplayModesPopup, setShowDisplayModesPopup] = useState(false); // 32 - Display modes popup
  const [currentDisplayMode, setCurrentDisplayMode] = useState("media"); // 33 - Current display mode
  const [isViewPageMode, setIsViewPageMode] = useState(false); // 34 - Track if in View Page mode
  const [previousMediaState, setPreviousMediaState] = useState(null); // 35 - Store previous media state before View Page
  const [isNarrowScreen, setIsNarrowScreen] = useState(false); // 36 - Track narrow screen based on #playerRoot width
  const [showRightColumn, setShowRightColumn] = useState(true); // 37 - Control right column visibility
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState(false); // 38 - Track if left panel is expanded
  const [showControlsMenu, setShowControlsMenu] = useState(false); // 39 - Control menu visibility

  // Reset right column visibility when overlay is shown
  useEffect(() => {
    if (showMemberSenseOverlay) {
      setShowRightColumn(true);
      setIsLeftPanelExpanded(false);
    }
  }, [showMemberSenseOverlay]);


  const imageDuration = 4;
  const pageDuration = 10; // Pages last 10 seconds
  const pageTimerRef = useRef(null); // Add page timer ref

  // Function to handle feed item selection across all display modes
  const handleFeedItemClick = (index) => {
    setCurrentMediaIndex(index);
    setCurrentDisplayMode("media");
  };

  // Display mode definitions with icons
  const displayModes = [
    { key: "media", label: "Media View", icon: "ri-play-circle-line" },
    { key: "full", label: "Full View", icon: "ri-fullscreen-line" },
    { key: "columns", label: "Columns", icon: "ri-layout-column-line" },
    { key: "table", label: "Table", icon: "ri-table-line" },
    { key: "list", label: "List", icon: "ri-list-check" },
    { key: "gallery", label: "Gallery", icon: "ri-gallery-line" }
  ];

  // Effect to detect narrow screen - switch when right column would be less than 50% of playerRoot
  useEffect(() => {
    const checkScreenWidth = () => {
      const playerRoot = document.getElementById('playerRoot');
      if (playerRoot) {
        const width = playerRoot.clientWidth;
        // Normal layout: left (flex: 2) + right (flex: 1) = 3 parts total
        // Right column = width * (1/3) in normal mode
        // Switch to narrow when: right column width < 50% of total playerRoot width
        // So: (width / 3) < (width * 0.5)
        // Simplifying: width/3 < width/2 => 1/3 < 1/2 => 2 < 3 (always true)
        // This means: always narrow, which is wrong
        //
        // I think the request means: switch when playerRoot becomes narrow enough
        // that showing the right column at 1/3 width would make it too small
        // Let's use: switch when playerRoot width < 1200px (so right column would be < 400px)
        setIsNarrowScreen(width < 1200);
      }
    };

    // Check on mount
    checkScreenWidth();

    // Check on resize
    window.addEventListener('resize', checkScreenWidth);
    
    return () => {
      window.removeEventListener('resize', checkScreenWidth);
    };
  }, []);

  // Handle view page action
  useEffect(() => {
    if (selectedOption === "viewPage") {
      // Store current state before switching to View Page
      setPreviousMediaState({
        media: currentMedia,
        index: currentMediaIndex,
        list: [...selectedMediaList]
      });
      
      // Create a page scene and add it to the current media list
      const pageScene = {
        type: 'page',
        title: 'Team Projects Page',
        description: 'Displaying team projects page content',
        url: null, // Pages don't have URLs
      };
      
      // Add the page scene to the selectedMediaList
      setSelectedMediaList(prev => [...prev, pageScene]);
      
      // Switch to the page scene
      const newIndex = selectedMediaList.length;
      setCurrentMediaIndex(newIndex);
      setCurrentMedia(pageScene);
      
      // Enter View Page mode
      setIsViewPageMode(true);
      
      // Clear the selected option
      setSelectedOption("");
    }
  }, [selectedOption, selectedMediaList, currentMedia, currentMediaIndex, setSelectedOption]);

  // Function to exit View Page mode
  const exitViewPageMode = () => {
    setIsViewPageMode(false);
    
    // Restore previous state if available
    if (previousMediaState) {
      setSelectedMediaList(previousMediaState.list);
      setCurrentMediaIndex(previousMediaState.index);
      setCurrentMedia(previousMediaState.media);
      setPreviousMediaState(null);
    } else {
      // Fallback: remove page scenes and return to first non-page item
      const filteredList = selectedMediaList.filter(item => item.type !== 'page');
      setSelectedMediaList(filteredList);
      if (filteredList.length > 0) {
        setCurrentMediaIndex(0);
        setCurrentMedia(filteredList[0]);
      }
    }
  };

  // Helper function to show video frame at 2 seconds when paused
  const showVideoPreviewFrame = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.poster = ""; // Remove poster to show video frame
      
      // Set up event listener to seek to 2 seconds once video metadata is loaded
      const seekToPreviewTime = () => {
        if (videoRef.current && videoRef.current.duration > 2) {
          videoRef.current.currentTime = 2; // Go to 2 seconds in to avoid fade-in from black
        }
        videoRef.current.removeEventListener('loadedmetadata', seekToPreviewTime);
      };
      
      // If metadata is already loaded, seek immediately
      if (videoRef.current.readyState >= 1) {
        seekToPreviewTime();
      } else {
        // Wait for metadata to load
        videoRef.current.addEventListener('loadedmetadata', seekToPreviewTime);
      }
      
      videoRef.current.load(); // Ensure video loads
    }
  }, []);

  // Player Hash Cache Management
  const getPlayerHashCache = () => {
    try {
      const cache = localStorage.getItem('playerHashCache');
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.warn('Error reading playerHashCache:', error);
      return {};
    }
  };

  const setPlayerHashCache = (listName, listStatus) => {
    try {
      const cache = getPlayerHashCache();
      cache[listName] = {
        ...listStatus,
        list: listStatus.list || listName,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('playerHashCache', JSON.stringify(cache));
      console.log(`%c✅ Cached scene ${listStatus.scene} for list '${listName}'`, 'color: blue; font-weight: bold');
    } catch (error) {
      console.warn('Error saving to playerHashCache:', error);
    }
  };

  const getListStatusFromCache = (listName) => {
    const cache = getPlayerHashCache();
    const status = cache[listName];
    if (!status) return null;
    return {
      ...status,
      list: status.list || listName
    };
  };

  const showSceneIndicatorTemporarily = (scene) => {
    if (!playerHashFromCache) return;
    
    // Clear existing timeout
    if (sceneDisplayTimeout) {
      clearTimeout(sceneDisplayTimeout);
    }
    
    setShowSceneIndicator(true);
    
    // Hide after 3 seconds
    const timeout = setTimeout(() => {
      setShowSceneIndicator(false);
    }, 3000);
    
    setSceneDisplayTimeout(timeout);
  };

  const updateURLHash = (listName, scene) => {
    if (playerHashFromCache) {
      // Use cache instead of updating URL hash
      const listStatus = {
        scene: scene,
        list: listName,
        timestamp: Date.now()
      };
      setPlayerHashCache(listName, listStatus);
      
      // Show scene indicator
      showSceneIndicatorTemporarily(scene);
      
      // Keep the list parameter in the URL but don't change scene
      const existingParams = new URLSearchParams(window.location.hash.substring(1));
      const otherParams = new URLSearchParams();
      
      existingParams.forEach((value, key) => {
        if (key !== "list" && key !== "scene") {
          otherParams.set(key, value);
        }
      });
      
      // Only update the list parameter in the URL, keep scene out of URL
      let hash = `#list=${encodeURIComponent(listName)}`;
      if (otherParams.toString()) {
        hash += `&${otherParams.toString()}`;
      }
      
      // Only update hash if the list has actually changed
      const currentList = existingParams.get("list");
      if (currentList !== listName) {
        window.location.hash = hash;
      }
      
      return;
    }

    // Original hash updating behavior when playerHashFromCache is false
    const existingParams = new URLSearchParams(
      window.location.hash.substring(1)
    );
    const otherParams = new URLSearchParams(); // string containing all the extra params in the URL

    existingParams.forEach((value, key) => {
      if (key !== "list" && key !== "scene") {
        otherParams.set(key, value);
      }
    });

    let hash = `#list=${encodeURIComponent(listName)}&scene=${scene + 1}`; // scene is 1-based in the URL
    if (otherParams.toString()) {
      hash += `&${otherParams.toString()}`;
    }
    window.location.hash = hash;
  };

  const parseHash = () => {
    const hash = window.location.hash.substring(1); // Remove the leading '#'
    const params = new URLSearchParams(hash);
    const listName = params.get("list") || "";
    
    if (playerHashFromCache && listName) {
      // Try to get scene from cache first
      const cachedStatus = getListStatusFromCache(listName);
      if (cachedStatus && typeof cachedStatus.scene === 'number') {
        console.log(`%c✅ Restored scene ${cachedStatus.scene} for list '${listName}' from cache`, 'color: green; font-weight: bold');
        return {
          list: listName,
          scene: cachedStatus.scene,
          fromCache: true
        };
      }
    }
    
    // Fallback to URL-based scene or default to 0
    return {
      list: listName,
      scene: parseInt(params.get("scene") - 1, 10) || 0, // scene is 1-based in the URL, so we subtract 1 to make it 0-based
      fromCache: false
    };
  };

  useEffect(() => {
    if (currentMedia && selectedMediaList.length > 0)
      updateURLHash(mediaList[index].list, currentMediaIndex);
  }, [
    currentMediaIndex,
    currentMedia,
    mediaList,
    index,
    selectedMediaList.length,
  ]);

  useEffect(() => {
    const { list: hashList } = parseHash();

    if (hashList) {
      const selectedFeed = mediaList.find(
        (media) => media.list.trim().toLowerCase() === hashList.toLowerCase()
      );
      if (selectedFeed) setIndex(mediaList.indexOf(selectedFeed)); // Update dropdown selection
    }
  }, [mediaList]);

  useEffect(() => {
    const fetchSwiperData = async () => {
      const swiperRepo = JSON.parse(sessionStorage.getItem("swiperMedia"));
      if (swiperRepo) {
        setSwiperData({
          url: swiperRepo.url,
          text: swiperRepo.text || "No description available",
          title: swiperRepo.title || swiperRepo.url.split("/").pop(),
          mediaType: swiperRepo.mediaType || "image",
        });
      }
    };
    const handleStorageChange = () => fetchSwiperData();
    window.addEventListener("sessionStorageChange", handleStorageChange);
    return () =>
      window.removeEventListener("sessionStorageChange", handleStorageChange);
  }, []);

  useEffect(() => {
    const processSwiperData = async () => {
      setIsLoading(true);
      const templistofMedia = {};
      const swiperFeed = mediaList.find(
        (media) => media.list.trim().toLowerCase() === "swiper"
      );
      if (swiperFeed) {
        await loadFeed(swiperFeed, templistofMedia);
        setLoadedFeeds(["swiper"]);
        setListofMedia(templistofMedia);
        setSelectedMediaList(templistofMedia[swiperFeed.title]);
        setCurrentMedia(templistofMedia[swiperFeed.title][0]);
      }
      setIsLoading(false);
    };
    processSwiperData();
  }, [swiperData]);

  useEffect(() => {
    const processVideoData = async () => {
      setIsLoading(true);
      const templistofMedia = {};
      const linkedVideoFeed = mediaList.find(
        (media) => media.list.trim().toLowerCase() === "linkedvideo"
      );
      if (linkedVideoFeed) {
        await loadFeed(linkedVideoFeed, templistofMedia);
        setIndex(9);
        setCurrentMediaIndex(0);
        setLoadedFeeds(["linkedvideo"]);
        setListofMedia(templistofMedia);
        setSelectedMediaList(templistofMedia[linkedVideoFeed.title]);
        setCurrentMedia(templistofMedia[linkedVideoFeed.title][0]);
        setActiveFeed("linkedvideo");
      }
      setIsLoading(false);
    };
    processVideoData();
  }, [videoData]);

  useEffect(() => {
    const { list: hashList, scene } = parseHash();

    if (hashList && scene >= 0) {
      const selectedFeed = mediaList.find(
        (media) => media.list.trim().toLowerCase() === hashList.toLowerCase()
      );

      if (selectedFeed) {
        loadFeed(selectedFeed, listofMedia).then(() => {
          const selectedMedia = listofMedia[selectedFeed.title];
          if (selectedMedia[scene]) {
            setIndex(mediaList.indexOf(selectedFeed));
            setSelectedMediaList(selectedMedia);
            setCurrentMedia(selectedMedia[scene]);
            setCurrentMediaIndex(scene);
            console.log(`%c✅ Successfully loaded list '${selectedFeed.list}' with ${selectedMedia.length} items from media list processing`, 'color: green; font-weight: bold');
          }
        });
      }
    }
  }, [mediaList]);

  useEffect(() => {
    const handleHashChange = () => {
      const { list: hashList, scene } = parseHash();

      if (hashList) {
        // Find the feed in mediaList
        const selectedFeed = mediaList.find(
          (media) => media.list.trim().toLowerCase() === hashList.toLowerCase()
        );

        if (selectedFeed) {
          // Check if search/cat params changed for products-* feeds
          const listSlug = hashList.trim().toLowerCase();
          const isProductsList = listSlug.startsWith('products-');
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const currentSearch = hashParams.get('search') || '';
          const currentCat = hashParams.get('cat') || '';
          
          // Force reload if products list and search/cat params exist (filters need fresh data)
          const shouldReload = isProductsList && (currentSearch || currentCat);
          
          // If the feed is not loaded, load it
          if (!listofMedia[selectedFeed.title] || shouldReload) {
            loadFeed(selectedFeed, listofMedia).then(() => {
              const selectedMedia = listofMedia[selectedFeed.title];
              if (selectedMedia && selectedMedia.length > 0) {
                if (scene >= 0 && selectedMedia[scene]) {
                  setIndex(mediaList.indexOf(selectedFeed));
                  setSelectedMediaList(selectedMedia);
                  setCurrentMedia(selectedMedia[scene]);
                  setCurrentMediaIndex(scene);
                  console.log(`%c✅ Successfully loaded list '${selectedFeed.list}' with ${selectedMedia.length} items`, 'color: green; font-weight: bold');
                } else {
                  console.warn(
                    `Invalid scene index ${scene + 1} in URL hash for list '${selectedFeed.list}'. List has ${selectedMedia.length} items.`
                  );
                  // Load first item as fallback
                  setIndex(mediaList.indexOf(selectedFeed));
                  setSelectedMediaList(selectedMedia);
                  setCurrentMedia(selectedMedia[0]);
                  setCurrentMediaIndex(0);
                }
              } else {
                console.warn(
                  `List '${selectedFeed.list}' loaded but contains no records or data.`
                );
              }
            });
          } else {
            // Feed is already loaded
            const selectedMedia = listofMedia[selectedFeed.title];
            if (selectedMedia && selectedMedia.length > 0) {
              if (scene >= 0 && selectedMedia[scene]) {
                setIndex(mediaList.indexOf(selectedFeed));
                setSelectedMediaList(selectedMedia);
                setCurrentMedia(selectedMedia[scene]);
                setCurrentMediaIndex(scene);
                console.log(`%c✅ Successfully loaded list '${selectedFeed.list}' with ${selectedMedia.length} items (already cached)`, 'color: green; font-weight: bold');
              } else {
                console.warn(
                  `Invalid scene index ${scene + 1} in URL hash for list '${selectedFeed.list}'. List has ${selectedMedia.length} items.`
                );
                // Load first item as fallback
                setIndex(mediaList.indexOf(selectedFeed));
                setSelectedMediaList(selectedMedia);
                setCurrentMedia(selectedMedia[0]);
                setCurrentMediaIndex(0);
              }
            } else {
              console.warn(
                `List '${selectedFeed.list}' is loaded but contains no records or data.`
              );
            }
          }
        } else {
          console.warn("Feed not found in mediaList");
        }
      }
    };
    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    // Trigger on component mount
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [mediaList, listofMedia]);

  useEffect(() => {
    if (mediaList && mediaList.length > 0) {
      const hash = window.location.hash;
      if (!hash || !hash.includes("list=")) {
        processMediaList();
      }
    }
  }, [mediaList]);

  useEffect(() => {
    const { list: hashList } = parseHash();
    if (hashList) {
      const selectedFeed = mediaList.find(
        (media) => media.list.trim().toLowerCase() === hashList.toLowerCase()
      );
      if (selectedFeed) setIndex(mediaList.indexOf(selectedFeed)); // Update dropdown selection
    }
  }, [mediaList]);

  const processMediaList = async () => {
    setIsLoading(true);
    const templistofMedia = {};

    // Try to load the first available feed from the mediaList
    let defaultList = null;
    if (mediaList && mediaList.length > 0) {
      // Get the first feed that has a URL and is not broken
      defaultList = mediaList.find((media) => 
        media.url && 
        media.url.trim() && 
        media.url.startsWith('http') // Ensure it's a valid HTTP URL
      );
    }

    // Fallback to NASA feed if no other feed is available
    if (!defaultList) {
      defaultList = mediaList.find(
        (media) => media.list.trim().toLowerCase() === "nasa"
      );
    }

    if (defaultList) {
      try {
        // Load the default feed
        await loadFeed(defaultList, templistofMedia);
        setLoadedFeeds([defaultList.list.trim().toLowerCase()]);

        // Set initial media
        setListofMedia(templistofMedia);
        setSelectedMediaList(templistofMedia[defaultList.title]);
        setCurrentMedia(templistofMedia[defaultList.title][0]);
        console.log(`%c✅ Successfully loaded default list '${defaultList.list}' with ${templistofMedia[defaultList.title]?.length || 0} items`, 'color: green; font-weight: bold');
      } catch (error) {
        console.error("Failed to load default feed:", error);
        // If default feed fails and it wasn't NASA, try NASA as fallback
        if (defaultList.list.trim().toLowerCase() !== "nasa") {
          const nasaFeed = mediaList.find(
            (media) => media.list.trim().toLowerCase() === "nasa"
          );
          if (nasaFeed) {
            try {
              await loadFeed(nasaFeed, templistofMedia);
              setLoadedFeeds(["nasa"]);
              setListofMedia(templistofMedia);
              setSelectedMediaList(templistofMedia[nasaFeed.title]);
              setCurrentMedia(templistofMedia[nasaFeed.title][0]);
              console.log(`%c✅ Successfully loaded NASA fallback list with ${templistofMedia[nasaFeed.title]?.length || 0} items`, 'color: green; font-weight: bold');
            } catch (nasaError) {
              console.error("NASA fallback also failed:", nasaError);
            }
          }
        }
      }
    }

    setIsLoading(false);
  };

  const handleGlobalError = (error, mediaTitle = "Error") => {
    console.warn("Media loading error:", error.message || error, "for:", mediaTitle);
    // Don't replace the entire media list, just skip the problematic item
    // This prevents disrupting the entire feed when one image fails
  };

  // Wrap the loadFeed function to pass the media title to the global error handler
  const loadFeed = async (media, templistofMedia) => {
    try {
      setLoadingFeeds((prev) => ({ ...prev, [media.title]: true }));
      const mediaItems = await fetchMediaFromAPI(media);
      templistofMedia[media.title] = Array.isArray(mediaItems)
        ? mediaItems
        : [mediaItems];
      setLoadedFeeds((prev) => [...prev, media.list.trim().toLowerCase()]);
      setListofMedia((prev) => ({
        ...prev,
        [media.title]: templistofMedia[media.title],
      }));
    } catch (error) {
      handleGlobalError(error, media.title); // Pass the media title to the error handler
    } finally {
      setLoadingFeeds((prev) => ({ ...prev, [media.title]: false }));
    }
  };

  const fetchMediaFromAPI = async (media) => {
    try {
      setActiveFeed(media.list.trim().toLowerCase());
      if (media.list.trim().toLowerCase() === "swiper" && media.url) {
        if (!swiperData || !swiperData.url) {
          return {
            url: null,
            text: "Please click on a Swiper Image to view",
            title: `Failed to load ${media.title}`,
            isError: true,
          };
        }
        return {
          url: swiperData.url,
          text: swiperData.text || "No description available",
          title: swiperData.title,
        };
      }
      if (media.list.trim().toLowerCase() === "linkedvideo") {
        if (!videoData) {
          return {
            url: null,
            text: "Please upload a video link to view",
            title: `Failed to load ${media.title}`,
            isError: true,
          };
        }
        return {
          url: videoData.url,
          text: videoData.text,
          title: videoData.title,
        };
      }
      
      // Special handling for cities feed - load from local CSV
      if (media.list.trim().toLowerCase() === "cities") {
        const citiesCsvPath = getCitiesCsvPath();
        const citiesResponse = await axios.get(citiesCsvPath);
        
        return new Promise((resolve) => {
          Papa.parse(citiesResponse.data, {
            header: true,
            complete: (results) => {
              const cityScenes = results.data
                .filter((row) => row.City && row.City.trim() !== '')
                .map((row) => ({
                  url: '', // Cities don't have image URLs
                  text: `${row.City}, ${row.County || ''} County - Population: ${row.Population || 'Unknown'}\nCoordinates: ${row.Latitude}, ${row.Longitude}`,
                  title: row.City,
                  type: 'city', // Mark as city type
                  cityData: row // Store original data
                }));
              resolve(cityScenes);
            },
            error: (error) => {
              console.error('Error parsing cities CSV:', error);
              resolve([]);
            }
          });
        });
      }
      
      // Special handling for USDA food APIs with enhanced error handling
      const listSlug = media.list.trim().toLowerCase();
      if (listSlug === "food" || listSlug === "usda") {
        try {
          const response = await axios.get(media.url, {
            timeout: 10000, // 10 second timeout
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'FeedPlayer/1.0'
            }
          });
          return processFoodApiResponse(response.data, listSlug, media);
        } catch (apiError) {
          console.error(`${listSlug} API error:`, apiError);
          
          // Create helpful error slide with fallback information
          return [{
            url: null,
            text: `Error loading ${listSlug} data: ${apiError.message}`,
            title: `${media.title} - Temporarily Unavailable`,
            type: 'error',
            isError: true
          }];
        }
      }
      
      const response = await axios.get(media.url);
      switch (listSlug) {
        case "seeclickfix-311":
          return response.data.issues.map((item) => ({
            url: item.media.image_full || item.media.representative_image_url,
            text: item.description || "No description available",
            title: item.summary,
          }));
        case "film-scouting":
          return response.data.flatMap((item) => {
            const photos = [];
            for (let i = 1; i <= 10; i++) {
              const photoKey = `photo${i}`;
              if (item[photoKey]) {
                photos.push({
                  url: item[photoKey],
                  text: item.description || "No description available",
                  title: item[`photoText${i}`] || "No title available",
                });
              }
            }
            return photos;
          });
        case "repo": {
          const owner = "modelearth";
          const repo = "requests";
          const branch = "main";
          const repoFeed = mediaList.find(
            (media) => media.list.trim() === "repo"
          );
          const responseRepo = await axios.get(`${repoFeed.url}`);
          return responseRepo.data.tree
            .filter((file) => /\.(jpg|jpeg|gif)$/i.test(file.path))
            .map((file) => ({
              url: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`,
              text: "No description available",
              title: file.path.split("/").pop(),
            }));
        }
        case "videos":
          return response.data[0].videosURLs.map((url) => ({
            url,
            text: "No description available",
            title: url.split("/").pop(),
          }));
        case "feedview": {
          const bigBunnyLink = response.data[0].videosURLs[1];
          return bigBunnyLink
            ? [
                {
                  url: bigBunnyLink,
                  text: "No description available",
                  title: bigBunnyLink.split("/").pop(),
                },
              ]
            : [];
        }
        default:
          // Check if response data is CSV format (string) or JSON array
          if (typeof response.data === 'string') {
            // Parse CSV data using Papa Parse
            return new Promise((resolve, reject) => {
              Papa.parse(response.data, {
                header: true,
                complete: (results) => {
                  let mediaItems = [];
                  const isProductsList = listSlug.startsWith('products-');
                  const hashParams = new URLSearchParams(window.location.hash.substring(1));
                  const searchParam = (hashParams.get('search') || '').toLowerCase();
                  const catParam = (hashParams.get('cat') || '').toLowerCase();
                  
                  // Use feedFields if available to determine which columns to display
                  if (media.feedFields && media.feedFields.trim()) {
                    const fieldNames = media.feedFields.split(',').map(field => field.trim());
                    const parsedItems = [];

                    results.data
                      .filter((item) =>
                        Object.values(item).some((value) =>
                          value !== undefined && value !== null && String(value).trim() !== ''
                        )
                      ) // Filter out completely empty rows
                      .forEach((item, index) => {
                        // Create a display object using the specified fields
                        const displayData = {};
                        fieldNames.forEach(field => {
                          const value = item[field];
                          if (value !== undefined && value !== null && String(value).trim() !== '') {
                            displayData[field] = String(value);
                          }
                        });

                        // Fallback to all item fields (minus media keys) when feedFields miss
                        const fallbackData = Object.keys(displayData).length
                          ? displayData
                          : Object.fromEntries(
                              Object.entries(item)
                                .filter(([key, value]) =>
                                  key !== 'url' &&
                                  key !== 'hdurl' &&
                                  value !== undefined &&
                                  value !== null &&
                                  String(value).trim() !== ''
                                )
                                .map(([key, value]) => [key, String(value)])
                            );

                        const title = item.Name || item.title || item[fieldNames[0]] || item.ID || `Item ${index + 1}`;
                        const entries = Object.entries(fallbackData);
                        const imageUrl = item.url || item.hdurl;

                        if (imageUrl && imageUrl.startsWith('http')) {
                          parsedItems.push({
                            url: imageUrl,
                            text: entries.length
                              ? entries.map(([key, value]) => `${key}: ${value}`).join(', ')
                              : item.explanation || item.description || "No description available",
                            title,
                            rawData: item,
                            displayFields: fallbackData
                          });
                        } else if (entries.length) {
                          parsedItems.push({
                            url: null,
                            text: entries.map(([key, value]) => `${key}: ${value}`).join('\n'),
                            title,
                            type: 'text',
                            rawData: item,
                            displayFields: fallbackData
                          });
                        }
                      });

                    mediaItems = parsedItems;
                  } else {
                    // Fallback to standard media format
                    mediaItems = results.data
                      .filter((item) =>
                        Object.values(item || {}).some((value) =>
                          value !== undefined && value !== null && String(value).trim() !== ''
                        )
                      ) // Filter out entirely empty rows
                      .map((item, index) => {
                        const displayData = Object.fromEntries(
                          Object.entries(item || {})
                            .filter(([key, value]) =>
                              key !== 'url' &&
                              key !== 'hdurl' &&
                              value !== undefined &&
                              value !== null &&
                              String(value).trim() !== ''
                            )
                            .map(([key, value]) => [key, String(value)])
                        );

                        const imageUrl = item.hdurl || item.url;

                        if (imageUrl && imageUrl.startsWith('http')) {
                          return {
                            url: imageUrl,
                            text: Object.entries(displayData).map(([key, value]) => `${key}: ${value}`).join(', ') || item.explanation || item.description || "No description available",
                            title: item.title || item.Name || `Item ${index + 1}`,
                            rawData: item,
                            displayFields: displayData
                          };
                        }

                        const entries = Object.entries(displayData);
                        if (!entries.length) return null;

                        return {
                          url: null,
                          text: entries.map(([key, value]) => `${key}: ${value}`).join('\n'),
                          title: item.title || item.Name || item.ID || `Item ${index + 1}`,
                          type: 'text',
                          rawData: item,
                          displayFields: displayData
                        };
                      })
                      .filter(Boolean);
                  }
                  
                  // Optional filtering for products lists via URL params: search and cat
                  if (isProductsList && (searchParam || catParam)) {
                    mediaItems = mediaItems.filter((m) => {
                      if (!m || !m.rawData) return false;
                      const values = Object.values(m.rawData || {}).map(v => String(v || '').toLowerCase());
                      const title = String(m.title || '').toLowerCase();
                      const text = String(m.text || '').toLowerCase();
                      const categoryValue = (() => {
                        const rd = m.rawData || {};
                        return (rd.category || rd.Category || rd.cat || rd.Cat || rd.sector || rd.Sector || '').toString().toLowerCase();
                      })();
                      const searchOk = searchParam ? (title.includes(searchParam) || text.includes(searchParam) || values.some(v => v.includes(searchParam))) : true;
                      const catOk = catParam ? (categoryValue.includes(catParam)) : true;
                      return searchOk && catOk;
                    });
                  }
                  
                  if (!mediaItems || mediaItems.length === 0) {
                    mediaItems = [
                      {
                        url: null,
                        text: `No data available for ${media.title || media.list}`,
                        title: media.title || media.list || 'No data',
                        type: 'error',
                        isError: true,
                      },
                    ];
                  }

                  resolve(mediaItems);
                },
                error: (error) => {
                  console.error("CSV parsing error:", error);
                  reject(error);
                }
              });
            });
          } else {
            // Handle JSON array format (original NASA API format)
            return response.data.map((item) => ({
              url: item.hdurl || item.url,
              text: item.explanation || "No description available",
              title: item.title,
            }));
          }
      }
    } catch (error) {
      console.error("Error fetching from API for", media.title, ":", error);
      return [
        {
          url: null,
          text: `Error: ${error.message || "Unknown error"}`,
          title: `Failed to load ${media.title}`,
          isError: true,
        },
      ];
    }
  };

  const isImageFile = (src) => {
    if (!src) return false;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    return (
      src &&
      imageExtensions.some((extension) => src.toLowerCase().endsWith(extension))
    );
  };

  const isVideoFile = (src) => {
    if (!src) return false;
    const videoExtensions = [".mp4", ".webm", ".ogg"];
    return (
      src &&
      videoExtensions.some((extension) => src.toLowerCase().endsWith(extension))
    );
  };

  const isPageFile = (media) => {
    return media && media.type === 'page';
  };

  const isTextOnlyFeed = (media) => {
    return media && ['food', 'usda', 'text'].includes(media.type);
  };

  // Process USDA Food API responses into standardized slide format
  const processFoodApiResponse = (data, listSlug, media) => {
    console.log(`Processing ${listSlug} API response:`, data);
    
    try {
      switch (listSlug) {
        case "food": {
          // USDA Food List API - returns array of food items
          if (!data || !Array.isArray(data)) {
            throw new Error("Invalid food API response format");
          }
          
          return data.map((food, index) => {
            const nutritionData = extractNutritionData(food);
            
            return {
              url: null, // No images in USDA API
              text: createNutritionLabel(food, nutritionData, "No ingredients listed"),
              title: food.description || `Food Item ${index + 1}`,
              type: 'food',
              rawData: food
            };
          });
        }
        
        case "usda": {
          // USDA Single Food API - returns single food object
          if (!data || typeof data !== 'object') {
            throw new Error("Invalid USDA API response format");
          }
          
          const nutritionData = extractNutritionData(data);
          const ingredients = data.ingredients || "No ingredients listed";
          
          return [{
            url: null, // No images in USDA API
            text: createNutritionLabel(data, nutritionData, ingredients),
            title: data.description || "USDA Food Item",
            type: 'usda',
            rawData: data
          }];
        }
        
        default:
          throw new Error(`Unknown food list type: ${listSlug}`);
      }
    } catch (error) {
      console.error(`Error processing ${listSlug} API response:`, error);
      return [{
        url: null,
        text: `Error processing ${listSlug} data: ${error.message}`,
        title: `Failed to load ${media.title}`,
        isError: true,
        type: 'error'
      }];
    }
  };

  // Extract nutritional information directly from API response
  const extractNutritionData = (foodData) => {
    // Use labelNutrients if available (USDA feed has this)
    let labelNutrients = foodData.labelNutrients || {};
    
    // If no labelNutrients, create standardized format from foodNutrients array (Food feed)
    if (!foodData.labelNutrients && foodData.foodNutrients && Array.isArray(foodData.foodNutrients)) {
      labelNutrients = createStandardizedNutrients(foodData.foodNutrients);
    }
    
    // Also get detailed nutrients for additional info
    const detailedNutrients = {};
    if (foodData.foodNutrients && Array.isArray(foodData.foodNutrients)) {
      foodData.foodNutrients.forEach(nutrient => {
        const name = nutrient.name || nutrient.nutrient?.name;
        if (name) {
          detailedNutrients[name] = {
            value: nutrient.amount || 0,
            unit: nutrient.unitName || nutrient.nutrient?.unitName || ''
          };
        }
      });
    }
    
    return { labelNutrients, detailedNutrients };
  };

  // Create standardized labelNutrients format from Food feed's foodNutrients array
  const createStandardizedNutrients = (foodNutrients) => {
    const standardized = {};
    
    // Map Food feed nutrient numbers to labelNutrients format
    const nutrientMap = {
      '208': { key: 'calories', transform: (val) => ({ value: Math.round(val) }) }, // Energy (KCAL)
      '203': { key: 'protein', transform: (val) => ({ value: Math.round(val * 10) / 10 }) }, // Protein
      '204': { key: 'fat', transform: (val) => ({ value: Math.round(val * 10) / 10 }) }, // Total lipid (fat)
      '205': { key: 'carbohydrates', transform: (val) => ({ value: Math.round(val * 10) / 10 }) }, // Carbohydrate
      '291': { key: 'fiber', transform: (val) => ({ value: Math.round(val * 10) / 10 }) }, // Fiber
      '269': { key: 'sugars', transform: (val) => ({ value: Math.round(val * 10) / 10 }) }, // Total Sugars
      '606': { key: 'saturatedFat', transform: (val) => ({ value: Math.round(val * 100) / 100 }) }, // Saturated Fat
      '605': { key: 'transFat', transform: (val) => ({ value: Math.round(val * 100) / 100 }) }, // Trans Fat
      '601': { key: 'cholesterol', transform: (val) => ({ value: Math.round(val) }) }, // Cholesterol
      '307': { key: 'sodium', transform: (val) => ({ value: Math.round(val) }) }, // Sodium
      '301': { key: 'calcium', transform: (val) => ({ value: Math.round(val) }) }, // Calcium
      '303': { key: 'iron', transform: (val) => ({ value: Math.round(val * 10) / 10 }) } // Iron
    };
    
    foodNutrients.forEach(nutrient => {
      const number = nutrient.number;
      const mapping = nutrientMap[number];
      
      if (mapping && nutrient.amount > 0) {
        standardized[mapping.key] = mapping.transform(nutrient.amount);
      }
    });
    
    return standardized;
  };

  // Create FDA-style Nutrition Facts label using actual API data
  const createNutritionLabel = (foodData, nutritionData, ingredients) => {
    const { labelNutrients } = nutritionData;
    const parts = [];
    
    // Nutrition Facts Header
    parts.push("Nutrition Facts");
    
    // Product and serving info
    const productInfo = [];
    if (foodData.brandOwner) productInfo.push(foodData.brandOwner);
    if (foodData.brandName) productInfo.push(foodData.brandName);
    if (foodData.description) productInfo.push(foodData.description);
    
    if (productInfo.length > 0) {
      parts.push(productInfo.join(' '));
    }
    
    // Serving size (USDA feed has specific serving sizes, Food feed is per 100g)
    if (foodData.servingSize && foodData.servingSizeUnit) {
      parts.push(`Serving Size ${foodData.servingSize}${foodData.servingSizeUnit}`);
      if (foodData.householdServingFullText) {
        parts.push(`(${foodData.householdServingFullText})`);
      }
    } else {
      // Food feed data is per 100g by default
      parts.push("Serving Size 100g");
      parts.push("(per 100 grams)");
    }
    
    parts.push(""); // Separator
    parts.push("Amount Per Serving");
    parts.push(""); // Separator
    
    // Calories (prominent display)
    if (labelNutrients.calories) {
      parts.push(`Calories ${labelNutrients.calories.value}`);
      parts.push(""); // Separator
    }
    
    // % Daily Value header  
    parts.push("% Daily Value*");
    parts.push(""); // Separator
    
    // Nutrition facts in FDA order using actual values
    const nutritionItems = [
      { key: 'fat', label: 'Total Fat', unit: 'g', dv: 65 },
      { key: 'saturatedFat', label: '  Saturated Fat', unit: 'g', dv: 20 },
      { key: 'transFat', label: '  Trans Fat', unit: 'g', dv: null },
      { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', dv: 300 },
      { key: 'sodium', label: 'Sodium', unit: 'mg', dv: 2300 },
      { key: 'carbohydrates', label: 'Total Carbohydrate', unit: 'g', dv: 300 },
      { key: 'fiber', label: '  Dietary Fiber', unit: 'g', dv: 25 },
      { key: 'sugars', label: '  Total Sugars', unit: 'g', dv: null },
      { key: 'protein', label: 'Protein', unit: 'g', dv: 50 },
      { key: 'calcium', label: 'Calcium', unit: 'mg', dv: 1300 },
      { key: 'iron', label: 'Iron', unit: 'mg', dv: 18 }
    ];
    
    nutritionItems.forEach(item => {
      const nutrientData = labelNutrients[item.key];
      if (nutrientData && nutrientData.value !== undefined) {
        const value = nutrientData.value;
        
        // Format nutrient name and value (left side)
        const leftSide = `${item.label} ${value}${item.unit}`;
        
        // Calculate % Daily Value (right side)
        let rightSide = '';
        if (item.dv && value > 0) {
          const percent = Math.round((value / item.dv) * 100);
          rightSide = `${percent}%`;
        }
        
        // Create properly formatted line - the CSS will handle the spacing
        const line = rightSide ? `${leftSide}|${rightSide}` : leftSide;
        parts.push(line);
      }
    });
    
    parts.push(""); // Separator
    parts.push("*The % Daily Value (DV) tells you how much a");
    parts.push("nutrient in a serving of food contributes to a");
    parts.push("daily diet. 2,000 calories a day is used for");
    parts.push("general nutrition advice.");
    
    // Ingredients section
    if (ingredients && ingredients !== "No ingredients listed") {
      parts.push(""); // Separator
      parts.push("INGREDIENTS:");
      
      // Word wrap ingredients for better display
      const maxLineLength = 45;
      const words = ingredients.split(' ');
      let currentLine = '';
      
      words.forEach(word => {
        if (currentLine.length + word.length + 1 > maxLineLength) {
          if (currentLine) parts.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });
      
      if (currentLine.trim()) {
        parts.push(currentLine.trim());
      }
    }
    
    return parts.join('\n');
  };

  // Helper function to extract filename without extension and add spaces to camelCase
  const formatFileName = (url) => {
    if (!url) return 'Unknown';
    
    // Extract filename from URL
    const filename = url.split('/').pop().split('?')[0]; // Remove query params
    
    // Remove file extension
    const nameWithoutExtension = filename.replace(/\.[^/.]+$/, '');
    
    // Add spaces before camelCase letters
    const spacedName = nameWithoutExtension.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    return spacedName;
  };

  const handlePlayPause = () => {
    setUserHasInteracted(true); // Mark that user has interacted
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };


  const play = async () => {
    if (currentMedia) {
      if (isImageFile(currentMedia.url)) {
        playImage();
        setIsPlaying(true);
      } else if (isPageFile(currentMedia)) {
        playPage();
        setIsPlaying(true);
      } else if (isVideoFile(currentMedia.url) && videoRef.current) {
        try {
          videoRef.current.muted = isMute; // Ensure video is muted if isMute is true
          // Restore poster when playing (will be hidden during playback)
          if (!videoRef.current.poster) {
            videoRef.current.poster = getAssetPath('src/assets/images/intro-a.jpg');
          }
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Can't play video", error);
          handleNext();
          return;
        }
      }
    }
  };

  const pause = useCallback(() => {
    if (currentMedia) {
      if (isImageFile(currentMedia.url)) {
        pauseImage();
      } else if (isPageFile(currentMedia)) {
        pausePage();
      } else if (isVideoFile(currentMedia.url) && videoRef.current) {
        videoRef.current.pause();
      }
    }
    setIsPlaying(false);
  }, [currentMedia]);

  const stop = () => {
    if (currentMedia && isImageFile(currentMedia.url)) {
      clearTimeout(imageTimerRef.current);
      setImageElapsed(0);
    } else if (currentMedia && isPageFile(currentMedia)) {
      clearTimeout(pageTimerRef.current);
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setCurrentTimeSec(0);
    setCurrentTime([0, 0]);
    setIsPlaying(false);
  };

  const playImage = () => {
    clearTimeout(imageTimerRef.current);
    // Only auto-advance if user has interacted with the player
    if (userHasInteracted) {
      const timer = setTimeout(() => {
        handleNext();
      }, (imageDuration - imageElapsed) * 1000);
      imageTimerRef.current = timer;
    }
  };

  const pauseImage = () => {
    clearTimeout(imageTimerRef.current);
  };

  // Page timer functions
  const playPage = () => {
    pageTimerRef.current = setTimeout(() => {
      if (selectedMediaList.length > 1) {
        handleNext(); // Auto-advance to next scene after 10 seconds
      } else {
        setIsPlaying(false); // Stop if it's the last scene
      }
    }, pageDuration * 1000);
  };

  const pausePage = () => {
    clearTimeout(pageTimerRef.current);
  };

  const handleNext = useCallback(() => {
    setCurrentMediaIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % selectedMediaList.length;
      
      // If we're in pause mode and moving to a new scene, show the first frame for videos
      if (!isPlaying && selectedMediaList[nextIndex]) {
        const newMedia = selectedMediaList[nextIndex];
        if (isVideoFile(newMedia.url)) {
          setTimeout(showVideoPreviewFrame, 100);
        }
      }
      
      return nextIndex;
    });
  }, [selectedMediaList.length, isPlaying, selectedMediaList, showVideoPreviewFrame]);

  const handlePrev = useCallback(() => {
    setCurrentMediaIndex((prevIndex) => {
      const nextIndex = (prevIndex - 1 + selectedMediaList.length) % selectedMediaList.length;
      
      // If we're in pause mode and moving to a new scene, show the first frame for videos
      if (!isPlaying && selectedMediaList[nextIndex]) {
        const newMedia = selectedMediaList[nextIndex];
        if (isVideoFile(newMedia.url)) {
          setTimeout(showVideoPreviewFrame, 100);
        }
      }
      
      return nextIndex;
    });
  }, [selectedMediaList.length, isPlaying, selectedMediaList, showVideoPreviewFrame]);

  const handleProgressBarClick = (event) => {
    const progressBar = event.currentTarget; // The clicked progress bar element
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left; // Click position relative to the progress bar
    const progressWidth = rect.width;
    const clickRatio = clickX / progressWidth; // Ratio of click position to the total width
    const totalSlides =
      selectedMediaList.length < 7 ? selectedMediaList.length : 7;
    const targetSlide = Math.floor(clickRatio * totalSlides);
    moveToSlide(targetSlide);
  };

  const moveToSlide = useCallback((index) => {
    setCurrentMediaIndex(() => {
      return index;
    });
    
    // If we're in pause mode and moving to a new scene, show the frame at 2 seconds for videos
    if (!isPlaying && selectedMediaList[index]) {
      const newMedia = selectedMediaList[index];
      if (isVideoFile(newMedia.url)) {
        // Use setTimeout to ensure the video element is updated first
        setTimeout(showVideoPreviewFrame, 100);
      }
    }
  }, [isPlaying, selectedMediaList, showVideoPreviewFrame]);

  const handleVideoRange = () => {
    if (currentMedia && isVideoFile(currentMedia.url) && videoRef.current) {
      videoRef.current.currentTime = videoRangeRef.current.value;
      setCurrentTimeSec(videoRangeRef.current.value);
    }
  };

  const toggleFullScreen = () => {
    // Call the function passed from the parent
    handleFullScreen();
  };

  const handleVolumeRange = () => {
    if (volumeRangeRef.current) {
      let volume = volumeRangeRef.current.value;
      if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.muted = volume === "0";
      }
      setCurrentVolume(volume);
      setIsMute(volume === "0");
    }
  };

  const handleMute = () => {
    setIsMute(!isMute);
    if (videoRef.current) {
      videoRef.current.muted = !isMute;
    }
  };

  const handleExpand = () => {
    if (isPlaying) {
      pause();
    }
    setIsExpanded(true);
  };

  const handleReduce = () => {
    if (!isPlaying) {
      play();
    }
    setIsExpanded(false);
  };

  const toggleText = () => {
    isExpanded ? handleReduce() : handleExpand();
  };

  const handleMouseLeave = () => {
    if (isExpanded && !isPlaying) {
      play();
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    let interval;
    if (
      isPlaying &&
      currentMedia &&
      isVideoFile(currentMedia.url) &&
      videoRef.current
    ) {
      interval = setInterval(() => {
        const { min, sec } = formatTime(videoRef.current.currentTime);
        setCurrentTimeSec(videoRef.current.currentTime);
        setCurrentTime([min, sec]);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentMedia]);

  useEffect(() => {
    const handleLoadedData = () => {
      if (videoRef.current) {
        setDurationSec(videoRef.current.duration);
        const { min, sec } = formatTime(videoRef.current.duration);
        setDuration([min, sec]);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Only auto-advance if user has interacted with the player
      if (userHasInteracted) {
        handleNext();
      }
    };

    if (currentMedia) {
      if (isVideoFile(currentMedia.url) && videoRef.current) {
        videoRef.current.addEventListener("loadeddata", handleLoadedData);
        videoRef.current.addEventListener("ended", handleEnded);
        videoRef.current.muted = isMute;
      }
    }

    return () => {
      clearTimeout(imageTimerRef.current);
      if (videoRef.current) {
        videoRef.current.removeEventListener("loadeddata", handleLoadedData);
        videoRef.current.removeEventListener("ended", handleEnded);
      }
    };
  }, [currentMedia, handleNext, isMute]);

  useEffect(() => {
    if (selectedMediaList.length > 0) {
      setCurrentMedia(selectedMediaList[currentMediaIndex]);
    }
  }, [currentMediaIndex, mediaList, setCurrentMedia]);

  useEffect(() => {
    if (selectedMediaList.length > 0 && !currentMedia) {
      setCurrentMediaIndex(0);
      setCurrentMedia(selectedMediaList[0]);
    }
  }, [selectedMediaList, currentMedia, setCurrentMedia]);

  useEffect(() => {
    let lastUrl = window.location.hash;

    const handleURLChange = () => {
      const currentURL = window.location.hash;
      if (currentURL.includes("swiper") && isPlaying) pause();
      lastUrl = currentURL;
    };

    // Check for URL changes
    const interval = setInterval(() => {
      if (window.location.hash !== lastUrl) {
        handleURLChange();
      }
    }, 100);

    // Also listen for popstate
    window.addEventListener("popstate", handleURLChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("popstate", handleURLChange);
    };
  }, [isPlaying, pause]);

  useEffect(() => {
    setCurrentTimeSec(0);
    setCurrentTime([0, 0]);
    setImageElapsed(0);
    setIsPlaying(false);

    // Don't autoplay - wait for user interaction
    // if (currentMedia && autoplay) {
    //   play();
    // }
  }, [currentMedia, currentMediaIndex, autoplay, listofMedia, mediaList]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
      );
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange
      );
    };
  }, [setIsFullScreen]);

  useEffect(() => {
    const recalcImageScale = () => {
      if (imageRef.current && containerRef.current) {
        const image = imageRef.current;
        const container = containerRef.current;
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scaleWidth = containerWidth / naturalWidth;
        const scaleHeight = containerHeight / naturalHeight;
        const scaleFactor = Math.max(scaleWidth, scaleHeight);
        const scaledWidth = naturalWidth * scaleFactor;
        const scaledHeight = naturalHeight * scaleFactor;
        image.style.width = `${scaledWidth}px`;
        image.style.height = `${scaledHeight}px`;
        const extraWidth = scaledWidth - containerWidth;
        image.style.marginLeft = extraWidth ? `-${extraWidth / 2}px` : "0";
        image.style.marginTop = "0";
        const extraHeight = scaledHeight - containerHeight;
        if (extraHeight > 0) {
          image.style.setProperty("--pan-distance", `${extraHeight}px`);
          image.classList.add("pan-vertical");
        } else {
          image.classList.remove("pan-vertical");
        }
      }
    };
    window.addEventListener("resize", recalcImageScale);
    window.addEventListener("fullscreenchange", recalcImageScale);

    return () => {
      window.removeEventListener("resize", recalcImageScale);
      window.removeEventListener("fullscreenchange", recalcImageScale);
    };
  }, []);

  // Defensive hash handling: set hash to first feed if missing
  useEffect(() => {
    if (mediaList && mediaList.length > 0) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (!hashParams.has("list")) {
        const defaultListName = mediaList[0]?.list || "seeclickfix-311";
        hashParams.set("list", defaultListName);
        window.location.hash = `#${hashParams.toString()}`;
      }
    }
  }, [mediaList]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sceneDisplayTimeout) {
        clearTimeout(sceneDisplayTimeout);
      }
    };
  }, [sceneDisplayTimeout]);

  // Handle reopening dropdown from 3-dot menu
  useEffect(() => {
    if (selectedOption === "feeds") {
      setShowFeedsDropdown(true);
      setSelectedOption(""); // Reset selected option
    }
  }, [selectedOption, setSelectedOption]);

  // Handle keyboard events - defined after all other functions
  const handleKeyDown = useCallback((event) => {
    // Only handle keyboard events when the video player is hovered
    if (!isHovered) return;
    
    switch (event.key) {
      case ' ': // Spacebar
      case 'Spacebar':
        event.preventDefault();
        handlePlayPause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        // Pause if playing, then move to previous scene
        if (isPlaying) {
          pause();
        }
        handlePrev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        // Pause if playing, then move to next scene
        if (isPlaying) {
          pause();
        }
        handleNext();
        break;
    }
  }, [isHovered, isPlaying, pause, handlePrev, handleNext, handlePlayPause]);

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className={`FeedPlayer ${isFullScreen ? "fullscreen" : ""}`}
      ref={containerRef}
      data-testid="feed-player-root"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0} // Make div focusable for keyboard events
    >
      {/* Close View Page Button - positioned to left of popup-btn */}
      {isViewPageMode && (
        <button
          className="FeedPlayer__close-view-page"
          onClick={exitViewPageMode}
          title="Close page view"
        >
          ×
        </button>
      )}
      
      <div
        className="FeedPlayer__video-container"
        onMouseLeave={handleMouseLeave}
      >
        {isLoading ? (
          <div className="FeedPlayer__loading">
            <div className="spinner"></div>
            <p>Loading media...</p>
          </div>
        ) : currentMedia && currentMedia.isError ? (
          <div
            className="FeedPlayer__error"
            style={{ background: "none", padding: 0 }}
          >
            <img
              src={getAssetPath('src/assets/images/intro-landscape.jpg')}
              alt="Error Placeholder"
              className="placeholder-image"
              style={{ display: "block", width: "100%", height: "auto" }} // Ensure the image takes full space
            />
          </div>
        ) : currentDisplayMode !== "media" ? (
          <div className={`FeedPlayer__display-mode-content display-mode--${currentDisplayMode}`}>
            {currentDisplayMode === "full" && (
              <div className="display-full">
                <div id="layoutTitle">
                  Full View
                  <button 
                    className="display-close-btn" 
                    onClick={() => setCurrentDisplayMode("media")}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                <p>Full scene view with detailed information</p>
                {/* This would show expanded scene details */}
              </div>
            )}
            {currentDisplayMode === "columns" && (
              <div className="display-columns">
                <div id="layoutTitle">
                  Columns View
                  <button 
                    className="display-close-btn" 
                    onClick={() => setCurrentDisplayMode("media")}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="columns-grid">
                  {selectedMediaList.slice(0, 6).map((item, index) => (
                    <div key={index} className="column-item clickable-item" onClick={() => handleFeedItemClick(index)}>
                      <div className="column-thumbnail">
                        {isImageFile(item.url) && <img src={item.url} alt={item.title} />}
                        {isVideoFile(item.url) && (
                          <div className="video-placeholder">
                            <span className="video-filename">{formatFileName(item.url)}</span>
                          </div>
                        )}
                      </div>
                      <span>{item.title || `Scene ${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {currentDisplayMode === "table" && (
              <div className="display-table">
                <div id="layoutTitle">
                  Table View
                  <button 
                    className="display-close-btn" 
                    onClick={() => setCurrentDisplayMode("media")}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMediaList.slice(0, 8).map((item, index) => (
                      <tr key={index} className="clickable-row" onClick={() => handleFeedItemClick(index)}>
                        <td>{index + 1}</td>
                        <td>{item.title || `Scene ${index + 1}`}</td>
                        <td>{isImageFile(item.url) ? "Image" : isVideoFile(item.url) ? "Video" : "Page"}</td>
                        <td>{isPageFile(item) ? "10s" : isImageFile(item.url) ? "4s" : "Video"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {currentDisplayMode === "list" && (
              <div className="display-list">
                <div id="layoutTitle">
                  List View
                  <button 
                    className="display-close-btn" 
                    onClick={() => setCurrentDisplayMode("media")}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                <ul className="scene-list">
                  {selectedMediaList.map((item, index) => (
                    <li key={index} className="scene-list-item clickable-item" onClick={() => handleFeedItemClick(index)}>
                      <span className="scene-number">{index + 1}</span>
                      <span className="scene-title">{item.title || `Scene ${index + 1}`}</span>
                      <span className="scene-type">{isImageFile(item.url) ? "IMG" : isVideoFile(item.url) ? "VID" : "PAGE"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {currentDisplayMode === "gallery" && (
              <div className="display-gallery">
                <div id="layoutTitle">
                  Gallery View
                  <button 
                    className="display-close-btn" 
                    onClick={() => setCurrentDisplayMode("media")}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="gallery-grid">
                  {selectedMediaList.slice(0, 12).map((item, index) => (
                    <div key={index} className="gallery-item" onClick={() => handleFeedItemClick(index)}>
                      <div className="gallery-thumbnail">
                        {isImageFile(item.url) && <img src={item.url} alt={item.title} />}
                        {isVideoFile(item.url) && (
                          <div className="video-placeholder">
                            <span className="video-filename">{formatFileName(item.url)}</span>
                          </div>
                        )}
                        {isPageFile(item) && <div className="page-placeholder">📄</div>}
                      </div>
                      <span className="gallery-label">{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : currentMedia ? (
          isPageFile(currentMedia) ? (
            <PageDisplay
              pageContent={pageContent}
              isFullScreen={isFullScreen}
            />
          ) : isTextOnlyFeed(currentMedia) ? (
            <div className="FeedPlayer__text-only-slide">
              <img
                src={getAssetPath('src/assets/images/intro-landscape.jpg')}
                alt="Food Background"
                className="text-only-background"
                style={{ 
                  display: "block", 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: 0.3 // Make background subtle so text is readable
                }}
                onError={(e) => {
                  console.warn('Background image failed to load:', e.target.src);
                }}
              />
              <div className="text-only-overlay">
                <div className="text-only-content">
                  <h2>{currentMedia.title}</h2>
                  <div className="text-only-body">
                    {currentMedia.text && currentMedia.text.split('\n').map((line, index) => {
                      // Handle pipe-separated nutrient lines (nutrient|percentage)
                      if (line.includes('|')) {
                        const [nutrient, percent] = line.split('|');
                        return (
                          <p key={index} className="nutrient-line">
                            <span className="nutrient-name">{nutrient}</span>
                            <span className="nutrient-percent">{percent}</span>
                          </p>
                        );
                      }
                      return <p key={index}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : currentMedia.url && isImageFile(currentMedia.url) ? (
            <img
              ref={imageRef}
              className="video-image image-file"
              src={currentMedia.url}
              alt={currentMedia.title || "Media"}
              onError={(e) => {
                console.warn("Image failed to load:", currentMedia.url);
                // Set a fallback image instead of crashing
                e.target.src = getAssetPath('src/assets/images/intro-landscape.jpg');
              }}
              onLoad={() => {
                if (imageRef.current && containerRef.current) {
                  const image = imageRef.current;
                  const container = containerRef.current;
                  const { width: containerWidth, height: containerHeight } =
                    container.getBoundingClientRect();
                  const { naturalWidth, naturalHeight } = image;
                  const scaleFactor = Math.max(
                    containerWidth / naturalWidth,
                    containerHeight / naturalHeight
                  );
                  const scaledWidth = naturalWidth * scaleFactor;
                  const scaledHeight = naturalHeight * scaleFactor;

                  image.style.width = `${scaledWidth}px`;
                  image.style.height = `${scaledHeight}px`;
                  const overflow = scaledHeight - containerHeight;
                  if (overflow > 0) {
                    image.style.setProperty("--pan-distance", `${overflow}px`);
                    image.classList.add("pan-vertical");
                  } else {
                    image.classList.remove("pan-vertical");
                  }
                }
              }}
            />
          ) : isVideoFile(currentMedia.url) ? (
            <div className="video-wrapper">
              <video
                ref={videoRef}
                className="video-image video-file"
                src={currentMedia.url}
                poster={getAssetPath('src/assets/images/intro-a.jpg')}
                muted={isMute}
                onClick={handlePlayPause}
              ></video>
              {!isPlaying && (
                <button
                  className="play-button"
                  onClick={handlePlayPause}
                  aria-label="Play Video"
                >
                  <FaPlay size={30} />
                </button>
              )}

              {isPlaying && (
                <button
                  className="play-button"
                  onClick={handlePlayPause}
                  aria-label="Pause Video"
                >
                  <FaPause size={30} />
                </button>
              )}
            </div>
          ) : (
            <div
              className="FeedPlayer__unsupported-media"
              style={{ background: "none", padding: 0 }}
            >
              <img
                src={getAssetPath('src/assets/images/intro-landscape.jpg')}
                alt="Error Placeholder"
                className="placeholder-image"
                style={{ 
                  display: "block", 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover",
                  position: "absolute",
                  top: 0,
                  left: 0
                }}
              />
              <div className="unsupported-media-message">
                Unsupported Media Type
              </div>
            </div>
          )
        ) : (
          <div className="FeedPlayer__no-media">
            <img
              src={getAssetPath('src/assets/images/intro-a.jpg')}
              alt="Feed Player Placeholder"
              className="placeholder-image"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
        )}
        {selectedMediaList.length > 1 && (
          <div
            className="FeedPlayer__progress-bg"
            onClick={(event) => handleProgressBarClick(event)}
            style={{ bottom: isFullScreen ? "12px" : 0 }}
          >
            <div
              className="FeedPlayer__progress"
              style={{
                width:
                  selectedMediaList.length > 0
                    ? `${
                        ((currentMediaIndex + 1) /
                          (selectedMediaList.length < 7
                            ? selectedMediaList.length
                            : 7)) *
                        100
                      }%`
                    : "0%",
              }}
            ></div>
            {selectedMediaList.slice(0, 7).map(
              (item, index) =>
                index >= 0 && (
                  <div
                    key={index}
                    className="FeedPlayer__progress-point"
                    style={{
                      left: `${
                        ((index + 1) /
                          (selectedMediaList.length < 7
                            ? selectedMediaList.length
                            : 7)) *
                        99.75
                      }%`,
                    }}
                    title={`Move to scene ${index + 1}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the progress bar click handler from triggering
                      moveToSlide(index);
                    }}
                  ></div>
                )
            )}
          </div>
        )}
        {!isLoading && currentMedia && (
          <div
            className={`FeedPlayer__overlay ${
              isExpanded ? "expanded-overlay" : ""
            }`}
          >
            <div className="FeedPlayer__info">
              <h2>
                {currentMedia.title || "Untitled"}{" "}
                <span onClick={toggleText} className="toggle-text">
                  {isExpanded ? (
                    <FaChevronDown title="Reduce" size={20} />
                  ) : (
                    <FaChevronUp title="Expand" size={20} />
                  )}
                </span>
              </h2>
              <p className={isExpanded ? "expanded" : "collapsed"}>
                {currentMedia.text || "No description available"}
              </p>
            </div>
          </div>
        )}
        {selectedOption === "url" && (
          <Popup {...{ setVideoData, setSelectedOption }} />
        )}
        {showFeedsDropdown && !isViewPageMode && (
          <div className="FeedPlayer__dropdown FeedPlayer__dropdown--upper-left">
            <div className="FeedPlayer__dropdown-header">
              <div
                className="FeedPlayer__select"
                onClick={() => setIsDropdownActive(!isDropdownActive)}
              >
                <span>
                  {mediaList && mediaList[index]
                    ? mediaList[index].title
                    : "Select Media"}
                </span>
                <div className="FeedPlayer__caret"></div>
              </div>
              {/* Scene Indicator - positioned after FeedPlayer__select */}
              {playerHashFromCache && showSceneIndicator && (
                <div className="FeedPlayer__scene-indicator">
                  Scene {currentMediaIndex + 1}
                </div>
              )}
            </div>
            {isDropdownActive && (
              <ul className="FeedPlayer__menu active">
              {mediaList &&
                mediaList.map((media, idx) => (
                  <li
                    key={idx}
                    className={`${currentMediaIndex === idx ? "active" : ""} ${
                      loadedFeeds.includes(media.list.trim().toLowerCase())
                        ? ""
                        : "loading"
                    }`}
                    onClick={() => {
                      const loadMediaAndShowFirstFrame = (mediaList, firstMedia) => {
                        // Show first frame for videos in pause mode
                        if (!isPlaying && firstMedia && isVideoFile(firstMedia.url)) {
                          setTimeout(() => {
                            if (videoRef.current) {
                              videoRef.current.poster = ""; // Remove poster to show video frame
                              videoRef.current.currentTime = 2; // Go to 2 seconds in to avoid fade-in from black
                              videoRef.current.load();
                            }
                          }, 100);
                        }
                      };
                      
                      if (
                        loadedFeeds.includes(media.list.trim().toLowerCase())
                      ) {
                        setIndex(idx);
                        setIsDropdownActive(false);
                        setCurrentMediaIndex(0);
                        setSelectedMediaList(listofMedia[media.title]);
                        setCurrentMedia(listofMedia[media.title][0]);
                        updateURLHash(media.list, 0); // Update hash
                        loadMediaAndShowFirstFrame(listofMedia[media.title], listofMedia[media.title][0]);
                      } else {
                        loadFeed(media, listofMedia).then(() => {
                          setIndex(idx);
                          setIsDropdownActive(false);
                          setCurrentMediaIndex(0);
                          setSelectedMediaList(listofMedia[media.title]);
                          setCurrentMedia(listofMedia[media.title][0]);
                          updateURLHash(media.list, 0); // Update hash after loading
                          loadMediaAndShowFirstFrame(listofMedia[media.title], listofMedia[media.title][0]);
                          console.log(`%c✅ Successfully loaded list '${media.list}' from dropdown with ${listofMedia[media.title]?.length || 0} items`, 'color: green; font-weight: bold');
                        });
                      }
                    }}
                  >
                    {media.title || media.list}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Display Modes Popup */}
        {showDisplayModesPopup && (
          <div className="FeedPlayer__display-modes-popup">
            <div className="display-modes-header">
              <span>Display Modes</span>
              <button 
                className="popup-close"
                onClick={() => setShowDisplayModesPopup(false)}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="display-modes-grid">
              {displayModes.map((mode) => (
                <button
                  key={mode.key}
                  className={`display-mode-btn ${currentDisplayMode === mode.key ? "active" : ""}`}
                  onClick={() => {
                    setCurrentDisplayMode(mode.key);
                    setShowDisplayModesPopup(false);
                    setShowControlsMenu(false);
                    setIsDropdownActive(false);
                  }}
                  title={mode.label}
                >
                  <i className={mode.icon}></i>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* MemberSense overlay */}
        {showMemberSenseOverlay && (
          <div
            className={`membersense-overlay ${isNarrowScreen ? 'narrow-screen' : ''} ${
              !showRightColumn ? 'single-column' : ''
            } ${isLeftPanelExpanded ? 'expanded-overlay' : ''}`}
          >
            <div className="membersense-left-column">
              {/* Error message positioned at bottom of left column - only on wide screens */}
              {memberSenseProps.error && !isNarrowScreen && (
                <div className="membersense-error-container">
                  <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <p>{memberSenseProps.error}</p>
                  </div>
                </div>
              )}
              
              {/* Left column content - show Discord content if view is selected, otherwise show default */}
              <div className="membersense-left-content">
                {!isNarrowScreen && !isLeftPanelExpanded && (
                  <button
                    className="membersense-expand-toggle"
                    onClick={() => {
                      setIsLeftPanelExpanded(true);
                      setShowRightColumn(true);
                    }}
                    title="Expand overlay"
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>
                )}

                <div className="membersense-content-box">
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎬</div>
                  <p>Ready for Action</p>
                  <p style={{ fontSize: '12px', marginTop: '10px' }}>
                    {(() => {
                      const hash = window.location.hash.substring(1);
                      const params = new URLSearchParams(hash);
                      const listName = params.get('list');
                      return listName || 'No list selected';
                    })()}
                  </p>
                  {memberSenseProps.sidePanelView && (
                    <p style={{ fontSize: '12px', marginTop: '15px', fontStyle: 'italic' }}>
                      {memberSenseProps.sidePanelView === "Showcase" ? "Members displayed in right panel" : 
                       memberSenseProps.sidePanelView === "DiscordViewer" ? "Posts displayed in right panel" : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {showRightColumn && (
              <div className="membersense-right-column">
              
              {/* Validation message for narrow screens - positioned at top of right column */}
              {memberSenseProps.error && isNarrowScreen && (
                <div className="membersense-narrow-validation">
                  <div className="validation-message error">
                    <div className="error-icon">⚠️</div>
                    <p>{memberSenseProps.error}</p>
                  </div>
                </div>
              )}
              
              {/* Main MemberSense content */}
              <div className="membersense-overlay-content">
                <div className="membersense-overlay-header">
                  <button
                    type="button"
                    className="membersense-panel-close"
                    onClick={() => {
                      if (memberSenseProps.sidePanelView && memberSenseProps.setSidePanelView) {
                        memberSenseProps.setSidePanelView(null);
                      } else {
                        setShowMemberSenseOverlay(false);
                      }
                    }}
                    title={memberSenseProps.sidePanelView ? "Close panel and return to video" : "Close overlay"}
                  >
                    ×
                  </button>
                  {memberSenseProps.sidePanelView ? (
                    <button
                      type="button"
                      className="membersense-server-link"
                      onClick={() => {
                        if (memberSenseProps.setSidePanelView) {
                          memberSenseProps.setSidePanelView(null);
                        }
                      }}
                      title="Return to Discord group"
                    >
                      {memberSenseProps.serverInfo?.iconURL && (
                        <img
                          src={memberSenseProps.serverInfo.iconURL}
                          alt={memberSenseProps.serverInfo?.serverName || "Discord Server"}
                        />
                      )}
                      <span>{memberSenseProps.serverInfo?.serverName || "Discord Group"}</span>
                    </button>
                  ) : (
                    <span className="membersense-header-title">
                      {memberSenseProps.serverInfo?.serverName || "Discord Group"}
                    </span>
                  )}

                  <button
            className="expand-overlay-btn"
            onClick={toggleFullScreen}
          >
            <i
              className={`ri-${
                isFullScreen ? "fullscreen-exit" : "fullscreen"
              }-line`}
            ></i>
          </button>
                </div>
                
                {/* Show Discord content in right column when sidePanelView is active */}
                {memberSenseProps.sidePanelView === "Showcase" ? (
                  <div className="discord-content-wrapper">
                    <MemberShowcase 
                      token={memberSenseProps.initialToken} 
                      members={memberSenseProps.members || []} 
                      isLoading={memberSenseProps.isLoading} 
                      isFullScreen={false}
                    />
                  </div>
                ) : memberSenseProps.sidePanelView === "DiscordViewer" ? (
                  <div className="discord-content-wrapper">
                    <DiscordChannelViewer
                      channels={memberSenseProps.channels || []}
                      messages={memberSenseProps.messages || []}
                      selectedChannel={memberSenseProps.selectedChannel}
                      onChannelSelect={memberSenseProps.setSelectedChannel}
                      isLoading={memberSenseProps.isLoading}
                      isFullScreen={false}
                    />
                  </div>
                ) : (
                  <div className="member-sense-wrapper">
                    <MemberSense
                      onValidToken={memberSenseProps.onValidToken}
                      onLogout={memberSenseProps.onLogout}
                      initialToken={memberSenseProps.initialToken}
                      isLoading={memberSenseProps.isLoading}
                      error={memberSenseProps.error}
                      isLoggedIn={memberSenseProps.isLoggedIn}
                      isLoggingOut={memberSenseProps.isLoggingOut}
                      serverInfo={memberSenseProps.serverInfo}
                      isFullScreen={false}
                      useMockData={memberSenseProps.useMockData}
                      onToggleMockData={memberSenseProps.onToggleMockData}
                      handleViewChange={memberSenseProps.handleViewChange}
                    />
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}
      </div>
      <div className="FeedPlayer__controls">
        <div className="control-group control-group-btn">
          <button className="control-button prev" onClick={handlePrev}>
            <i className="ri-skip-back-fill icon"></i>
          </button>
          <button
            className="control-button play-pause"
            onClick={handlePlayPause}
          >
            <i className={`ri-${isPlaying ? "pause" : "play"}-fill icon`}></i>
          </button>
          <button className="control-button next" onClick={handleNext}>
            <i className="ri-skip-forward-fill icon"></i>
          </button>
          <button className="control-button stop" onClick={stop}>
            <i className="ri-stop-fill icon"></i>
          </button>
        </div>
        <div className="control-group control-group-slider">
          {currentMedia && isVideoFile(currentMedia.url) && (
            <>
              <input
                type="range"
                className="range-input"
                ref={videoRangeRef}
                onChange={handleVideoRange}
                max={durationSec}
                value={currentSec}
                min={0}
              />
              <span className="time">
                {currentTime[0]}:{String(currentTime[1]).padStart(2, "0")} /{" "}
                {duration[0]}:{String(duration[1]).padStart(2, "0")}
              </span>
            </>
          )}
        </div>
        <div className="control-group control-group-volume">
          {currentMedia && isVideoFile(currentMedia.url) && (
            <>
              <button className="control-button volume" onClick={handleMute}>
                <i className={`ri-volume-${isMute ? "mute" : "up"}-fill`}></i>
              </button>
              <input
                type="range"
                className="range-input"
                ref={volumeRangeRef}
                max={1}
                min={0}
                value={currentVolume}
                onChange={handleVolumeRange}
                step={0.1}
              />
            </>
          )}
          
          {/* Display Modes Button */}
          <button
            className="control-button display-modes"
            onClick={() => {
              setShowDisplayModesPopup(!showDisplayModesPopup)
              setShowControlsMenu(false);
              setIsDropdownActive(false);
            }}
            title="Display Modes"
          >
            <i className="ri-layout-grid-line"></i>
          </button>
          
          <button
            className="control-button full-screen"
            onClick={toggleFullScreen}
          >
            <i
              className={`ri-${
                isFullScreen ? "fullscreen-exit" : "fullscreen"
              }-line`}
            ></i>
          </button>
          
          {/* Menu Options Button */}
          <button
            className="control-button menu-options"
            onClick={() => setShowControlsMenu(!showControlsMenu)}
            title="More Options"
          >
            <i className="ri-more-line"></i>
          </button>
        </div>
      </div>
      
      {/* Controls Menu - positioned above controls in lower right */}
      {showControlsMenu && (
        <div className="feedplayer-controls-menu">
          <ul className="controls-menu-list">
            <li className="controls-menu-item" onClick={() => {
              setShowControlsMenu(false);
              if (handleMenuClick) handleMenuClick("feeds");
            }}>
              <i className="ri-list-unordered"></i>
              <span>Choose Feeds</span>
            </li>
            <li className="controls-menu-item" onClick={() => {
              setShowControlsMenu(false);
              if (handleMenuClick) handleMenuClick("url");
            }}>
              <i className="ri-link"></i>
              <span>Paste Your Video URL</span>
            </li>
            <li className="controls-menu-item" onClick={() => {
              setShowControlsMenu(false);
                            setCurrentDisplayMode("media");

              if (memberSenseProps.setSidePanelView) {
      memberSenseProps.setSidePanelView(null);
    }
    if (setShowMemberSenseOverlay) {
      setShowMemberSenseOverlay(false);
    }

    // now trigger the existing viewPage effect
    if (setSelectedOption) {
      setSelectedOption("viewPage");
    } else if (handleMenuClick) {
      // if your parent sets selectedOption via this callback
      handleMenuClick("viewPage");
    }

            }}>
              <i className="ri-video-line"></i>
              <span>View Page</span>
            </li>
            <li className="controls-menu-item" onClick={() => {
              setShowControlsMenu(false);
                            if (isViewPageMode) {
      exitViewPageMode();
    } else {
      setSelectedMediaList(prev => {
        const filtered = prev.filter(i => i?.type !== "page");
        if (filtered.length && (currentMedia?.type === "page" || !filtered.includes(currentMedia))) {
          setCurrentMediaIndex(0);
          setCurrentMedia(filtered[0]);
        }
        return filtered;
      });
    }
    setCurrentDisplayMode("media");
    setSelectedOption && setSelectedOption("");
              if (memberSenseProps.setSidePanelView) {
                memberSenseProps.setSidePanelView(null);
              }
             setShowMemberSenseOverlay && setShowMemberSenseOverlay(true);
              if (memberSenseProps.handleViewChange) {
                memberSenseProps.handleViewChange("MemberSense");
              }

            }}>
              <i className="ri-user-line"></i>
              <span>MemberSense</span>
            </li>
            {isFullScreen && (
              <li className="controls-menu-item" onClick={() => {
                setShowControlsMenu(false);
                toggleFullScreen();
              }}>
                <i className="ri-fullscreen-exit-line"></i>
                <span>Exit Fullscreen</span>
              </li>
            )}
            {memberSenseProps.onLogout &&
              (memberSenseProps.isLoggedIn || memberSenseProps.initialToken) && (
              <li className="controls-menu-item logout" onClick={() => {
                setShowControlsMenu(false);
                if (setShowMemberSenseOverlay) {
                  setShowMemberSenseOverlay(false);
                }
                memberSenseProps.onLogout();
              }}>
                <i className="ri-logout-box-r-line"></i>
                <span>Logout</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

FeedPlayer.propTypes = {
  autoplay: PropTypes.bool,
  isFullScreen: PropTypes.bool.isRequired,
  setIsFullScreen: PropTypes.func.isRequired,
  handleFullScreen: PropTypes.func.isRequired,
  selectedOption: PropTypes.string.isRequired,
  setSelectedOption: PropTypes.func.isRequired,
  swiperData: PropTypes.object,
  setSwiperData: PropTypes.func.isRequired,
  playerHashFromCache: PropTypes.bool,
  pageContent: PropTypes.string,
};

export default FeedPlayer;
