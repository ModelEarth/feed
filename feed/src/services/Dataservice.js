/**
 * Configuration Constants
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * API Handlers for Production Environment
 * These functions handle actual API calls to the backend service
 */
export const fetchMembers = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/members`, {
    headers: { Authorization: sessionId },
  });
  if (!response.ok) throw new Error("Failed to fetch members");
  return response.json();
};

export const fetchChannels = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/channels`, {
    headers: { Authorization: sessionId },
  });
  if (!response.ok) throw new Error("Failed to fetch channels");
  return response.json();
};

export const fetchMessages = async (sessionId, channelId) => {
  const response = await fetch(`${API_BASE_URL}/messages?channelId=${channelId}`, {
    headers: { Authorization: sessionId },
  });
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
};

/**
 * Demo Data Generation Utilities
 * These functions generate mock data for development and testing
 */

/**
 * Generates a random date within the last 30 days
 * @returns {Date} Random date object
 */
const getRandomDate = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(
    thirtyDaysAgo.getTime() +
      Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
  );
};

/**
 * Generates an array of fake member objects
 * @param {number} num - Number of members to generate
 * @returns {Array<Object>} Array of member objects
 */
const generateFakeMembers = (num) => {
  const names = [
    "John", "Jane", "Alice", "Bob", "Charlie",
    "David", "Eva", "Frank", "Grace", "Hannah"
  ];
  return Array.from({ length: num }, (_, i) => ({
    id: i + 1,
    username: `${names[i % names.length]} ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?img=${(i+1)%names.length}`,
    email: i % 2 === 0 
      ? `${names[i % names.length].toLowerCase()}${i + 1}@example.com`
      : null,
    role: "Member",
  }));
};

/**
 * Generates an array of fake channel objects
 * @param {number} num - Number of channels to generate
 * @returns {Array<Object>} Array of channel objects
 */
const generateFakeChannels = (num) => {
  return Array.from({ length: num }, (_, i) => ({
    id: `channel-${i + 1}`,
    name: `Channel ${i + 1} ${Math.random().toString(36).substring(7)}`,
  }));
};

/**
 * Generates an array of fake message objects for a specific channel
 * @param {number} num - Number of messages to generate
 * @param {string} channelId - Channel ID to generate messages for
 * @returns {Array<Object>} Array of message objects, sorted by timestamp
 */
const generateFakeMessages = (num, channelId) => {
  const users = [
    { id: "user1", name: "Alice", avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: "user2", name: "Bob", avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: "user3", name: "Charlie", avatar: 'https://i.pravatar.cc/150?img=3'},
    { id: "user4", name: "David", avatar: 'https://i.pravatar.cc/150?img=4' },
  ];

  return Array.from({ length: num }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    return {
      id: `msg-${channelId}-${i + 1}`,
      content: `This is a fake message ${i + 1} in channel ${channelId}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      author: user,
      timestamp: getRandomDate(),
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Demo Data Export Functions
 * These functions expose the fake data generators for development use
 */
export const fetchFakeMembers = () => generateFakeMembers(100);
export const fetchFakeChannels = () => generateFakeChannels(10);
export const fetchFakeMessages = (selectedChannel) => generateFakeMessages(100, selectedChannel);