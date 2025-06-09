import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Context } from "../../Context/ContextGoogle";
import { formatTime } from "../../utils/formatTime";
import "./VideoPlayer.scss";
import axios from "axios";
import PropTypes from "prop-types";
import { FaChevronUp, FaChevronDown, FaPlay, FaPause } from "react-icons/fa";
import Popup from "../Popup/Popup";

function VideoPlayer({
  autoplay = false,
  isFullScreen,
  setIsFullScreen,
  handleFullScreen,
  selectedOption,
  setSelectedOption,
  swiperData,
  setSwiperData,
}) {
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

  const imageDuration = 4;

  const updateURLHash = (feed, ref) => {
    const existingParams = new URLSearchParams(window.location.hash.substring(1));
    const otherParams = new URLSearchParams(); // string containing all the extra params in the URL

    existingParams.forEach((value, key) => {
      if (key !== "feed" && key !== "ref") {
        otherParams.set(key, value);
      }
    });

    let hash = `#feed=${encodeURIComponent(feed)}&ref=${ref}`;
    if (otherParams.toString()) {
      hash += `&${otherParams.toString()}`;
    }
    window.location.hash = hash;
  };

  const parseHash = () => {
    const hash = window.location.hash.substring(1); // Remove the leading '#'
    const params = new URLSearchParams(hash);
    return {
      feed: params.get("feed") || "",
      ref: parseInt(params.get("ref"), 10) || 0, // Default to 0 if ref is not valid
    };
  };

  useEffect(() => {
    if (currentMedia && selectedMediaList.length > 0)
      updateURLHash(mediaList[index].feed, currentMediaIndex);
  }, [currentMediaIndex, currentMedia, mediaList, index, selectedMediaList.length]);

  useEffect(() => {
    const { feed } = parseHash();

    if (feed) {
      const selectedFeed = mediaList.find((media) => media.feed.trim().toLowerCase() === feed.toLowerCase());
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
    return () => window.removeEventListener("sessionStorageChange", handleStorageChange);
  }, []);

  useEffect(() => {
    const processSwiperData = async () => {
      setIsLoading(true);
      const templistofMedia = {};
      const swiperFeed = mediaList.find((media) => media.feed.trim().toLowerCase() === "swiper");
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
      const linkedVideoFeed = mediaList.find((media) => media.feed.trim().toLowerCase() === "linkedvideo");
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
    const { feed, ref } = parseHash();

    if (feed && ref >= 0) {
      const selectedFeed = mediaList.find((media) => media.feed.trim().toLowerCase() === feed.toLowerCase());

      if (selectedFeed) {
        loadFeed(selectedFeed, listofMedia).then(() => {
          const selectedMedia = listofMedia[selectedFeed.title];
          if (selectedMedia[ref]) {
            setIndex(mediaList.indexOf(selectedFeed));
            setSelectedMediaList(selectedMedia);
            setCurrentMedia(selectedMedia[ref]);
            setCurrentMediaIndex(ref);
          }
        });
      }
    }
  }, [mediaList]);

  useEffect(() => {
    const handleHashChange = () => {
      const { feed, ref } = parseHash();

      if (feed) {
        // Find the feed in mediaList
        const selectedFeed = mediaList.find((media) => media.feed.trim().toLowerCase() === feed.toLowerCase());

        if (selectedFeed) {
          // If the feed is not loaded, load it
          if (!listofMedia[selectedFeed.title]) {
            loadFeed(selectedFeed, listofMedia).then(() => {
              const selectedMedia = listofMedia[selectedFeed.title];
              if (selectedMedia && ref >= 0 && selectedMedia[ref]) {
                setIndex(mediaList.indexOf(selectedFeed));
                setSelectedMediaList(selectedMedia);
                setCurrentMedia(selectedMedia[ref]);
                setCurrentMediaIndex(ref);
              } else {
                console.warn("Invalid ref index in URL hash for the selected feed");
              }
            });
          } else {
            // Feed is already loaded
            const selectedMedia = listofMedia[selectedFeed.title];
            if (selectedMedia && ref >= 0 && selectedMedia[ref]) {
              setIndex(mediaList.indexOf(selectedFeed));
              setSelectedMediaList(selectedMedia);
              setCurrentMedia(selectedMedia[ref]);
              setCurrentMediaIndex(ref);
            } else {
              console.warn("Invalid ref index in URL hash for the selected feed");
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
      if (!hash || !hash.includes("feed=")) {
        processMediaList();
      }
    }
  }, [mediaList]);

  useEffect(() => {
    const { feed } = parseHash();
    if (feed) {
      const selectedFeed = mediaList.find((media) => media.feed.trim().toLowerCase() === feed.toLowerCase());
      if (selectedFeed) setIndex(mediaList.indexOf(selectedFeed)); // Update dropdown selection
    }
  }, [mediaList]);

  const processMediaList = async () => {
    setIsLoading(true);
    const templistofMedia = {};

    // Find the NASA feed
    const nasaFeed = mediaList.find((media) => media.feed.trim().toLowerCase() === "nasa");

    if (nasaFeed) {
      // Load NASA feed first
      await loadFeed(nasaFeed, templistofMedia);
      setLoadedFeeds(["nasa"]);

      // Set initial media
      setListofMedia(templistofMedia);
      setSelectedMediaList(templistofMedia[nasaFeed.title]);
      setCurrentMedia(templistofMedia[nasaFeed.title][0]);
    }

    setIsLoading(false);
  };

  const handleGlobalError = (error, mediaTitle = "Error") => {
    console.error("Global error handler triggered:", error);
    const placeholderMedia = {
      url: "src/assets/images/intro-landscape.jpg", // Placeholder image
      text: error.message || "An unknown error occurred", // Use the specific error message
      title: `Failed to load ${mediaTitle}`, // Display the media title with the error
      isError: true,
    };
    setSelectedMediaList([placeholderMedia]); // Set placeholder as the selected media
    setCurrentMedia(placeholderMedia); // Set placeholder as the current media
  };

  // Wrap the loadFeed function to pass the media title to the global error handler
  const loadFeed = async (media, templistofMedia) => {
    try {
      setLoadingFeeds((prev) => ({ ...prev, [media.title]: true }));
      const mediaItems = await fetchMediaFromAPI(media);
      templistofMedia[media.title] = Array.isArray(mediaItems) ? mediaItems : [mediaItems];
      setLoadedFeeds((prev) => [...prev, media.feed.trim().toLowerCase()]);
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
      setActiveFeed(media.feed.trim().toLowerCase());
      if (media.feed.trim().toLowerCase() === "swiper" && media.url) {
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
      if (media.feed.trim().toLowerCase() === "linkedvideo") {
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
      const response = await axios.get(media.url);
      switch (media.feed.trim().toLowerCase()) {
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
          const repoFeed = mediaList.find((media) => media.feed.trim() === "repo");
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
          return response.data.map((item) => ({
            url: item.hdurl || item.url,
            text: item.explanation || "No description available",
            title: item.title,
          }));
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
    return src && imageExtensions.some((extension) => src.toLowerCase().endsWith(extension));
  };

  const isVideoFile = (src) => {
    if (!src) return false;
    const videoExtensions = [".mp4", ".webm", ".ogg"];
    return src && videoExtensions.some((extension) => src.toLowerCase().endsWith(extension));
  };

  const handlePlayPause = () => {
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
      } else if (isVideoFile(currentMedia.url) && videoRef.current) {
        try {
          videoRef.current.muted = isMute; // Ensure video is muted if isMute is true
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
    const timer = setTimeout(() => {
      handleNext();
    }, (imageDuration - imageElapsed) * 1000);
    imageTimerRef.current = timer;
  };

  const pauseImage = () => {
    clearTimeout(imageTimerRef.current);
  };

  const handleNext = useCallback(() => {
    setCurrentMediaIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % mediaList.length;
      return nextIndex;
    });
  }, [mediaList.length]);

  const handlePrev = useCallback(() => {
    setCurrentMediaIndex((prevIndex) => {
      const nextIndex = (prevIndex - 1 + mediaList.length) % mediaList.length;
      return nextIndex;
    });
  }, [mediaList.length]);

  const handleProgressBarClick = (event) => {
    const progressBar = event.currentTarget; // The clicked progress bar element
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left; // Click position relative to the progress bar
    const progressWidth = rect.width;
    const clickRatio = clickX / progressWidth; // Ratio of click position to the total width
    const totalSlides = selectedMediaList.length < 7 ? selectedMediaList.length : 7;
    const targetSlide = Math.floor(clickRatio * totalSlides);
    moveToSlide(targetSlide);
  };

  const moveToSlide = useCallback((index) => {
    setCurrentMediaIndex(() => {
      return index;
    });
  }, []);

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
    if (isPlaying && currentMedia && isVideoFile(currentMedia.url) && videoRef.current) {
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
      handleNext();
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

    if (currentMedia && autoplay) {
      play();
    }
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
      document.removeEventListener("webkitfullscreenchange", handleFullScreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullScreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullScreenChange);
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
      if (!hashParams.has("feed")) {
        const defaultFeed = mediaList[0]?.feed || "seeclickfix-311";
        hashParams.set("feed", defaultFeed);
        window.location.hash = `#${hashParams.toString()}`;
      }
    }
  }, [mediaList]);

  return (
    <div className={`VideoPlayer ${isFullScreen ? "fullscreen" : ""}`} ref={containerRef}>
      <div className="VideoPlayer__video-container" onMouseLeave={handleMouseLeave}>
        {isLoading ? (
          <div className="VideoPlayer__loading">
            <div className="spinner"></div>
            <p>Loading media...</p>
          </div>
        ) : currentMedia && currentMedia.isError ? (
          <div className="VideoPlayer__error" style={{ background: "none", padding: 0 }}>
            <img
              src="src/assets/images/intro-landscape.jpg"
              alt="Error Placeholder"
              className="placeholder-image"
              style={{ display: "block", width: "100%", height: "auto" }} // Ensure the image takes full space
            />
          </div>
        ) : currentMedia && currentMedia.url ? (
          isImageFile(currentMedia.url) ? (
            <img
              ref={imageRef}
              className="video-image image-file"
              src={currentMedia.url}
              alt={currentMedia.title || "Media"}
              onError={() => {
                console.error("Error loading image:", currentMedia.url);
                handleGlobalError(new Error("Image failed to load"), currentMedia.title);
              }}
              onLoad={() => {
                if (imageRef.current && containerRef.current) {
                  const image = imageRef.current;
                  const container = containerRef.current;
                  const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
                  const { naturalWidth, naturalHeight } = image;
                  const scaleFactor = Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
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
                poster="src/assets/images/intro-a.jpg"
                muted={isMute}
                onClick={handlePlayPause}
              ></video>
              {!isPlaying && (
                <button className="play-button" onClick={handlePlayPause} aria-label="Play Video">
                  <FaPlay size={30} />
                </button>
              )}

              {isPlaying && (
                <button className="play-button" onClick={handlePlayPause} aria-label="Pause Video">
                  <FaPause size={30} />
                </button>
              )}
            </div>
          ) : (
            <div className="VideoPlayer__unsupported-media" style={{ background: "none", padding: 0 }}>
              <img
                src="src/assets/images/intro-landscape.jpg"
                alt="Error Placeholder"
                className="placeholder-image"
                style={{ display: "block", width: "100%", height: "auto" }}
              />
              <div className="unsupported-media-message">
                Unsupported Media Type
              </div>
            </div>
          )
        ) : (
          <div className="VideoPlayer__no-media">
            <img
              src="src/assets/images/intro-a.jpg"
              alt="Feed Player Placeholder"
              className="placeholder-image"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
        )}
        {selectedMediaList.length > 1 && (
          <div
            className="VideoPlayer__progress-bg"
            onClick={(event) => handleProgressBarClick(event)}
            style={{ bottom: isFullScreen ? "12px" : 0 }}
          >
            <div
              className="VideoPlayer__progress"
              style={{
                width:
                  selectedMediaList.length > 0
                    ? `${
                        ((currentMediaIndex + 1) / (selectedMediaList.length < 7 ? selectedMediaList.length : 7)) * 100
                      }%`
                    : "0%",
              }}
            ></div>
            {selectedMediaList.slice(0, 7).map(
              (item, index) =>
                index >= 0 && (
                  <div
                    key={index}
                    className="VideoPlayer__progress-point"
                    style={{
                      left: `${((index + 1) / (selectedMediaList.length < 7 ? selectedMediaList.length : 7)) * 99.75}%`,
                    }}
                    title={`Move to slide ${index + 1}`}
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
          <div className={`VideoPlayer__overlay ${isExpanded ? "expanded-overlay" : ""}`}>
            <div className="VideoPlayer__info">
              <h2>
                {currentMedia.title || "Untitled"}{" "}
                <span onClick={toggleText} className="toggle-text">
                  {isExpanded ? <FaChevronDown title="Reduce" size={20} /> : <FaChevronUp title="Expand" size={20} />}
                </span>
              </h2>
              <p className={isExpanded ? "expanded" : "collapsed"}>{currentMedia.text || "No description available"}</p>
            </div>
          </div>
        )}
        {selectedOption === "url" && <Popup {...{ setVideoData, setSelectedOption }} />}
        {selectedOption === "feeds" && (
          <div className="VideoPlayer__dropdown">
            <div className="VideoPlayer__select" onClick={() => setIsDropdownActive(!isDropdownActive)}>
              <span>{mediaList && mediaList[index] ? mediaList[index].title : "Select Media"}</span>
              <div className="VideoPlayer__caret"></div>
            </div>
            <ul className={`VideoPlayer__menu ${isDropdownActive ? "active" : ""}`}>
              {mediaList &&
                mediaList.map((media, idx) => (
                  <li
                    key={idx}
                    className={`${currentMediaIndex === idx ? "active" : ""} ${
                      loadedFeeds.includes(media.feed.trim().toLowerCase()) ? "" : "loading"
                    }`}
                    onClick={() => {
                      if (loadedFeeds.includes(media.feed.trim().toLowerCase())) {
                        setIndex(idx);
                        setIsDropdownActive(false);
                        setCurrentMediaIndex(0);
                        setSelectedMediaList(listofMedia[media.title]);
                        setCurrentMedia(listofMedia[media.title][0]);
                        updateURLHash(media.feed, 0); // Update hash
                      } else {
                        loadFeed(media, listofMedia).then(() => {
                          setIndex(idx);
                          setIsDropdownActive(false);
                          setCurrentMediaIndex(0);
                          setSelectedMediaList(listofMedia[media.title]);
                          setCurrentMedia(listofMedia[media.title][0]);
                          updateURLHash(media.feed, 0); // Update hash after loading
                        });
                      }
                    }}
                  >
                    {media.title || media.feed}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
      <div className="VideoPlayer__controls">
        <div className="control-group control-group-btn">
          <button className="control-button prev" onClick={handlePrev}>
            <i className="ri-skip-back-fill icon"></i>
          </button>
          <button className="control-button play-pause" onClick={handlePlayPause}>
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
                {currentTime[0]}:{String(currentTime[1]).padStart(2, "0")} / {duration[0]}:
                {String(duration[1]).padStart(2, "0")}
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
          <button className="control-button full-screen" onClick={toggleFullScreen}>
            <i className={`ri-${isFullScreen ? "fullscreen-exit" : "fullscreen"}-line`}></i>
          </button>
        </div>
      </div>
    </div>
  );
}

VideoPlayer.propTypes = {
  autoplay: PropTypes.bool,
  isFullScreen: PropTypes.bool.isRequired,
  setIsFullScreen: PropTypes.func.isRequired,
  handleFullScreen: PropTypes.func.isRequired,
  selectedOption: PropTypes.string.isRequired,
  setSelectedOption: PropTypes.func.isRequired,
  swiperData: PropTypes.object,
  setSwiperData: PropTypes.func.isRequired,
};

export default VideoPlayer;