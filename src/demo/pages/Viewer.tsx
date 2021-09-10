import * as React from 'react';
import StreamStudioClient from '../../lib';

const Viewer = () => {
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

                <button id="btnJoin">Show</button>
                <button id="btnUnJoin">Stop</button>
            </div>           
        </>

    )
}

export default Viewer;