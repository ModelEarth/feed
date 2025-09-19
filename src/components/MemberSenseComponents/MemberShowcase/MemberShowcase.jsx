/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Mail, ExternalLink, ArrowLeft, Pause, Play } from "lucide-react";
import "./MemberShowcase.scss";

// Card component to display individual member information
const MemberCard = ({ member, openProfile }) => (
  <motion.div
    className="member-card"
    onClick={() => openProfile(member)}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <img src={member.avatar} alt={member.username} className="member-avatar" />
    <h3 className="member-name">{member.username}</h3>
    <span className="badge">{member.role}</span>
    <p className="member-email">
      <Mail size={12} />
      {member.email || "N/A"}
    </p>
    <button className="view-profile-button">
      View Profile
      <ExternalLink size={12} />
    </button>
  </motion.div>
);

const MemberShowcase = ({ members, isFullScreen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0); // Manages pagination
  const [progress, setProgress] = useState(0); // Manages auto-progress indicator
  const [searchTerm, setSearchTerm] = useState(""); // Stores the current search term
  const [selectedMember, setSelectedMember] = useState(null); // Manages the selected member profile display
  const [isLoading, setIsLoading] = useState(true); // Indicates loading state for members
  const [gridDimensions, setGridDimensions] = useState({ columns: 3, rows: 3 }); // Grid dimensions based on screen size
  const [isPaused, setIsPaused] = useState(false); // Manages auto-progression pause state

  // References for auto-progress interval and container for calculating dimensions
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const intervalDuration = 5000; // Time in ms for auto page change

  // Filters members by search term
  const filteredMembers = members.filter(
    (member) =>
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculates grid layout based on screen size and fullscreen mode
  const calculateGridDimensions = useCallback(() => {
    if (!isFullScreen) return { columns: 3, rows: 3 };

    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const cardWidth = 180;
      const cardHeight = 240;
      const gap = 16;

      const columns = Math.floor((width + gap) / (cardWidth + gap));
      const rows = Math.floor((height + gap) / (cardHeight + gap));

      return {
        columns: Math.max(columns, 4),
        rows: Math.max(rows, 4),
      };
    }
    return { columns: 4, rows: 4 };
  }, [isFullScreen]);

  // Updates grid dimensions on screen resize
  useEffect(() => {
    const updateGridDimensions = () => setGridDimensions(calculateGridDimensions());

    updateGridDimensions();
    window.addEventListener("resize", updateGridDimensions);
    return () => window.removeEventListener("resize", updateGridDimensions);
  }, [calculateGridDimensions]);

  // Simulates fetching members with a loading delay
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsLoading(false);
    };
    fetchMembers();
  }, []);

  // Resets pagination on fullscreen mode change
  useEffect(() => {
    setCurrentPage(0);
    setProgress(0);
  }, [isFullScreen]);

  // Manages auto-pagination with interval and resets if loading or paused
  useEffect(() => {
    if (!isLoading && !isPaused) {
      intervalRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            setCurrentPage(
              (prevPage) =>
                (prevPage + 1) % Math.ceil(filteredMembers.length / (gridDimensions.columns * gridDimensions.rows))
            );
            return 0;
          }
          return prevProgress + 100 / (intervalDuration / 100);
        });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [filteredMembers.length, gridDimensions, intervalDuration, isLoading, isPaused]);

  // Handles search input changes and resets pagination
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0);
    setProgress(0);
  };

  // Pagination navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentPage(
      (prevPage) =>
        (prevPage - 1 + Math.ceil(filteredMembers.length / (gridDimensions.columns * gridDimensions.rows))) %
        Math.ceil(filteredMembers.length / (gridDimensions.columns * gridDimensions.rows))
    );
    setProgress(0);
  }, [filteredMembers.length, gridDimensions]);

  const handleNext = useCallback(() => {
    setCurrentPage(
      (prevPage) => (prevPage + 1) % Math.ceil(filteredMembers.length / (gridDimensions.columns * gridDimensions.rows))
    );
    setProgress(0);
  }, [filteredMembers.length, gridDimensions]);

  // Opens and closes member profile
  const openProfile = (member) => setSelectedMember(member);
  const closeProfile = () => setSelectedMember(null);

  // Toggle pause state
  const togglePause = () => setIsPaused(!isPaused);

  // Determines the members to display on the current page
  const startIndex = currentPage * (gridDimensions.columns * gridDimensions.rows);
  const displayedMembers = filteredMembers.slice(startIndex, startIndex + gridDimensions.columns * gridDimensions.rows);

  return (
    <div className={`member-showcase ${isFullScreen ? "fullscreen" : ""}`}>
      {/* Back arrow button in upper left */}
      {onClose && (
        <button className="member-showcase-back-btn" onClick={onClose}>
          <ArrowLeft size={18} />
        </button>
      )}
      
      {/* Navigation bar with search functionality */}
      <nav className="app-nav">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search members..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </nav>

      {/* Main content area to display member grid or loading spinner */}
      <main className="app-content" ref={containerRef}>
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
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="members-grid"
              style={{
                gridTemplateColumns: `repeat(${gridDimensions.columns}, 1fr)`,
                gridTemplateRows: `repeat(${gridDimensions.rows}, 1fr)`,
              }}
            >
              {displayedMembers.map((member) => (
                <MemberCard key={member.id} member={member} openProfile={openProfile} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Pagination controls */}
      <div className="pagination">
        <button onClick={handlePrevious} disabled={currentPage === 0 || isLoading}>
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {currentPage + 1} of {Math.ceil(filteredMembers.length / (gridDimensions.columns * gridDimensions.rows))}
        </span>
        <button
          onClick={handleNext}
          disabled={
            currentPage === Math.ceil(filteredMembers.length / (gridDimensions.columns * gridDimensions.rows)) - 1 ||
            isLoading
          }
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Progress bar for auto-pagination */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Pause/Play button in lower right */}
      <button className="member-showcase-pause-btn" onClick={togglePause}>
        {isPaused ? <Play size={18} /> : <Pause size={18} />}
      </button>

      {/* Profile overlay for viewing selected member details */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="profile-overlay"
            onClick={closeProfile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="profile-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button className="close-button" onClick={closeProfile}>
                ×
              </button>
              <img src={selectedMember.avatar} alt={selectedMember.username} className="profile-avatar" />
              <h3>{selectedMember.username}</h3>
              <p className="member-email">
                <Mail size={14} />
                {selectedMember.email || "N/A"}
              </p>
              <p>Role: {selectedMember.role || "N/A"}</p>
              <p className="role-description">Role Description: {selectedMember.roleDescription || "N/A"}</p>
              <a
                href={selectedMember.link || "https://model.earth"}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-link"
              >
                Profile Link
                <ExternalLink size={14} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberShowcase;
