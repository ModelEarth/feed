/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import "./DiscordChannelViewer.scss";

/**
 * ChannelName Component
 * Renders a channel name with optional truncation and ellipsis
 *
 * @param {Object} props
 * @param {string} props.name - Channel name to display
 * @param {number} props.maxLength - Maximum length before truncation
 */
const ChannelName = ({ name, maxLength }) => (
  <span title={name}>{name.length <= maxLength ? name : `${name.substr(0, maxLength - 3)}...`}</span>
);

/**
 * DiscordChannelViewer Component
 * Displays Discord channel messages with pagination and channel selection
 *
 * @param {Object} props
 * @param {Array} props.channels - List of available channels
 * @param {Array} props.messages - List of messages in the selected channel
 * @param {string} props.selectedChannel - Currently selected channel ID
 * @param {Function} props.onChannelSelect - Callback when channel is selected
 * @param {boolean} props.isLoading - Loading state indicator
 * @param {boolean} props.isFullScreen - Fullscreen display mode
 */
const DiscordChannelViewer = ({ channels, messages, selectedChannel, onChannelSelect, isLoading, isFullScreen, onClose }) => {
  // State Management
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Refs for DOM manipulation
  const dropdownRef = useRef(null);

  // Constants
  const MESSAGES_PER_PAGE = 10;

  /**
   * Handles clicks outside the dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Event Handlers
   */
  const handleChannelSelect = (channelId) => {
    onChannelSelect(channelId);
    setCurrentPage(1);
    setIsDropdownOpen(false);
  };

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleNext = () => setCurrentPage((prev) => prev + 1);

  /**
   * Data Processing
   */
  const paginatedMessages = messages.slice((currentPage - 1) * MESSAGES_PER_PAGE, currentPage * MESSAGES_PER_PAGE);

  /**
   * Animation Configurations
   */
  const fullScreenVariants = {
    normal: {
      scale: 1,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    fullScreen: {
      scale: 1,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  /**
   * Render Functions
   */
  const renderChannelDropdown = () => (
    <div className="dropdown-container">
      <div className="dropdown" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="dropdown-toggle"
          title={channels.find((c) => c.id === selectedChannel)?.name || "Select Channel"}
        >
          <MessageCircle size={20} />
          <ChannelName name={channels.find((c) => c.id === selectedChannel)?.name || "Select Channel"} maxLength={20} />
          <ChevronDown size={16} />
        </button>
        {isDropdownOpen && (
          <div className="dropdown-content">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                className={selectedChannel === channel.id ? "active" : ""}
                title={channel.name}
              >
                <MessageCircle size={16} />
                <ChannelName name={channel.name} maxLength={25} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMessages = () => (
    <motion.div
      key="messages"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="message-container"
    >
      {paginatedMessages.length > 0 ? (
        paginatedMessages.map((message) => (
          <div key={message.id} className="message">
            <img src={message.author.avatar} alt={message.author.name} className="avatar" />
            <div className="message-content">
              <h4>{message.author.name}</h4>
              <p>{message.content}</p>
              <span className="timestamp">{new Date(message.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="no-messages">No messages to display.</div>
      )}
    </motion.div>
  );

  const renderPagination = () => (
    <div className="pagination">
      <button onClick={handlePrevious} disabled={currentPage === 1 || isLoading}>
        <ChevronLeft size={16} />
      </button>
      <span>Page {currentPage}</span>
      <button onClick={handleNext} disabled={currentPage * MESSAGES_PER_PAGE >= messages.length || isLoading}>
        <ChevronRight size={16} />
      </button>
    </div>
  );

  return (
    <motion.div
      className={`discord-channel-viewer ${isFullScreen ? "fullscreen" : ""}`}
      variants={fullScreenVariants}
      animate={isFullScreen ? "fullScreen" : "normal"}
    >
      {onClose && (
        <button className="discord-viewer-back-btn" onClick={onClose}>
          <ArrowLeft size={18} />
        </button>
      )}

      <nav className="app-nav">{renderChannelDropdown()}</nav>

      <main className="app-content">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="loading-spinner"
            >
              <div className="spinner"></div>
            </motion.div>
          ) : (
            renderMessages()
          )}
        </AnimatePresence>
      </main>

      {renderPagination()}
    </motion.div>
  );
};

export default DiscordChannelViewer;
