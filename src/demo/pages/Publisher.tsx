import * as React from 'react';
import  { useState, useRef, useCallback } from 'react';
import StreamStudioClient  from '../../lib';
import { StreamStudioClientApi }  from '../../lib';

const Publisher = () => {
    
    const [videoDevices, setVideoDevices] = useState([])
    const [audioDevices, setAudioDevices] = useState([])

    const [isStreaming, setIsStreaming] = useState(false)

    const [currentVideo, setCurrentVideo] = useState(null);
    const [currentAudio, setCurrentAudio] = useState(null);
    const client = useRef<StreamStudioClient>(null);
    const apiClient = useRef<StreamStudioClientApi>(null);

    const switchVideo = (index: any) => {
        client.current.switchVideoDevice(videoDevices[index]);
        setCurrentVideo(index);
    }

    const switchAudio = (index: any) => {
        client.current.switchAudioDevice(audioDevices[index]);
        setCurrentAudio(index)
    }

    const previewElement = useCallback(node => {
        if (node !== null) {
            client.current = new StreamStudioClient("ws://localhost:8000", "");
            apiClient.current = new StreamStudioClientApi("http://localhost:8000", "fcf6d090-9ad2-4c0f-8101-c0595a2feab4")
            client.current.connect();

            client.current.setPreviewElement(node);
            client.current.startPreview();

            client.current.getVideoInputDevices().then( (videoDevices) => {    
                    setVideoDevices(videoDevices)
                    switchVideo(0);

                    client.current.getAudioInputDevices().then( (audioDevices) => {
                        switchAudio(0);
                        setAudioDevices(audioDevices);
                        client.current.startPreview();
                    }); 

            });
        }
    }, []);


    return (
        <>
            <div className="video">
                <div className="live"><div className="liveIcon"></div>Live</div>
                <video ref={previewElement} playsInline autoPlay></video>
            </div>
            <div className="rightBar">
                <h1>Publish video</h1>
                 
                <div id="initStream">
                    <form>
                        <label htmlFor="selectVideoInputDevices">Camera selection</label>
                        <div className="selectContainer">
                            <select id="selectVideoInputDevices" onChange={ (event) => switchVideo(event.target.value) } value={currentVideo} >  
                               {videoDevices.map((object, i) => <option value={i} key={i}>{object.label}</option>)}
                            </select>
                        </div>
                        
                        <label htmlFor="selectVideoInputDevices">Micro selection</label>
                        <div className="selectContainer">
                        <select id="selectAudioInputDevices" onChange={ (event) => switchAudio(event.target.value) } value={currentAudio}>  
                               {audioDevices.map((object, i) => <option value={i} key={i}>{object.label}</option>)}
                            </select> 
                        </div>


                        <label htmlFor="txtRoomId">Room id</label>
                        <input type="text" id="txtRoomId" readOnly={true} />
                    </form>
                    
                    
                    { !isStreaming &&  <button onClick={ async () => { let resp = await apiClient.current.createRoom("aaaa"); client.current.startPublishing((await resp.json())["_id"]); setIsStreaming(true); }}>Start streaming</button> }
                    { isStreaming && <button onClick={ () => { client.current.stopPublishing(); setIsStreaming(false); }}>Stop streaming</button> }
                    <button id="btnStats" onClick={ () => client.current.getStats() }>Get stats</button>
                    

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