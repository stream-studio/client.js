import * as React from 'react';
import MediaClient  from '../../lib/media';

const Viewer = () => {
    const mediaClient = React.useRef<MediaClient>(new MediaClient("ws://localhost:8000/ws"));
    return (
        <>
            <div className="video">
                <video id="video" autoPlay controls></video>
            </div>
            <div className="rightBar">
                <h1>Preview video</h1>
                Select room : 
                <label htmlFor="txtRoomId">Room ID : </label><input type="text" id="txtRoomId" />  
                <label htmlFor="txtExternalId">External ID : </label><input type="text" id="txtExternalId" />  

                <button id="btnJoin" onClick={ () => mediaClient.current.createStream()}>Show</button>
                <button id="btnUnJoin">Stop</button>
            </div>           
        </>

    )
}

export default Viewer;