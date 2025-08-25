import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import TeamMemberCard from './TeamMemberCard';
import './TeamGallery.scss';

const TeamGallery = ({ 
  teamMembers, 
  currentIndex, 
  onMemberChange, 
  isFullScreen 
}) => {
  const [hoveredMember, setHoveredMember] = useState(null);
  const scrollContainerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');

  // Get unique teams for filter dropdown
  const availableTeams = useMemo(() => {
    const teams = new Set();
    teamMembers.forEach(member => {
      if (member.teams && member.teams.length > 0) {
        member.teams.forEach(team => teams.add(team));
      } else if (member.team) {
        // Fallback for single team format
        member.team.split(',').forEach(team => teams.add(team.trim()));
      }
    });
    return Array.from(teams).sort();
  }, [teamMembers]);

  // Filter team members based on selected team
  const filteredTeamMembers = useMemo(() => {
    if (selectedTeamFilter === 'all') {
      return teamMembers;
    }
    
    return teamMembers.filter(member => {
      if (member.teams && member.teams.length > 0) {
        return member.teams.includes(selectedTeamFilter);
      } else if (member.team) {
        // Fallback for single team format
        return member.team.split(',').map(t => t.trim()).includes(selectedTeamFilter);
      }
      return false;
    });
  }, [teamMembers, selectedTeamFilter]);

  // Calculate scroll progress for scroll indicator
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const progress = scrollHeight > clientHeight 
        ? (scrollTop / (scrollHeight - clientHeight)) * 100 
        : 0;
      setScrollProgress(progress);
    }
  };

  // Scroll to specific member
  const scrollToMember = (index) => {
    if (scrollContainerRef.current && teamMembers[index]) {
      const cardHeight = 400; // Approximate card height including gap
      const targetScroll = Math.floor(index / getCardsPerRow()) * cardHeight;
      
      scrollContainerRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
      
      if (onMemberChange) {
        onMemberChange(index);
      }
    }
  };

  // Calculate cards per row based on container width
  const getCardsPerRow = () => {
    if (isFullScreen) return 4;
    if (window.innerWidth >= 1200) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  };

  // Removed keyboard navigation as requested

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className="team-gallery-empty">
        <div className="empty-state">
          <h2>No Team Members Found</h2>
          <p>Unable to load team member data at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`team-gallery-container ${isFullScreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="team-gallery-header">
        <div className="header-title-row">
          <h2>Model Earth Team</h2>
          <div className="team-filter">
            <label htmlFor="teamFilter">Filter by Team:</label>
            <select 
              id="teamFilter"
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="team-filter-select"
            >
              <option value="all">All Teams ({teamMembers.length})</option>
              {availableTeams.map(team => (
                <option key={team} value={team}>
                  {team} ({teamMembers.filter(member => 
                    (member.teams && member.teams.includes(team)) || 
                    (member.team && member.team.split(',').map(t => t.trim()).includes(team))
                  ).length})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="team-stats">
          <span className="member-count">
            {selectedTeamFilter === 'all' 
              ? `${teamMembers.length} Members` 
              : `${filteredTeamMembers.length} of ${teamMembers.length} Members`
            }
          </span>
          <span className="scroll-hint">Scroll to view more members</span>
        </div>
      </div>

      {/* Scroll Progress Indicator */}
      {filteredTeamMembers.length > getCardsPerRow() && (
        <div className="scroll-indicator">
          <div 
            className="scroll-progress" 
            style={{ height: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* Team Gallery Grid */}
      <div 
        className="team-gallery-scroll"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        tabIndex={0}
        role="grid"
        aria-label="Team members gallery"
      >
        <div className="team-gallery-grid">
          {filteredTeamMembers.map((member, index) => (
            <TeamMemberCard
              key={member.id || index}
              member={member}
              index={index}
              isActive={index === currentIndex}
              isHovered={hoveredMember === index}
              onMouseEnter={() => setHoveredMember(index)}
              onMouseLeave={() => setHoveredMember(null)}
              onClick={() => scrollToMember(index)}
              isFullScreen={isFullScreen}
            />
          ))}
        </div>
      </div>

      {/* Keep space where controls used to be, but empty */}
      <div className="navigation-spacer"></div>
    </div>
  );
};

TeamGallery.propTypes = {
  teamMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      location: PropTypes.string,
      avatar: PropTypes.string,
      skills: PropTypes.arrayOf(PropTypes.string),
      projects: PropTypes.arrayOf(PropTypes.string),
      availability: PropTypes.string,
      rating: PropTypes.number,
      projectCount: PropTypes.number,
      description: PropTypes.string,
    })
  ).isRequired,
  currentIndex: PropTypes.number,
  onMemberChange: PropTypes.func,
  isFullScreen: PropTypes.bool,
};

TeamGallery.defaultProps = {
  currentIndex: 0,
  onMemberChange: null,
  isFullScreen: false,
};

export default TeamGallery;