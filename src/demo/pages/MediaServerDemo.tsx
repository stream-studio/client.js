import * as React from 'react';
import  { useState, useRef, useCallback } from 'react';
import StreamStudioClient  from '../../lib';
import { StreamStudioClientApi }  from '../../lib';

import MediaClient  from '../../lib/media';

let peerConnection : RTCPeerConnection = null;

const MediaServerDemo = () => {
    const mediaClient = useRef<MediaClient>(new MediaClient("ws://localhost:8000/ws"));
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

                <button id="btnJoin" onClick={ () => {
                    mediaClient.current.createStream().then(stream => {
                        stream.createReceiver().then(receiver => {

                            peerConnection = new RTCPeerConnection({
                                iceServers: [
                                    {urls: "stun:stun.l.google.com:19302"},
                                ]
                            });
                            peerConnection.onicecandidate = (candidate) => {
                                receiver.addIceCandidate(candidate.candidate);
                                
                            }

                            receiver.on("remoteDescription", (description) => {
                                peerConnection.setRemoteDescription(description).then( () => {
                                    peerConnection.createAnswer().then((answer) => {
                                        peerConnection.setLocalDescription(answer);
                                        receiver.sendAnswer(answer);
                                    })
                                });
                            });

                            receiver.on("iceCandidate", (candidate) => {
                                peerConnection.addIceCandidate(candidate);
                            });                            

                            peerConnection.ontrack = function(event) {
                                (document.getElementById("video") as HTMLVideoElement).srcObject = event.streams[0];
                            };
                            receiver.start();
                            

                        });
                    });
                }}>Show</button>
                <button id="btnUnJoin">Stop</button>
            </div>           
        </>
    );
}

export default MediaServerDemo;