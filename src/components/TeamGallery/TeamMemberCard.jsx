import React from 'react';
import PropTypes from 'prop-types';

const TeamMemberCard = ({ 
  member, 
  index, 
  isActive, 
  isHovered,
  onMouseEnter, 
  onMouseLeave, 
  onClick,
  isFullScreen 
}) => {
  // Generate avatar with initials if no image URL provided
  const getAvatarContent = () => {
    if (member.avatar && (member.avatar.startsWith('http') || member.avatar.startsWith('/'))) {
      return <img src={member.avatar} alt={`${member.name} avatar`} />;
    }
    
    // Use initials or provided avatar text
    const initials = member.avatar || member.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return <span className="avatar-initials">{initials}</span>;
  };

  // Get availability status color
  const getAvailabilityClass = () => {
    const status = (member.status || member.availability || '').toLowerCase();
    switch (status) {
      case 'available':
      case 'active':
        return 'available';
      case 'busy':
      case 'working':
        return 'busy';
      case 'offline':
      case 'inactive':
        return 'offline';
      default:
        return 'unknown';
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star full">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  return (
    <div
      className={`team-member-card ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''} ${isFullScreen ? 'fullscreen-card' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      role="gridcell"
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      data-member-index={index}
    >
      {/* Card Header */}
      <div className="member-card-header">
        {/* Avatar */}
        <div className="member-avatar">
          {getAvatarContent()}
        </div>
        
        {/* Availability Status */}
        <div className={`availability-status ${getAvailabilityClass()}`}>
          <span className="status-indicator"></span>
          <span className="status-text">{member.status || member.availability || 'Unknown'}</span>
        </div>
      </div>

      {/* Member Info */}
      <div className="member-info">
        <h3 className="member-name">{member.name}</h3>
        <p className="member-title">{member.title}</p>
        {member.location && (
          <p className="member-location">📍 {member.location}</p>
        )}
      </div>

      {/* Team Info (from CSV Team column) */}
      {member.teams && member.teams.length > 0 ? (
        <div className="member-skills">
          <h4>Teams</h4>
          <div className="skills-list">
            {member.teams.map((team, teamIndex) => (
              <span key={teamIndex} className="skill-tag team-tag">
                {team}
              </span>
            ))}
          </div>
        </div>
      ) : member.team && (
        <div className="member-skills">
          <h4>Team</h4>
          <div className="skills-list">
            <span className="skill-tag team-tag">
              {member.team}
            </span>
          </div>
        </div>
      )}

      {/* Skills (fallback to original if available) */}
      {member.skills && member.skills.length > 0 && (
        <div className="member-skills">
          <h4>Skills</h4>
          <div className="skills-list">
            {member.skills.slice(0, 4).map((skill, skillIndex) => (
              <span key={skillIndex} className="skill-tag">
                {skill}
              </span>
            ))}
            {member.skills.length > 4 && (
              <span className="skill-tag more">+{member.skills.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      {/* Current Projects */}
      <div className="member-projects">
        <h4>Current Projects</h4>
        {member.projects && member.projects.length > 0 && member.projects[0].trim() ? (
          <ul className="projects-list">
            {member.projects.slice(0, 2).map((project, projectIndex) => (
              <li key={projectIndex} className="project-item">
                {project}
              </li>
            ))}
            {member.projects.length > 2 && (
              <li className="project-item more">
                +{member.projects.length - 2} more projects
              </li>
            )}
          </ul>
        ) : (
          <div className="no-projects">
            <span className="no-projects-icon">📋</span>
            <span className="no-projects-text">Available for new projects</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="member-stats">
        {member.rating && (
          <div className="rating">
            <div className="stars">
              {renderStars(member.rating)}
            </div>
            <span className="rating-value">{member.rating}</span>
          </div>
        )}
        {member.projectCount !== undefined && (
          <div className="project-count">
            <span className="count">{member.projectCount}</span>
            <span className="label">Projects</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="member-actions">
        <button 
          className="action-btn primary"
          onClick={(e) => {
            e.stopPropagation();
            // Handle profile view
            console.log('View profile:', member.name);
          }}
        >
          View Profile
        </button>
        <button 
          className="action-btn secondary"
          onClick={(e) => {
            e.stopPropagation();
            // Handle connect action
            console.log('Connect with:', member.name);
          }}
        >
          Connect
        </button>
      </div>

      {/* Hover overlay with description */}
      {isHovered && member.description && (
        <div className="member-description-overlay">
          <p>{member.description}</p>
        </div>
      )}

      {/* Removed active indicator as requested */}
    </div>
  );
};

TeamMemberCard.propTypes = {
  member: PropTypes.shape({
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
  }).isRequired,
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool,
  isHovered: PropTypes.bool,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
  isFullScreen: PropTypes.bool,
};

TeamMemberCard.defaultProps = {
  isActive: false,
  isHovered: false,
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  onClick: () => {},
  isFullScreen: false,
};

export default TeamMemberCard;