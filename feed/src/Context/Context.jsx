import { createContext, useState } from "react";
import PropTypes from 'prop-types';
import { videosURLs } from "../Data/data";

const VideoContext = createContext();

export default function VideoContextProvider({ children }) {

    const [videoList, setVideoList] = useState(videosURLs);
    const [currentVideoSrc, setCurrentVideoSrc] = useState(videoList[0]);

    return (
        <VideoContext.Provider value={{ videoList, setVideoList, currentVideoSrc, setCurrentVideoSrc }}>
            {children}
        </VideoContext.Provider>
    );
}

VideoContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
}

export { VideoContext }