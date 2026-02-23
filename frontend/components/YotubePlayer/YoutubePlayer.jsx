import { useRef, useEffect, useState } from "react";

const YoutubePlayer = ({ videoID, autoplay = false, className = "" }) => {
  const playerRef = useRef(null);
  const ytPlayer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiLoadedRef = useRef(false);

  useEffect(() => {
    if (!videoID) {
      setError("No video ID provided");
      setLoading(false);
      return;
    }

    // Validate video ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoID)) {
      setError("Invalid YouTube video ID format");
      setLoading(false);
      return;
    }

    const createPlayer = () => {
      try {
        if (!playerRef.current) return;

        // Destroy previous player if exists
        if (ytPlayer.current?.destroy) {
          ytPlayer.current.destroy();
        }

        ytPlayer.current = new window.YT.Player(playerRef.current, {
          height: "100%",
          width: "100%",
          videoId: videoID,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              console.log("✓ YouTube Player Ready");
              setLoading(false);
            },
            onError: (event) => {
              console.error("YouTube Player Error:", event.data);
              const errorMessages = {
                2: "Invalid parameter",
                5: "HTML5 player error",
                100: "Video not found",
                101: "Video not allowed to be played embedded",
                150: "Same as 101",
              };
              setError(errorMessages[event.data] || "Player error");
              setLoading(false);
            },
            onStateChange: (event) => {
              console.log("State Changed:", event.data);
            },
          },
        });
      } catch (err) {
        console.error("Failed to create player:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player && apiLoadedRef.current) {
        createPlayer();
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (existingScript) {
        // Script already loading/loaded
        const checkYT = () => {
          if (window.YT && window.YT.Player) {
            apiLoadedRef.current = true;
            createPlayer();
          } else {
            setTimeout(checkYT, 100);
          }
        };
        checkYT();
        return;
      }

      // Load API script
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;

      const onScriptReady = () => {
        apiLoadedRef.current = true;
      };

      window.onYouTubeIframeAPIReady = onScriptReady;

      tag.onload = () => {
        const checkReady = () => {
          if (window.YT && window.YT.Player) {
            createPlayer();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      };

      tag.onerror = () => {
        setError("Failed to load YouTube API");
        setLoading(false);
      };

      document.body.appendChild(tag);
    };

    loadYouTubeAPI();

    // Cleanup
    return () => {
      if (ytPlayer.current?.destroy) {
        try {
          ytPlayer.current.destroy();
        } catch (e) {
          console.warn("Error destroying player:", e);
        }
      }
    };
  }, [videoID, autoplay]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white rounded ${className}`}
        style={{ aspectRatio: "16/9" }}
      >
        <div className="text-center">
          <p className="text-sm font-semibold">⚠ Video Error</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
          <p className="text-xs text-gray-500 mt-2">Video ID: {videoID}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-black rounded overflow-hidden ${className}`}
      style={{ aspectRatio: "16/9" }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
            <p className="text-white text-xs mt-2">Loading video...</p>
          </div>
        </div>
      )}
      <div ref={playerRef} className="w-full h-full"></div>
    </div>
  );
};

export default YoutubePlayer;
