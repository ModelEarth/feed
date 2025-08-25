// Static fallback data for Model Earth team members
// This data is used when the Rust API backend is unavailable

export const staticTeamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    title: "Senior Full-stack Developer",
    location: "Atlanta, GA",
    avatar: "SJ",
    skills: ["React", "Python", "AI/ML", "PostgreSQL"],
    projects: ["AI-Powered Government Dashboard", "Community Resource Mapping"],
    availability: "Available",
    rating: 4.9,
    projectCount: 5,
    description: "Specializing in AI-powered government modernization solutions with expertise in full-stack development and machine learning integration."
  },
  {
    id: 2,
    name: "Marcus Chen",
    title: "DevOps Engineer",
    location: "Portland, OR",
    avatar: "MC",
    skills: ["Kubernetes", "Docker", "AWS", "Terraform"],
    projects: ["Digital Literacy Platform"],
    availability: "Busy",
    rating: 4.8,
    projectCount: 3,
    description: "Expert in cloud infrastructure and containerization, focusing on scalable deployment solutions for government and educational platforms."
  },
  {
    id: 3,
    name: "Alex Rivera",
    title: "UX Designer",
    location: "Detroit, MI",
    avatar: "AR",
    skills: ["Figma", "User Research", "Prototyping", "Accessibility"],
    projects: ["Digital Literacy Training"],
    availability: "Available",
    rating: 5.0,
    projectCount: 8,
    description: "User experience designer passionate about creating accessible and inclusive digital experiences for diverse communities."
  },
  {
    id: 4,
    name: "Dr. Emily Watson",
    title: "Data Scientist",
    location: "Boston, MA",
    avatar: "EW",
    skills: ["Machine Learning", "Python", "R", "Statistical Analysis"],
    projects: ["Climate Data Analytics", "Economic Impact Modeling"],
    availability: "Available",
    rating: 4.7,
    projectCount: 12,
    description: "Computational scientist specializing in environmental data analysis and economic modeling for policy decision support."
  },
  {
    id: 5,
    name: "James Park",
    title: "Frontend Developer",
    location: "San Francisco, CA",
    avatar: "JP",
    skills: ["React", "TypeScript", "D3.js", "Next.js"],
    projects: ["Supply Chain Visualization", "Interactive Dashboards"],
    availability: "Available",
    rating: 4.6,
    projectCount: 7,
    description: "Frontend specialist focused on data visualization and interactive web applications for supply chain and economic analysis."
  },
  {
    id: 6,
    name: "Maria Rodriguez",
    title: "Backend Developer",
    location: "Austin, TX",
    avatar: "MR",
    skills: ["Node.js", "PostgreSQL", "GraphQL", "Microservices"],
    projects: ["API Development", "Database Optimization"],
    availability: "Busy",
    rating: 4.8,
    projectCount: 9,
    description: "Backend engineer specialized in building robust APIs and database systems for large-scale environmental and economic data platforms."
  },
  {
    id: 7,
    name: "David Kim",
    title: "Full-stack Developer",
    location: "Seattle, WA",
    avatar: "DK",
    skills: ["Vue.js", "Django", "AWS", "Docker"],
    projects: ["Sustainability Tracker", "Carbon Footprint Calculator"],
    availability: "Available",
    rating: 4.5,
    projectCount: 6,
    description: "Full-stack developer passionate about environmental technology and building tools for sustainability tracking and carbon footprint analysis."
  },
  {
    id: 8,
    name: "Lisa Chang",
    title: "Product Manager",
    location: "New York, NY",
    avatar: "LC",
    skills: ["Product Strategy", "Agile", "User Research", "Analytics"],
    projects: ["Product Roadmap", "User Experience Optimization"],
    availability: "Available",
    rating: 4.9,
    projectCount: 15,
    description: "Product manager with extensive experience in environmental tech products, focusing on user-centered design and data-driven decision making."
  },
  {
    id: 9,
    name: "Robert Thompson",
    title: "Systems Architect",
    location: "Chicago, IL",
    avatar: "RT",
    skills: ["System Design", "Microservices", "Kubernetes", "Security"],
    projects: ["Platform Architecture", "Scalability Solutions"],
    availability: "Busy",
    rating: 4.7,
    projectCount: 11,
    description: "Systems architect focused on designing scalable, secure platforms for environmental data processing and analysis at enterprise scale."
  },
  {
    id: 10,
    name: "Jennifer Lee",
    title: "QA Engineer",
    location: "Denver, CO",
    avatar: "JL",
    skills: ["Test Automation", "Selenium", "Jest", "Quality Assurance"],
    projects: ["Test Suite Development", "Quality Metrics"],
    availability: "Available",
    rating: 4.6,
    projectCount: 8,
    description: "Quality assurance engineer specializing in automated testing frameworks and ensuring high-quality deliverables for environmental applications."
  }
];

// API service function to fetch team members with fallback to static data
export const fetchTeamMembers = async () => {
  try {
    // First, try to fetch from the Rust backend API
    const response = await fetch('http://localhost:8081/api/team/members', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure the data has the expected structure
    if (Array.isArray(data) && data.length > 0) {
      console.log('✅ Successfully fetched team members from Rust API:', data.length, 'members');
      return data;
    } else {
      throw new Error('Invalid data structure received from API');
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch team members from API, using static fallback:', error.message);
    
    // Fallback to static data
    return staticTeamMembers;
  }
};

export default staticTeamMembers;