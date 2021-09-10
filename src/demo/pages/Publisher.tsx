import * as React from 'react';
import StreamStudioClient from '../../lib';

const Publisher = () => {
    return (
        <>
            <div className="video">
                <div className="live"><div className="liveIcon"></div>Live</div>
                <video id="video" playsInline autoPlay></video>
            </div>
            <div className="rightBar">
                <h1>Publish video</h1>
                 
                <div id="initStream">
                    <form>
                        <label htmlFor="selectVideoInputDevices">Camera selection</label>
                        <div className="selectContainer">
                            <select id="selectVideoInputDevices">   
                            </select>
                        </div>
                        
                        <label htmlFor="selectVideoInputDevices">Micro selection</label>
                        <div className="selectContainer">
                            <select id="selectAudioInputDevices">   
                            </select>
                        </div>


                        <label htmlFor="txtRoomId">Room id</label>
                        <input type="text" id="txtRoomId" />
                    </form>
                    
                    <button id="btnStartPublish">Start streaming</button>
                    <button id="btnStats">Get stats</button>
                    

                </div>
                <div id="streamInfo">
                    
                    
                    <p>Your room id is <span id="roomId"></span></p>
                    <button id="btnStopPublish">Stop streaming</button>

                    <button id="btnPauseVideo">Pause video</button>
                    <button id="btnPauseAudio">Pause audio</button>

                    <button id="btnPlayVideo">Play video</button>
                    <button id="btnPlayAudio">Play audio</button>                    

                </div>                
            </div>            
        </>
    )
}

export default Publisher;