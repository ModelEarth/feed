/* eslint-disable no-unused-vars */
import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Papa from "papaparse";

const Context = createContext();

export default function ContextProvider({ children }) {
  const [mediaList, setMediaList] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);

  //I am creating a sample feedlist state to fetch the data
  // const [feedlist, setFeedlist] = useState([]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // Pulls from this Google Sheet: https://docs.google.com/spreadsheets/d/1jQTlXWom-pXvyP9zuTcbdluyvpb43hu2h7anxhF5qlQ/edit?usp=sharing
        // Add comments in the sheet above to request additions.
        const response = await axios.get(
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vSxfv7lxikjrmro3EJYGE_134vm5HdDszZKt4uKswHhsNJ_-afSaG9RoA4oeNV656r4mTuG3wTu38pM/pub?output=csv"
        );
        //This link i am using to get the feed list form the google spread sheet
        const sampleResponse = await axios.get(
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vSxfv7lxikjrmro3EJYGE_134vm5HdDszZKt4uKswHhsNJ_-afSaG9RoA4oeNV656r4mTuG3wTu38pM/pub?gid=889452679&single=true&output=csv"
        );
        //console.log("fetched sample data from the spread sheet", sampleResponse.data);
        Papa.parse(sampleResponse.data, {
          header: true, // Assuming your CSV has headers
          complete: (results) => {
            const feedMedia = results.data
              .filter((row) => row.Text === "TRUE")
              .map((row) => ({
                feed: row.Feed,
                title: row.Title,
                text: row.Text,
                description: row.Description,
                url: row.URL,
              }));
            console.log("Fetched media: from sample sheet", feedMedia); // Log the fetched media
            setMediaList(feedMedia);
            // if (feedMedia.length > 0) {
            //     setCurrentMedia(feedMedia[0]); // Set the first media item as the current media
            // }
          },
        });
      } catch (error) {
        console.error("Error fetching media:", error);
      }
    };

    fetchMedia();
  }, []);

  return (
    <Context.Provider
      value={{
        mediaList,
        setMediaList,
        currentMedia,
        setCurrentMedia,
      }}
    >
      {children}
    </Context.Provider>
  );
}

ContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { Context };
