import { useRef} from "react";
import "./Popup.scss";
import PropType from "prop-types";

export default function Popup({ setVideoData, setSelectedOption }) {
  const srcInputRef = useRef(null);
  const handlePlay = async () => {
    if (!(await validateVideoUrl(srcInputRef.current.value))) return alert("Invalid URL");

    if (srcInputRef.current.value) {
      setVideoData({
        url: srcInputRef.current.value,
        text: "No description available",
        title: srcInputRef.current.value.split("/").pop(),
      });
    }
    setSelectedOption("");
  };

  async function validateVideoUrl(url) {
    const videoExtensions = [".mp4", ".webm", ".avi", ".mov"]; // List of common video extensions

    // Check if the URL ends with a valid video extension
    const urlLower = url.toLowerCase();
    if (videoExtensions.some((ext) => urlLower.endsWith(ext))) {
      return true;
    }

    // Make a HEAD request to check Content-Type header
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.startsWith("video/")) {
          return true;
        }
      }
    } catch (error) {
      // Handle fetch error
      console.error("Error checking URL:", error);
    }
    return false;
  }

  return (
    <>
      <div className="Popup-wrapper" onClick={() => setSelectedOption("")}>
        <div className="Popup" onClick={(e) => e.stopPropagation()}>
          <h1>Paste your video URL</h1>
          <input type="text" placeholder="Enter video URL (should end with .mp4, .mkv, etc.)" ref={srcInputRef} />
          <button className="play-btn" onClick={handlePlay}>
            Play
          </button>
        </div>
      </div>
    </>
  );
}

Popup.propTypes = {
  setVideoData: PropType.func.isRequired, 
  setSelectedOption: PropType.func.isRequired,
};
