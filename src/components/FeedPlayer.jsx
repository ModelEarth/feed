import React, { useEffect, useState } from "react";
import axios from "axios";

const FeedPlayer = ({ feedUrls }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const extractFields = (item) => {
    if (item.media) {
      return {
        title: item.summary || "Untitled Issue",
        description: `${item.description || ""}\n\nLocation: ${item.address || ""}`,
        image: item.media.image_full || item.media.representative_image_url || "",
        date: new Date(item.created_at).toLocaleDateString(),
        status: item.status,
        address: item.address,
      };
    }
    return {
      title: item.title || item.summary || item.name || "Untitled",
      description: item.description || item.text || item.content || "",
      image: item.image_url || (item.media && item.media.image_full) || item.url || "",
      date: item.date || item.created_at || "",
    };
  };

  // Defensive hash handling: set hash to first feed if missing
  useEffect(() => {
    if (!window.location.hash || !window.location.hash.includes("feed=")) {
      // Only set hash if not present
      const defaultFeed = "seeclickfix-311"; // or use your preferred default
      window.location.hash = `feed=${defaultFeed}`;
    }
  }, []);

  useEffect(() => {
    const fetchFeeds = async () => {
      setLoading(true);
      setError(null);
      let allItems = [];
      try {
        let urls = [];
        const input = (feedUrls || "").trim();
        const urlParts = input.split(/[|]|(?=seeclickfix\.com)/);
        urlParts.forEach(part => {
          try {
            part = part.trim();
            if (!part) return;
            if (!part.includes('seeclickfix.com/api/v2/issues')) {
              console.warn("Skipping invalid URL part:", part);
              return;
            }
            const latMatch = /lat=([\d.-]+)/.exec(part);
            const lngMatch = /lng=([\d.-]+)/.exec(part);
            if (!latMatch || !lngMatch) {
              console.warn("Missing coordinates in URL part:", part);
              return;
            }
            const lat = latMatch[1];
            const lng = lngMatch[1];
            const params = new URLSearchParams();
            params.set("lat", lat);
            params.set("lng", lng);
            params.set("per_page", "100");
            const apiUrl = `https://seeclickfix.com/api/v2/issues?${params.toString()}`;
            urls.push(apiUrl);
            console.log("Processed URL:", apiUrl);
          } catch (err) {
            console.error("Error processing URL part:", err.message, "Part:", part);
          }
        });
        if (!urls.length) {
          throw new Error("No valid SeeClickFix URLs found. Please check the URL format.");
        }
        console.log("Processing URLs:", urls);
        for (const apiUrl of urls) {
          try {
            console.log("Fetching from:", apiUrl);
            const response = await axios.get(apiUrl);
            const issues = Array.isArray(response.data.issues) ? response.data.issues : [];
            if (!issues.length) {
              console.warn("No issues array in response for URL:", apiUrl);
              continue;
            }
            const itemsWithImages = issues.filter(item => item.media && (item.media.image_full || item.media.representative_image_url));
            console.log(`Found ${itemsWithImages.length} items with images from ${apiUrl}`);
            const data = itemsWithImages.slice(0, 5);
            allItems = allItems.concat(data);
          } catch (err) {
            console.error("Error fetching feed:", err.message, "URL:", apiUrl);
            continue;
          }
        }
        if (allItems.length === 0) {
          throw new Error("No items found with images. Please check the coordinates or try different locations.");
        }
        setItems(allItems);
      } catch (err) {
        console.error("Feed error:", err);
        setError(err.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeeds();
  }, [feedUrls]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red", padding: "1rem" }}>Error: {error}</div>;
  if (!Array.isArray(items) || !items.length) return <div>No items found with images</div>;
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {items.map((item, idx) => {
        const { title, description, image, date, status } = extractFields(item);
        const isSeeClickFix = !!item.media;
        return (
          <div key={idx} style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            margin: "16px 0",
            padding: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            {image && (
              <div style={{ marginBottom: "16px" }}>
                <img 
                  src={image} 
                  alt={title} 
                  style={{ 
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "4px"
                  }} 
                />
              </div>
            )}
            <h3 style={{ 
              margin: "0 0 8px 0",
              color: "#333",
              fontSize: "1.2rem"
            }}>{title}</h3>
            {isSeeClickFix && status && (
              <div style={{
                display: "inline-block",
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: status === "Acknowledged" ? "#e3f2fd" : "#f5f5f5",
                color: "#666",
                fontSize: "0.9rem",
                marginBottom: "8px"
              }}>
                {status}
              </div>
            )}
            <p style={{ 
              margin: "8px 0",
              color: "#666",
              whiteSpace: "pre-wrap"
            }}>{description}</p>
            {date && (
              <small style={{ 
                display: "block",
                color: "#999",
                marginTop: "8px"
              }}>{date}</small>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FeedPlayer;