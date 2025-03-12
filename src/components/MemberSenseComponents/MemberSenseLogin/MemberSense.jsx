/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Server, 
  Users, 
  ToggleLeft, 
  ToggleRight, 
  Lock 
} from 'lucide-react';
import './MemberSense.scss';
import Spinner from '../../Spinner/Spinner';

/**
 * MemberSense Component
 * 
 * A component that handles Discord server authentication and displays server information.
 * Supports both production and demo modes for testing and development.
 * 
 * @param {Object} props
 * @param {Function} props.onValidToken - Callback function to validate Discord token
 * @param {string} props.initialToken - Initial Discord bot token
 * @param {boolean} props.isLoading - Loading state from parent component
 * @param {string} props.error - Error message from parent
 * @param {boolean} props.isLoggedIn - Authentication status
 * @param {boolean} props.isLoggingOut - Logout process status
 * @param {Object} props.initialServerInfo - Initial server information
 * @param {boolean} props.isFullScreen - Fullscreen display mode
 * @param {boolean} props.useMockData - Toggle for demo/production mode
 * @param {Function} props.onToggleMockData - Callback for toggling demo mode
 */
const MemberSense = ({
  onValidToken,
  initialToken,
  isLoading: parentLoading,
  error,
  isLoggedIn,
  isLoggingOut,
  serverInfo: initialServerInfo,
  isFullScreen,
  useMockData = true,
  onToggleMockData,
}) => {
  // State management
  const [showToken, setShowToken] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  const [serverInfo, setServerInfo] = useState(initialServerInfo);
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * Handles initial token and server info setup
   */
  useEffect(() => {
    if (initialToken) {
      console.log("Initial token is not empty");
      setInputToken(initialToken);
      setServerInfo(initialServerInfo);
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 300);
    } else {
      setServerInfo(null);
      setInputToken('');
      setValidationMessage(null);
    }
  }, [initialToken, initialServerInfo]);

  useEffect(()=>{
    if(useMockData===true)handleTokenSubmit();
  }, [useMockData])

  async function handleSampleDiscord() {
    onToggleMockData(true); 
  }
  /**
   * Handles token submission and validation
   * Includes minimum validation time for UX purposes
   */
  const handleTokenSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsValidating(true);
    setValidationMessage(null);

    const minValidationTime = 2000;
    const validationStartTime = Date.now();

    try {
      const success = await onValidToken(inputToken);
      const elapsedTime = Date.now() - validationStartTime;
      const remainingTime = Math.max(0, minValidationTime - elapsedTime);

      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      if (success) {
        console.log("Token validated successfully");
        setIsTransitioning(true);
        setTimeout(() => {
          setValidationMessage({
            type: "success",
            text: "Token validated successfully!",
          });
          setIsTransitioning(false);
        }, 300);
      } else {
        throw new Error("Validation failed");
      }
    } catch (error) {
      console.error("Error validating token:", error);
      setValidationMessage({
        type: "error",
        text: "Authentication failed. Please try again.",
      });
      setServerInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Renders the demo/production mode toggle
   */
  const renderDataModeToggle = () => (
    <div className="data-mode-toggle">
      <div className="toggle-description">
        <p className="toggle-title">
          {useMockData ? "Demo Mode" : "Production Mode"}
        </p>
        <p className="toggle-subtitle">
          {useMockData
            ? "Currently using sample data to explore features"
            : "Connected to your Discord server data"}
        </p>
      </div>
      <button
        onClick={onToggleMockData}
        className="toggle-button"
        type="button"
      >
        {useMockData ? (
          <ToggleRight className="toggle-icon mock" size={24} />
        ) : (
          <ToggleLeft className="toggle-icon real" size={24} />
        )}
        <span className="toggle-label">
          {useMockData ? "Sample Team" : "My Discord Team"}
        </span>
      </button>
    </div>
  );

  /**
   * Renders the token input form
   */
  const renderTokenForm = () => (
    <div className="auth-container">
      <div className="auth-header">
        <Lock size={28} className="auth-icon" />
        <h3>Connect Your Server</h3>
        <p className="auth-description">Enter your Discord bot token to access your server data</p>
      </div>
      <form onSubmit={handleTokenSubmit} className="token-form">
        <div className="token-input-wrapper">
          <input
            type={showToken ? "text" : "password"}
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="Enter Discord Bot Token"
            className="token-input"
            disabled={isValidating || useMockData}
          />
          <button
            type="button"
            className="toggle-visibility-btn"
            onClick={() => setShowToken(!showToken)}
          >
            {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button
          type="submit"
          className={`submit-btn ${isValidating ? "loading" : ""}`}
          disabled={isValidating || (!useMockData && !inputToken.trim())}
        >
          {isValidating ? "Validating..." : "Connect Server"}
        </button>
      </form>
    </div>
  );

  /**
   * Renders server information after successful authentication
   */
  const renderServerInfo = () => (
    <div className="server-info">
      {serverInfo.iconURL ? (
        <img
          src={serverInfo.iconURL}
          alt="Server Icon"
          className="server-icon"
        />
      ) : (
        <Server size={48} className="server-icon" />
      )}
      <h3 className="server-name">Welcome to {serverInfo.serverName}!</h3>
      <p className="server-message">
        You&apos;re all set to explore MemberSense features. Use the navigation menu
        to access Member Showcase and Discord Viewer.
      </p>
      <div className="server-details">
        {serverInfo.memberCount && (
          <p className="member-count">
            <Users size={20} />
            {serverInfo.memberCount} members
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className={`member-sense-wrapper ${isFullScreen ? "fullscreen" : ""}`}>
      <div
        className={`member-sense-container ${
          isTransitioning ? "transitioning" : ""
        }`}
      >
        <h1 className="member-sense-title">MemberSense</h1>

        {!serverInfo && !useMockData && (
            <>
              <div className="token-info">
                <a
                  href="https://github.com/ModelEarth/feed/blob/main/MemberSense.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="token-link"
                >
                  How to Get My Team&apos;s Token?
                </a>
              <div className='token-info token-link' onClick={handleSampleDiscord}>
                View Sample Discord Team and Posts
              </div>
              </div>
              <div className="permissions-info">
                <h4>Required Bot Permissions:</h4>
                <ul>
                  <li>View Channels</li>
                  <li>View Server Insights</li>
                  <li>Send Messages</li>
                  <li>Read Message History</li>
                </ul>
              </div>
            </>
        )}

        {/* {!isLoggedIn && renderDataModeToggle()} */}
        {parentLoading ? (
          <div className="loading-container">
            <Spinner />
          </div>
        ) : (
          <>
            {serverInfo ? renderServerInfo() : renderTokenForm()}

            {(validationMessage || error) && (
              <div
                className={`validation-message ${
                  validationMessage?.type || "error"
                }`}
              >
                {validationMessage?.type === "success" ? (
                  <CheckCircle className="message-icon" size={20} />
                ) : (
                  <AlertCircle className="message-icon" size={20} />
                )}
                {validationMessage?.text || error}
              </div>
            )}

            
          </>
        )}
        {(isValidating || isLoggingOut) && (
          <div className="overlay">
            <Spinner />
            <p>{isLoggingOut ? "Logging out..." : "Validating token..."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberSense;