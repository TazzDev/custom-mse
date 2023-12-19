import { useRef, useState } from "react";
import "./App.css";
import { MIME_STRING } from "./constants";

const loadStaticMP4 = (event, videoElementRef) => {
  /**
   * Just in case if the DOM Ref is not updated
   */
  if (!videoElementRef?.current) {
    return;
  }

  const STATIC_VIDEO_URL = "static.mp4";

  /**
   * Throw a console error in case the context (Browser / Device / Environment) does not support MSE APIs.
   */
  if (!window.MediaSource) {
    console.error("The Media Source Extensions API is not supported.");
    return;
  }

  /**
   * If the MIME type is supported
   */
  if (!MediaSource.isTypeSupported(MIME_STRING)) {
    console.error("MediaType is not supported");
    return;
  }

  // Create a new MediaSource (MSE API) instance
  const mediaSource = new MediaSource();

  /**
   * The HTML video still needs a 'src' attribute and we're creating a mock / fake src URL to be passed there
   * This is to make the video input from segment arrays and not a URL per-se.
   * To-Do: Read up on why this is done - seems redundant to still set the src.
   */
  videoElementRef.current.src = URL.createObjectURL(mediaSource);

  /**
   * So whenever a media source instance has been opened by a media element - in this case I'm assuming the video element
   * it would fire a source open event and we then make a request for an ArrayBuf format of the asset
   */
  mediaSource.addEventListener("sourceopen", sourceOpen);

  function sourceOpen(e) {
    // Refer above to understand why we revoke the existing source URI
    URL.revokeObjectURL(videoElementRef.current.src);

    /**
     * We may as well use the mediaSource const above but
     * just to make sure all the changes are up to date
     * we extract it from the event
     */
    const updatedMediaSourceObject = e.target;

    /**
     * Create a source buffer with the MIME type of the asset
     */
    const sourceBuffer = updatedMediaSourceObject.addSourceBuffer(MIME_STRING);

    /**
     * So an 'update' event is fired whenever buffer is updated
     * And 'updateend' after the update event
     */
    sourceBuffer.addEventListener("updateend", updateEnd);

    fetch(STATIC_VIDEO_URL)
      .then(function (response) {
        return response.arrayBuffer();
      })
      .then(function (arrayBuffer) {
        sourceBuffer.appendBuffer(arrayBuffer);
      });
  }

  function updateEnd(e) {
    if (mediaSource.readyState === "open") {
      mediaSource.endOfStream();
    }
  }
};

function App() {
  // Ref to the video DOM element
  const videoEl = useRef();

  // Control bar visibility flag
  const [controlBarVisible, setControlBarVisible] = useState(false);

  const ControlBar = () => (
    <div
      style={{
        width: "80%",
        padding: "2% 0",
        display: "flex",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
        position: "absolute",
        margin: "5% 10%",
        borderRadius: "10px",
        transition: "0.3s",
        bottom: "20%",
      }}
    >
      <button
        style={{ padding: "2px", margin: "4px" }}
        onClick={() => videoEl?.current.play()}
      >
        Play
      </button>
      <button
        style={{ padding: "2px", margin: "4px" }}
        onClick={() => videoEl?.current.pause()}
      >
        Pause
      </button>
    </div>
  );

  return (
    <div
      className="App"
      style={{
        height: "100%",
        background: "grey",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <button
        onClick={(e) => loadStaticMP4(e, videoEl)}
        style={{
          border: "none",
          borderRadius: "5px",
          padding: "4px",
          cursor: "pointer",
        }}
      >
        Load static MP4
      </button>
      <div
        style={{ width: "50%", height: "70%", position: "relative" }}
        onMouseEnter={() => setControlBarVisible(true)}
        onMouseLeave={() => setControlBarVisible(false)}
      >
        <video
          height="90%"
          width="90%"
          ref={videoEl}
          onClick={(e) =>
            videoEl?.current.paused
              ? videoEl?.current.play()
              : videoEl?.current.pause()
          }
        ></video>
        {controlBarVisible && <ControlBar />}
      </div>
    </div>
  );
}

export default App;
