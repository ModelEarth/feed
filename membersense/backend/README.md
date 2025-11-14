[Home](../)

# MemberSense Backend

The MemberSense backend is a Bun app for the Discord API (and later Microsoft Outlook hopefully) which securely manages private keys in both Github and the .env.local file. Integrated as a Zoom-style grid display within our [FeedPlayer Frontend](https://dreamstudio.com/feed/).

## Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/discord.js-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js">
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

## Component Design 

### Backend 
- **Main Components**:
  - `server.js`: The Bun server that handles incoming requests and interacts with the Discord API.
  - `.env`: Securely stores environment variables like Discord bot token and guild ID.
  - `discordBot.js`: Implements the Discord bot functionality using discord.js.

## Backend Logic 

The backend is built on Bun, a fast all-in-one JavaScript runtime. Here's a breakdown of the main functionalities:

1. **Authentication** 
   - Uses nanoid to generate unique session IDs for each user login.
   - Stores bot instances and tokens in an in-memory Map for quick access.

2. **Discord Bot Integration** 
   - Utilizes discord.js to create and manage bot instances.
   - Implements functions to fetch guild info, members, channels, and messages.

3. **API Endpoints** 
   - `/api/auth/login`: Creates a new bot instance and returns session info.
   - `/api/auth/logout`: Destroys the bot instance and clears the session.
   - `/api/members`: Fetches all members of the Discord server.
   - `/api/channels`: Retrieves all text channels in the server.
   - `/api/messages`: Fetches messages from a specific channel.

4. **Error Handling and Logging** 
   - Implements robust error handling for API requests and Discord interactions.
   - Logs all incoming requests with timestamps and session IDs for debugging.

5. **CORS Support** 
   - Implements CORS headers to allow cross-origin requests from the frontend.

## Data Flow 

1. The React frontend makes API calls to the Bun backend.
2. The backend processes these requests, authenticating the session.
3. For data requests, the backend interacts with the Discord API using the stored bot instance.
4. The backend returns the fetched data to the frontend, which then renders it for the user.

## Directory Structure 

```bash
MemberSense
│
├── backend               # Backend (Bun + Discord bot)
│   ├── server.js         # Main server file
│   ├── .env              # Environment variables (Discord bot token, guild ID)
│   ├── discordBot.js     # Discord bot implementation
│   └── package.json      # Backend dependencies
│
└── README.md             # Project documentation
```

# MemberSense

[Previous sections remain unchanged]

## Backend Setup (Development)

Bun handles dependency isolation per project folder,  
so there is no there is no use of a virtual environment as there is with Python venv. 

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/membersense.git
   cd membersense/backend
   bun install  # installs dependencies into ./node_modules
   ```

2. **Configure environment**  
   Create the `backend/.env` file with your Discord bot token:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   ```
   **Note**: The .gitignore prevents this file from being committed to version control.
3. **Discord Bot Permissions**  
   Ensure your bot has the following permissions:

- View Channels
- Send Messages
- Read Message History
- View Server Insights

4. **Run the server**
   ```bash
   bun run src/server.js
   ```
   Server runs on `http://localhost:3000`.

5. **Development mode**
   ```bash
   bun --hot run src/server.js
   ```

6. **API Endpoints**
   - `POST /api/auth/login`: Authenticate with Discord bot token
   - `GET /api/members`: Fetch guild members
   - `GET /api/channels`: Fetch guild channels
   - `GET /api/messages?channelId=<id>&limit=<num>`: Fetch channel messages
   - `POST /api/auth/logout`: Destroy bot session

   **Authentication**: Include `Authorization` header with session ID for all requests except login.

   **Example Request Flow**:
   ```bash
   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"token":"YOUR_BOT_TOKEN"}'
   
   # Use returned sessionId in subsequent requests
   curl -H "Authorization: SESSION_ID" http://localhost:3000/api/members
   ```

## Deployment Strategy 

1. **Dockerization** 
   - Create optimized Docker images for both the frontend and backend.
   - Use multi-stage builds to minimize image size and improve security.

2. **Cloud Deployment** 
   - Deploy the backend to a scalable cloud platform (e.g., AWS ECS, Google Cloud Run).
   - Host the frontend on a CDN-backed static hosting service for optimal performance.

3. **Local Development** 
   - Utilize Docker Compose for a seamless local development experience.
   - Implement hot-reloading for both frontend and backend during development.

## Future Improvements 

- Implement real-time updates using WebSockets for live Discord data.
- Add functionality to manage member roles and permissions.
- Integrate with Google Sheets API for data export and reporting.
- Implement a caching layer (e.g., Redis) to optimize frequent data requests.
- Add support for multiple Discord servers per user account.

