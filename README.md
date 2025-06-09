<h1 align='center'>FeedPlayer + Swiper - For Images, Video&nbsp;and&nbsp;Text</h1>

<!-- Image and link icon to https://video-player-sahilatahar.netlify.app

[![video-player](https://github.com/sahilatahar/Video-Player/assets/100127570/8315e5d3-9b16-4b37-a50c-141a96f2e72e)](https://video-player-sahilatahar.netlify.app/)
-->

Welcome to our FeedPlayer React Project! This project provides a modern and user-friendly interface for viewing a series of images and video pulled from RSS, JSON, CSV and YAML. The UI is built using Vite, ReactJS, HTML, CSS, and JavaScript. The Feed-Player is designed to be fully responsive and packed with a range of features to enhance your viewing experience with filmstrip navigation using [swiper](https://github.com/modelearth/swiper).

<!-- https://video-player-sahilatahar.netlify.app -->

<!-- [Check out the Live Preview](intro.html) -->
[Check out the FeedPlayer](https://dreamstudio.com/feed/) and [Swiper](https://dreamstudio.com/home/) on DreamStudio.com.

## Feed Samples

[Our FeedPlayer Google Sheet](https://docs.google.com/spreadsheets/d/1jQTlXWom-pXvyP9zuTcbdluyvpb43hu2h7anxhF5qlQ/edit?usp=sharing) provides the APIs loaded. 
[View the feed json directly](view) - The FeedPlayer is being designed to convert APIs, JSON and .CSV into video-like presentations.
[Bluesky RSS Feeds](view/#feed=bsky) - Click "Turn on CORS passthrough". &nbsp;[About Bluesky RSS](https://bsky.app/profile/todex.bsky.social/post/3kj2xcufu5q2q).

<!-- [JSON for video, image and feed links](src/Data/data.js) -->


## Team Projects

Place your name here if you're working on an update.

0.) Add a quick fade between slides, about half a second.

1.) DONE: Provide the specific error than "No media available" for the second SeeClickFix link and others that don't load.  Add a CORS passthrough like we have in the view folder. - by snehit

2.) DONE: Pull the image and video links from a Google Sheet by implementing the Content/ContextGoogle.jsx page which pulls from this [Google Sheet](https://docs.google.com/spreadsheets/d/1jQTlXWom-pXvyP9zuTcbdluyvpb43hu2h7anxhF5qlQ/edit?usp=sharing) - By Gary

<!--
DONE: Add columns for Title and Description in the Google Sheet - Matt B
-->

3.) DONE: New swiper control and text that scrolls in player. - Shreyas

4.) DONE: When an image is narrower than the player, span 100% while retaining the image's ratio. Have the image slowly pan from the top to bottom when portions of it exceed the player height. - Karthik

5.) DONE: Show the progress bar for the feed images. Update the progress bar to include multiple clickable sections when there are sequences of images. We could tap Matt B. who worked with the progress bar previously. - Shreyas

6.) DONE: Membersense development and initial implementation using Discord API - Yunbo

<!-- 
Let's revisit this for a modile orienation.
DONE: Aspect ratio of video remains the same when showing landscape image.--><!--To prevent the video height from jumping short briefly: When setCurrentVideoSrc is called to advance the video, insert the current height until the next video loads. Remove the inserted height once the new slide video/image loads into the DOM. (The last video is an example with a different aspect ratio.)-->

7.) DONE: When reloading retain feed's hash in the URL, and display that feed.
To see bug, hit refresh for the following or load the link directly: 
[Hash example for SeeClickFix](#feed=seeclickfix-311) - the hash values currently disappear when reloading. - [Rodrigo](https://github.com/devrodrigorpm)

8.) DONE: Load images into the FeedPlayer from our [pull from Github](../home/repo/). - Chethan

9.) DONE: Pull NASA feed into React FeedPlayer and show images. - Noopur

10a.) DONE: In Javascript feed/view page, pull in multiple Bluesky RSS feed links by passing in a pipe | separated list of feed urls. Add loop when pipes found in the url value in both JQuery feed/view - Noopur

10b.) TO DO: Check if pipeseperated works for any multi-feed pull [from our Google Sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vSxfv7lxikjrmro3EJYGE_134vm5HdDszZKt4uKswHhsNJ_-afSaG9RoA4oeNV656r4mTuG3wTu38pM/pub?gid=889452679&single=true&output=csv) splits on pipes in the React FeedPlayer to append multiple APIs. Update code if need and update documentation.

11.) IN PROGRESS: Pull the replies for each Bluesky post in the feed. Use the screen-grab technique that we use to grab images from news sites that are listed in the feed. Scrape the posts from the Bluesky website. Grab replies for the top 3 posts. If the process doesn't work, leave the attempt commented out. <!-- Noopur initially. This process worked initially on view page. Maybe Bluesky changed something? -->

12.) DONE: List of feeds on right of player with links to /feed/view/#feed= - Kalyan

13.) DONE: Hide the "link icon" in the upper right unless a video is being viewed. - Jashwanth<!-- confirm-->

14.) DONE: Update Vite to make the player an embeddable widget. - Loren

In the existing code, we tried to automate copying the index-xxxxxxxx.js and index-xxxxxxxx.css files to feedplayer.js and feedplayer.css within [dist/assets](https://github.com/ModelEarth/feed/tree/main/dist/assets).  We replaced vite.config.js with vite.config-upcoming.js, but it's not working yet (the copy might run before the build completes).  Once generating a consistant .js and .css file name, edit feed/intro.html to use feedplayer.js and feedplayer.css (or whatever .js file name is standard for a Vite widget).  Also adjust so the widget can be played on the main feed/index.html page. Marco shared a link to [How to copy images in DIST folder from assets in Vite js](https://stackoverflow.com/questions/78076268/how-to-copy-images-in-dist-folder-from-assets-in-vite-js)



## Features

&#9658; &nbsp; Play/Pause: Easily start and pause the playback with a single click.  
&#9632; &nbsp; Stop: Stop the feed playback and reset it to the beginning.  
🔊 &nbsp; Volume Control: Adjust the volume level to your preference by increasing or decreasing the volume.  
🔇 &nbsp; Mute: Quickly mute or unmute the feed's audio with the mute button.  
&#9970; &nbsp; Full-Screen: Enjoy your videos in full-screen mode for an immersive viewing experience.  
&#9202; &nbsp; Remaining Time: The FeedPlayer will display the remaining time of the current feed.  
&#9654; &nbsp;Navigation: Seamlessly navigate to the next or previous item in the playlist.  
&#128250; &nbsp; Play by URL: Paste a feed URL to play any valid feed format directly from the web. (Coming soon)

## New UI and Controls

The Feed-Player interface that is both visually appealing and intuitive to use. The controls have been thoughtfully designed by to provide easy access to the various functionalities while keeping the user experience smooth and engaging.

## Getting Started

To contribute, fork these 3 repos (and sync often):
[localsite](https://github.com/ModelEarth/localsite)
[feed](https://github.com/ModelEarth/feed)
[swiper](https://github.com/ModelEarth/swiper)

Then clone into your website root using Github Desktop.

If you're NOT making code updates, you can clone without forking using these commands:

      git clone https://github.com/[your account]/localsite.git
      git clone https://github.com/[your account]/feed.git
      git clone https://github.com/[your account]/swiper.git

Run the [start site command](https://dreamstudio.com/localsite/start/steps/) in your website root to view locally at [http://localhost:8887/feed](http://localhost:8887/feed) 

      python -m http.server 8887

### The primary FeedPlayer pages will be visible here:

[FeedPlayer - localhost:8887/feed](http://localhost:8887/feed/)
[Feed API View - localhost:8887/feed/view](http://localhost:8887/feed/view/)

### Folders in your website root

```ini
website
├─ home
├─ localsite
├─ swiper
└─ feed
   ├─ README.md
   ├─ dist
   ├─ src
   ├─ view
   ├─ package.json
   ├─ vite.config.js
   └─ .gitignore
```

Also see the [MemberSense directory structure](membersense).

## Edit and build the "feed" project locally

### 1. Navigate into the feed directory:

```
cd feed
```

If you don't have yarn yet, install it with `npm install --global yarn`
You can check if you have yarn with `yarn --version`

### 2. Install the required dependencies:

Check if yarn is installed:

```
yarn --version
```

Install yarn if you don't have it yet:

```
npm install --global yarn
```

Install the required dependecies:

```
yarn
```

If the package-lock.json file change significantly, revert and
try this yarn install command:

```
yarn install --immutable --immutable-cache --check-cache
```

The command above requires yarn 2 and prevents third-parties from altering the checked-in packages before submitting them. [Source](https://stackoverflow.com/questions/58482655/what-is-the-closest-to-npm-ci-in-yarn).  
It's the equivalent to `npm ci` to avoid updating package-lock.json, which occurs with `npm install`.

### 3. Start a development server (optional)

<!--Skip this step. Port 5173 does not currently work because the files are looking for a base path containing "feed".-->

```
yarn dev
```

Or you can skip "yarn dev" and view at [http://localhost:8887/feed/dist](http://localhost:8887/feed/dist)

<!--
Since we might include /feed in the base path, the FeedPlayer may not always work at: [localhost:5173/dist](http://localhost:5173/dist/)
-->

### 4. Build the app to the dist folder

```
yarn build
```

View at: [http://localhost:8887/feed](http://localhost:8887/feed/) and [http://localhost:8887/feed/dist](http://localhost:8887/feed/dist)

After building, you may need to manually edit the index-xxxx.js and index-xxxx.css links in intro.html.

## Deploy for Review using Github Pages

Deploy to your fork on GitHub and turn on GitHub Pages for localsite and feed.

Your updates can now be reviewed at:

https://[your account].github.io/feed  
https://[your account].github.io/feed/dist

## About model.earth localsite navigation

We included [localsite navigation](https://model.earth/localsite/) using the following two lines. It's non-relative so changes to the base path won't break the nav. [Source](https://model.earth/localsite/start/).
Another option would be to add localsite as a [submodule](https://model.earth/localsite/start/submodules) or add the localsite github path to the package.json file.

      <link type="text/css" rel="stylesheet" href="https://model.earth/localsite/css/base.css" id="/localsite/css/base.css" />
      <script type="text/javascript" src="https://model.earth/localsite/js/localsite.js?showheader=true"></script>

## Technologies Used

- ReactJS: Building the user interface and managing component-based architecture.
- Vite: Fast and lightweight frontend tooling for development.
- HTML: Structuring the content and layout of the video player.
- CSS and SCSS: Styling the UI components and ensuring responsiveness.
- JavaScript: Adding interactivity and logic to the video player functionality.

Vite is preferable to Create React App (CRA) because Vite does not rebuild the whole app whenever changes are made. It splits the app into two categories: dependencies and source code. Dependencies do not change often during the development process, so they are not rebuilt each time thanks to Vite.

## Contributions

Contributions to the [Feed-Player Github Repo](https://github.com/modelearth/feed/) are welcome! If you have any improvements, bug fixes, or additional features in mind, feel free to fork this repository, make your changes, and submit a pull request.

## License

This project is licensed under the [MIT License](https://github.com/ModelEarth/feed/blob/main/LICENSE),  
which means you are free to use, modify, and distribute the code as you see fit.

---

We hope you enjoy using the Feed-Player!

If you have any questions, requests or feedback, please post an issue in our
[FeedPlayer repo](http://github.com/modelearth/feed) or the parent [Video Player repo](https://github.com/sahilatahar/Video-Player).

Happy feed viewing! 🎥🍿
