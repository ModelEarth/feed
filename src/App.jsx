// External dependencies
import React, { useState, useEffect, useRef } from "react";
import reactToWebComponent from "react-to-webcomponent";
import ReactDOM from "react-dom";
import {
  Video,
  Users,
  MessageCircle,
  AlertCircle,
  MoreHorizontal,
  Maximize,
  Minimize,
  Link,
  List,
  LogOut,
} from "lucide-react";

// Components
import MemberSense from "./components/MemberSenseComponents/MemberSenseLogin/MemberSense";
import MemberShowcase from "./components/MemberSenseComponents/MemberShowcase/MemberShowcase";
import DiscordChannelViewer from "./components/MemberSenseComponents/DiscordChannelViewer/DiscordChannelViewer";
import VideoPlayer from "./components/VideoPlayer/VideoPlayer";

// Context
import ContextProvider from "./Context/ContextGoogle";

// Services
import {
  fetchMembers,
  fetchChannels,
  fetchMessages,
  fetchFakeMembers,
  fetchFakeChannels,
  fetchFakeMessages,
} from "./services/Dataservice";

// Styles
import "./App.scss";

// Constants
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Web Component Registration
const VideoPlayerComponent = reactToWebComponent(VideoPlayer, React, ReactDOM);
customElements.define("video-player-widget", VideoPlayerComponent);

function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState("FeedPlayer");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const appRef = useRef(null);
  const [selectedOption, setSelectedOption] = useState("");
  const menuOpenRef = useRef(null);
  const [swiperData, setSwiperData] = useState(null);
  const [isPopup, setIsPopup] = useState(false);
  const menuRef = useRef(null);
  const [isMenu, setIsMenu] = useState(false);

  // Auth state
  const [token, setToken] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);

  // Data state
  const [useMockData, setUseMockData] = useState(false);
  const [members, setMembers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Navigation items configuration
  const memberSenseDropdownItems = [
    { id: "Showcase", icon: Users, label: "Member Showcase" },
    { id: "DiscordViewer", icon: MessageCircle, label: "Discord Viewer" },
  ];

  const handlePopupClick = () => {
    setSelectedOption("");
    setIsMenu(true);
  };

  const handleMenuClick = (option) => {
    setIsMenu(false);
    setSelectedOption(option);
  };

  // Click outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If menuRef exists and the click is NOT inside it, close the menu
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenu(false);
    };

    if (isMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenu]);

  useEffect(() => {
    if (isMenu) setIsMenu(false);
  }, [currentView]);

  // Effects
  useEffect(() => {
    if (sessionId) {
      setIsLoading(true);
      if (useMockData) {
        const fakeMembers = fetchFakeMembers();
        const fakeChannels = fetchFakeChannels();
        setMembers(fakeMembers);
        setChannels(fakeChannels);
        if (fakeChannels.length > 0 && !selectedChannel) {
          setSelectedChannel(fakeChannels[0].id);
        }
      } else {
        Promise.all([fetchMembers(sessionId), fetchChannels(sessionId)])
          .then(([membersData, channelsData]) => {
            setMembers(membersData);
            setChannels(channelsData);
            console.log("Fetching Channel Data.");
            console.log(channelsData.length);
            if (channelsData.length > 0 && !selectedChannel) {
              setSelectedChannel(channelsData[0].id);
            }
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
            setError("Failed to fetch data. Please try again.");
          })
          .finally(() => setIsLoading(false));
      }
    } else {
      setMembers([]);
      setChannels([]);
      setMessages([]);
    }
  }, [sessionId]);

  useEffect(() => {
    if (swiperData) {
      setIsPopup(true);
    }
  }, [swiperData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenRef.current && !menuOpenRef.current.contains(event.target)) setIsMenuOpen(false);
    };

    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    if (sessionId && selectedChannel) {
      setIsLoading(true);
      if (useMockData) {
        const fakeMessages = fetchFakeMessages(selectedChannel);
        setMessages(fakeMessages);
        setIsLoading(false);
      } else {
        fetchMessages(sessionId, selectedChannel)
          .then((messagesData) => {
            setMessages(messagesData);
          })
          .catch((error) => {
            console.error("Error fetching messages:", error);
            setError("Failed to fetch messages. Please try again.");
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [sessionId, selectedChannel]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      if (!isFullScreen) setIsMenuOpen(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Event handlers
  const handleLogin = async (inputToken) => {
    setIsLoading(true);
    setError("");

    if (useMockData) {
      setToken("MockTokenPlaceHolder");
      setSessionId("12345-abcdef-67890");
      setIsLoggedIn(true);
      setServerInfo({
        serverName: "Mocking Discord Server",
        memberCount: 1500,
        //iconURL: "https://via.placeholder.com/48",
      });
      setIsLoading(false);
      return true;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inputToken }),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      setToken(inputToken);
      setSessionId(data.sessionId);
      setServerInfo({
        serverName: data.serverName,
        memberCount: data.memberCount,
        iconURL: data.iconURL,
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your token and try again.");
      setToken("");
      setSessionId("");
      setServerInfo(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (useMockData) {
      setIsLoggingOut(true);
      setIsTransitioning(true);
      setIsLoading(true);
      setTimeout(() => {
        setToken("");
        setSessionId("");
        setServerInfo(null);
        setCurrentView("MemberSense");
        setIsLoggedIn(false);
        setIsLoggingOut(false);
        setIsLoading(false);
        setIsTransitioning(false);
        setUseMockData(false);
      }, 300);
      return;
    }

    setIsLoggingOut(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: sessionId },
      });
      if (!response.ok) throw new Error("Logout failed");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setTimeout(() => {
        setToken("");
        setSessionId("");
        setServerInfo(null);
        setCurrentView("MemberSense");
        setIsLoggingOut(false);
      }, 300);
    }
  };

  const handleViewChange = (view) => {
    setError("");
    setIsTransitioning(true);
    setIsLoading(true);
    setTimeout(() => {
      setCurrentView(view);
      setIsTransitioning(false);
      setTimeout(() => setIsLoading(false), 500);
    }, 300);
  };

  const handleFullScreen = () => {
    if (!isFullScreen) {
      if (appRef.current.requestFullscreen) {
        appRef.current.requestFullscreen();
      } else if (appRef.current.webkitRequestFullscreen) {
        appRef.current.webkitRequestFullscreen();
      } else if (appRef.current.msRequestFullscreen) {
        appRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Render helpers
  const renderContent = () => {
    const commonProps = { isFullScreen };

    switch (currentView) {
      case "FeedPlayer":
        return (
          <VideoPlayer
            autoplay={true}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
            handleFullScreen={handleFullScreen}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            swiperData={swiperData}
            setSwiperData={setSwiperData}
          />
        );
      case "MemberSense":
        return (
          <MemberSense
            onValidToken={handleLogin}
            initialToken={token}
            isLoading={isLoading}
            error={error}
            isLoggedIn={isLoggedIn}
            isLoggingOut={isLoggingOut}
            serverInfo={serverInfo}
            isFullScreen={isFullScreen}
            useMockData={useMockData}
            onToggleMockData={(value) => setUseMockData(value)}
            handleViewChange={handleViewChange}
            {...commonProps}
          />
        );
      case "Showcase":
        return <MemberShowcase token={token} members={members} isLoading={isLoading} {...commonProps} />;
      case "DiscordViewer":
        return (
          <DiscordChannelViewer
            channels={channels}
            messages={messages}
            selectedChannel={selectedChannel}
            onChannelSelect={setSelectedChannel}
            isLoading={isLoading}
            {...commonProps}
          />
        );
      default:
        return <div>Select a view</div>;
    }
  };

  const memberSenseItems = [...(token ? memberSenseDropdownItems : [])];

  const mediaItems = [
    { id: "FeedPlayer", icon: Video, label: "Feed Player" },
    { id: "MemberSense", icon: Users, label: "MemberSense" },
    ...memberSenseItems,
  ];

  const getMenuStyles = () => {
    if (currentView === "FeedPlayer") return { top: "30px", right: "30px" };
    if (token) {
      if (currentView === "MemberSense") return { top: "50px", right: "50px" };
      if (currentView === "Showcase") return { top: "40px", right: "40px" };
      if (currentView === "DiscordViewer") return { top: "68px", right: "50px" };
    }
    if (currentView === "MemberSense") return { top: "50px", right: "50px" };
  };

  const renderNavItems = (items, excludeCurrentView = true) => {
    return items
      .filter((item) => !excludeCurrentView || item.id !== currentView)
      .map((item) => (
        <button
          key={item.id}
          onClick={() => {
            handleViewChange(item.id);
            if (isFullScreen) setIsMenuOpen(false);
          }}
          className={currentView === item.id ? "active" : ""}
          title={item.label}
        >
          <item.icon size={24} />
          <span>{item.label}</span>
        </button>
      ));
  };

  return (
    <ContextProvider>
      <div className={`App ${isFullScreen ? "fullscreen" : ""}`} ref={appRef}>
        {isFullScreen ? (
          <div className="fullscreen-nav" ref={menuOpenRef}>
            {!isMenuOpen && (
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="menu-btn">
                <MoreHorizontal size={24} />
              </button>
            )}
            {isMenuOpen && (
              <div className="fullscreen-menu">
                {currentView === "FeedPlayer" && (
                  <div>
                    <button onClick={() => handleMenuClick("feeds")}>
                      <List size={24} />
                      <span>Choose Feeds</span>
                    </button>
                    <button onClick={() => handleMenuClick("url")}>
                      <Link size={24} />
                      <span>Paste Your Video URL</span>
                    </button>
                  </div>
                )}
                {renderNavItems(mediaItems)}
                <button onClick={handleFullScreen} className="fullscreen-toggle">
                  <Minimize size={24} />
                  <span>Exit Fullscreen</span>
                </button>
                {token && (
                  <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={24} />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="nav-menu">
            <div className="VideoPlayer__toggleMenu" ref={menuRef}>
              {!isMenu && (
                <button
                  className="popup-btn"
                  onClick={handlePopupClick}
                  title="Click to Toggle Options"
                  style={getMenuStyles()}
                >
                  <MoreHorizontal size={24} />
                </button>
              )}
              {isMenu && (
                <div className="menu-content">
                  <ul className="menu-list">
                    {currentView === "FeedPlayer" && (
                      <>
                        <li className="menu-item" onClick={() => handleMenuClick("feeds")}>
                          <List size={24} />
                          <span>Choose Feeds</span>
                        </li>
                        <li className="menu-item" onClick={() => handleMenuClick("url")}>
                          <Link size={24} />
                          <span>Paste Your Video URL</span>
                        </li>
                      </>
                    )}
                    <div className="video-nav">
                      {renderNavItems(mediaItems)}
                      <button onClick={handleFullScreen} className="fullscreen-toggle">
                        <Maximize size={24} />
                        <span>Fullscreen</span>
                      </button>
                      {token && (
                        <button onClick={handleLogout} className="logout-btn">
                          <LogOut size={24} />
                          <span>Logout</span>
                        </button>
                      )}
                    </div>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="error-message">
            <AlertCircle className="error-icon" />
            <p>{error}</p>
          </div>
        )}
        <main className={`app-content ${isTransitioning ? "fade-out" : "fade-in"}`}>{renderContent()}</main>
        {isPopup && (
          <div className="lightbox" onClick={() => setIsPopup(null)}>
            <button className="close-btn" onClick={() => setIsPopup(null)}>
              x
            </button>
            {swiperData.mediaType === "video" ? (
              <iframe className="lightboxImg" src={swiperData.url} alt="Enlarged Video" allowFullScreen />
            ) : (
              <img className="lightboxImg" src={swiperData.url} alt="Enlarged Image" />
            )}
          </div>
        )}
      </div>
    </ContextProvider>
  );
}

export default App;
