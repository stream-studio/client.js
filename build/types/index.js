var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import "core-js/stable";
import "regenerator-runtime/runtime";
import Hls from "hls.js";
var StreamStudioClient = /** @class */ (function () {
    function StreamStudioClient(url, externalId) {
        this.url = url;
        this.externalId = externalId;
        this.isVideoMuted = false;
        this.isAudioMuted = false;
        this.element = null;
        this.audioInputDevice = null;
        this.videoInputDevice = null;
        this.peerConnection = null;
        this.eventListenerList = [];
        this.webSocketUrl =
            this.url.replace("https://", "wss://").replace("http://", "ws://") +
                "/api/ws";
        this.hls = null;
        this.lastQualityChange = new Date();
        this.currentQuality = 5;
        this.qualitySwitchInterval = null;
        this.qualities = [
            { quality: 720, bitrate: 3000 * 1000 },
            { quality: 540, bitrate: 2500 * 1000 },
            { quality: 540, bitrate: 2000 * 1000 },
            { quality: 480, bitrate: 1700 * 1000 },
            { quality: 480, bitrate: 1300 * 1000 },
            { quality: 480, bitrate: 1000 * 1000 },
            { quality: 360, bitrate: 600 * 1000 },
            { quality: 360, bitrate: 400 * 1000 },
            { quality: 240, bitrate: 200 * 1000 },
            { quality: 240, bitrate: 100 * 1000 },
            { quality: 180, bitrate: 10 * 1000 },
        ];
    }
    StreamStudioClient.prototype.connect = function () {
        var _this = this;
        this.webSocket = new WebSocket(this.webSocketUrl);
        this.webSocket.onopen = function (event) {
            _this.webSocket.send(JSON.stringify({
                action: "client/connect",
                params: { id: _this.externalId },
            }));
            _this.fireEvent({ action: "client/ready" });
        };
        this.webSocket.onclose = function (e) {
            _this.fireEvent({
                action: "client/disconnected",
                params: { code: e.code, reason: e.reason },
            });
        };
        this.webSocket.onerror = function (e) {
            _this.fireEvent({ action: "client/error" });
        };
        this.webSocket.onmessage = function (e) {
            var msg = JSON.parse(e.data);
            if ("action" in msg &&
                msg.action !== "room/publish" &&
                msg.action !== "room/unpublish" &&
                msg.action !== "room/updated" &&
                msg.action !== "rooms/stats" &&
                msg.action !== "room/deleted" &&
                msg.action !== "room/created" &&
                msg.action !== "room/error") {
                if ("sdp" in msg) {
                    _this.peerConnection.setRemoteDescription(msg.sdp).then(function () {
                        _this.peerConnection
                            .createAnswer()
                            .then(function (anwser) {
                            _this.peerConnection.setLocalDescription(anwser).then(function () {
                                _this.webSocket.send(JSON.stringify({
                                    action: "signaling",
                                    params: { sdp: anwser },
                                }));
                            });
                        })
                            .catch(function (error) {
                            _this.fireEvent({
                                action: "room/error",
                                params: { code: 2000, reason: "Negociation error " + error },
                            });
                        });
                    });
                }
            }
            else if ("ice" in msg) {
                _this.peerConnection.addIceCandidate(msg.ice);
            }
            else if (msg.action == "room/join") {
            }
            else if (msg.action == "room/join") {
                if (_this.element != null) {
                    if (Hls.isSupported()) {
                        _this.hls = new Hls({
                            enableWorker: true,
                            liveBackBufferLength: 900,
                        });
                        _this.hls.loadSource(msg.params["hls"]);
                        _this.hls.attachMedia(_this.element);
                        _this.hls.on(Hls.Events.MEDIA_ATTACHING, function () {
                            _this.element.play();
                        });
                        _this.fireEvent({ action: "room/joined", params: msg.params });
                    }
                    else if (_this.element.canPlayType("application/vnd.apple.mpegurl")) {
                        _this.element.src = msg.params["hls"];
                        _this.element.addEventListener("canplay", function () {
                            _this.element.play();
                        });
                        _this.fireEvent({ action: "room/joined", params: msg.params });
                    }
                    else {
                        _this.fireEvent({
                            action: "room/error",
                            params: { code: 1000, reason: "Can't start hls player" },
                        });
                    }
                }
            }
            else if (msg.action === "room/slow-link") {
                _this.fireEvent({ action: "room/slow-link", params: {} });
                if (Math.floor((new Date().getTime() - _this.lastQualityChange.getTime()) / 1000) >= 10) {
                    var nextQuality = _this.currentQuality + 1;
                    if (nextQuality < _this.qualities.length)
                        var sender = _this.peerConnection.getSenders().find(function (s) {
                            return s.track.kind == "video";
                        });
                    _this.currentQuality = nextQuality;
                    _this.setVideoParams(sender, _this.qualities[_this.currentQuality].quality, _this.qualities[_this.currentQuality].bitrate);
                    _this.lastQualityChange = new Date();
                    _this.fireEvent({
                        action: "room/switch-quality",
                        params: _this.qualities[_this.currentQuality],
                    });
                    _this.webSocket.send(JSON.stringify({ action: "room/ask-keyframe" }));
                }
            }
            else {
                _this.fireEvent(msg);
            }
        };
    };
    StreamStudioClient.prototype.fireEvent = function (data) {
        this.eventListenerList.forEach(function (callback) {
            callback(data);
        });
    };
    StreamStudioClient.prototype.addEventListener = function (callback) {
        this.eventListenerList.push(callback);
    };
    StreamStudioClient.prototype.removeEventListener = function (callback) {
        var index = this.eventListenerList.indexOf(callback);
        if (index > -1) {
            this.eventListenerList.splice(index, 1);
        }
    };
    StreamStudioClient.prototype.getVideoInputDevices = function () {
        return this.getDevices("videoinput");
    };
    StreamStudioClient.prototype.getAudioInputDevices = function () {
        return this.getDevices("audioinput");
    };
    StreamStudioClient.prototype.getStats = function () {
        this.webSocket.send(JSON.stringify({ action: "rooms/stats" }));
    };
    StreamStudioClient.prototype.join = function (roomId, externalId) {
        if (roomId !== null && roomId !== undefined) {
            this.webSocket.send(JSON.stringify({ action: "room/join", params: { room: roomId } }));
        }
        else {
            throw new Error("roomId and externalId must be not null");
        }
    };
    StreamStudioClient.prototype.stop = function () {
        this.webSocket.send(JSON.stringify({ action: "room/unjoin" }));
        if (this.hls !== null) {
            this.hls.stopLoad();
            if (this.element !== null) {
                this.element.src = null;
            }
        }
    };
    StreamStudioClient.prototype.unJoin = function () {
        this.stop();
    };
    StreamStudioClient.prototype.setPreviewElement = function (element) {
        this.element = element;
    };
    StreamStudioClient.prototype.getDeviceStream = function () {
        var constraints = {};
        if (this.audioInputDevice != null) {
            constraints.audio = {
                deviceId: { exact: this.audioInputDevice.deviceId },
            };
        }
        else {
            constraints.audio = true;
        }
        if (this.videoInputDevice != null) {
            constraints.video = {
                deviceId: { exact: this.videoInputDevice.deviceId },
            };
        }
        else {
            constraints.video = true;
        }
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                resolve(stream);
            }, function (error) {
                reject(error.message);
            });
        });
    };
    StreamStudioClient.prototype.startPreview = function (stream) {
        var _this = this;
        if (this.element != null) {
            if (stream === undefined || stream === null) {
                this.getDeviceStream()
                    .then(function (stream) {
                    _this.element.srcObject = stream;
                    _this.element.muted = true;
                })
                    .catch(function (error) {
                    console.log("error");
                });
            }
            else {
                this.element.srcObject = stream;
                this.element.muted = true;
            }
        }
        else {
            throw new Error("Preview Element must be set");
        }
    };
    StreamStudioClient.prototype.testSwitchQuality = function () {
        if (this.currentQuality > 0) {
            if (Math.floor((new Date().getTime() - this.lastQualityChange.getTime()) / 1000) > 90) {
                var sender = this.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == "video";
                });
                this.currentQuality = this.currentQuality - 1;
                this.setVideoParams(sender, this.qualities[this.currentQuality].quality, this.qualities[this.currentQuality].bitrate);
                this.lastQualityChange = new Date();
                this.fireEvent({
                    action: "room/switch-quality",
                    params: this.qualities[this.currentQuality],
                });
                this.webSocket.send(JSON.stringify({ action: "room/ask-keyframe" }));
            }
        }
    };
    StreamStudioClient.prototype.startPublishing = function (roomId) {
        var _this = this;
        if (roomId !== null && roomId !== undefined) {
            if (this.element.srcObject.getTracks().length == 2) {
                this.peerConnection = new RTCPeerConnection({
                    iceServers: [
                        {
                            urls: "stun:stun.l.google.com:19302",
                        },
                        {
                            urls: "turns:live-1.axdrp.onpremise.stream.studio:5349",
                            username: "studio",
                            credential: "n56MWdt2F",
                        },
                    ],
                    bundlePolicy: "max-compat",
                });
                this.element.srcObject.getTracks().forEach(function (track) {
                    _this.peerConnection.addTrack(track, _this.element.srcObject);
                });
                this.qualitySwitchInterval = setInterval(this.testSwitchQuality.bind(this), 1000);
                this.peerConnection.createOffer().then(function (offer) {
                    var h264 = false;
                    if (offer.sdp.includes("H264") || offer.sdp.includes("h264")) {
                        h264 = true;
                    }
                    else if (offer.sdp.includes("VP8") || offer.sdp.includes("vp8")) {
                        h264 = false;
                    }
                    else {
                        _this.fireEvent({
                            action: "room/error",
                            params: { code: 2001, reason: "Imcomptible codecs " },
                        });
                    }
                    _this.webSocket.send(JSON.stringify({
                        action: "room/publish",
                        params: { room: roomId, h264: h264 },
                    }));
                });
                this.peerConnection.onsignalingstatechange = function (event) { };
                this.peerConnection.onconnectionstatechange = function (event) {
                    switch (_this.peerConnection.connectionState) {
                        case "connected":
                            console.log("Stream Studio : Now connected");
                            break;
                        case "disconnected":
                            console.log("Stream Studio : Disconnected");
                            //this.closePeerConnection();
                            break;
                        case "failed":
                            console.log("Stream Studio : Connection failed");
                            break;
                        case "closed":
                            console.log("Stream Studio : Connection closed");
                            break;
                    }
                };
                this.peerConnection.oniceconnectionstatechange = function (event) {
                    if (_this.peerConnection.iceConnectionState === "failed") {
                        _this.fireEvent({
                            action: "room/error",
                            params: {
                                code: 2002,
                                reason: "Failed to publish connect to server (ICE)",
                            },
                        });
                    }
                    console.log(event);
                };
                this.peerConnection.onicecandidate = function (event) {
                    if (event.candidate) {
                        _this.webSocket.send(JSON.stringify({
                            action: "signaling",
                            params: { ice: event.candidate },
                        }));
                    }
                };
                this.peerConnection.onnegotiationneeded = function (event) {
                    console.log("ok");
                };
                this.peerConnection.ontrack = function (event) {
                    console.log(event);
                };
            }
            else {
                throw new Error("devices are not ready, please try again");
            }
        }
        else {
            throw new Error("roomId must be not null");
        }
    };
    StreamStudioClient.prototype.setVideoParams = function (sender, height, bitrate) {
        return __awaiter(this, void 0, void 0, function () {
            var scaleRatio, params;
            return __generator(this, function (_a) {
                scaleRatio = sender.track.getSettings().height / height;
                params = sender.getParameters();
                // If encodings is null, create it
                if (!params.encodings) {
                    params.encodings = [{}];
                }
                params.encodings[0].scaleResolutionDownBy = Math.max(scaleRatio, 1);
                params.encodings[0].maxBitrate = bitrate;
                sender.setParameters(params);
                // If the newly changed value of scaleResolutionDownBy is 1,
                // use applyConstraints() to be sure the height is constrained,
                // since scaleResolutionDownBy may not be implemented
                if (sender.getParameters().encodings &&
                    sender.getParameters().encodings[0].scaleResolutionDownBy == 1) {
                    sender.track.applyConstraints({ height: height });
                }
                return [2 /*return*/];
            });
        });
    };
    StreamStudioClient.prototype.unmuteVideo = function () {
        if (this.peerConnection !== null) {
            var sender = this.peerConnection.getSenders().find(function (s) {
                return s.track.kind == "video";
            });
            sender.track.enabled = true;
            this.isVideoMuted = false;
            this.webSocket.send(JSON.stringify({ action: "room/update", params: { video: true } }));
        }
    };
    StreamStudioClient.prototype.muteVideo = function () {
        if (this.peerConnection !== null) {
            var sender = this.peerConnection.getSenders().find(function (s) {
                return s.track.kind == "video";
            });
            sender.track.enabled = false;
            this.isVideoMuted = true;
            this.webSocket.send(JSON.stringify({ action: "room/update", params: { video: false } }));
        }
    };
    StreamStudioClient.prototype.unmuteAudio = function () {
        if (this.peerConnection !== null) {
            var sender = this.peerConnection.getSenders().find(function (s) {
                return s.track.kind == "audio";
            });
            sender.track.enabled = true;
            this.isAudioMuted = false;
            this.webSocket.send(JSON.stringify({ action: "room/update", params: { audio: true } }));
        }
    };
    StreamStudioClient.prototype.muteAudio = function () {
        if (this.peerConnection !== null) {
            var sender = this.peerConnection.getSenders().find(function (s) {
                return s.track.kind == "audio";
            });
            sender.track.enabled = false;
            this.isAudioMuted = true;
            this.webSocket.send(JSON.stringify({ action: "room/update", params: { audio: false } }));
        }
    };
    StreamStudioClient.prototype.stopPublishing = function () {
        this.webSocket.send(JSON.stringify({ action: "room/unpublish" }));
        if (this.peerConnection != null) {
            this.closePeerConnection();
            if (this.qualitySwitchInterval) {
                clearInterval(this.qualitySwitchInterval);
                this.qualitySwitchInterval = null;
            }
            this.peerConnection = null;
        }
    };
    StreamStudioClient.prototype.closePeerConnection = function () {
        if (this.peerConnection != null) {
            console.log("Stream Studio : Peer connection closing");
            this.peerConnection.close();
            this.peerConnection = null;
            if (this.qualitySwitchInterval) {
                clearInterval(this.qualitySwitchInterval);
                this.qualitySwitchInterval = null;
            }
            this.stopPublishing();
        }
    };
    StreamStudioClient.prototype.stopPreview = function () {
        if (this.element != null) {
            this.element.srcObject
                .getTracks()
                .forEach(function (t) { return t.stop(); });
        }
    };
    StreamStudioClient.prototype.switchVideoDevice = function (device) {
        var _this = this;
        this.videoInputDevice = device;
        this.getDeviceStream().then(function (stream) {
            if (_this.peerConnection !== null) {
                var videoSender = _this.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == "video";
                });
                videoSender.replaceTrack(stream.getVideoTracks()[0]);
                if (_this.isVideoMuted) {
                    stream.getVideoTracks()[0].enabled = false;
                }
                var audioSender = _this.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == "audio";
                });
                audioSender.replaceTrack(stream.getAudioTracks()[0]);
                if (_this.isAudioMuted) {
                    stream.getAudioTracks()[0].enabled = false;
                }
                _this.webSocket.send(JSON.stringify({ action: "room/ask-keyframe" }));
            }
            _this.stopPreview();
            _this.startPreview(stream);
        });
    };
    StreamStudioClient.prototype.switchAudioDevice = function (device) {
        var _this = this;
        this.audioInputDevice = device;
        this.getDeviceStream().then(function (stream) {
            if (_this.peerConnection !== null) {
                var videoSender = _this.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == "video";
                });
                videoSender.replaceTrack(stream.getVideoTracks()[0]);
                if (_this.isVideoMuted) {
                    stream.getVideoTracks()[0].enabled = false;
                }
                var audioSender = _this.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == "audio";
                });
                audioSender.replaceTrack(stream.getAudioTracks()[0]);
                if (_this.isAudioMuted) {
                    stream.getAudioTracks()[0].enabled = false;
                }
                _this.webSocket.send(JSON.stringify({ action: "room/ask-keyframe" }));
            }
            _this.stopPreview();
            _this.startPreview(stream);
        });
    };
    StreamStudioClient.prototype.askPermissions = function () {
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices
                .getUserMedia({ audio: true, video: true })
                .then(function (device) {
                resolve();
            })
                .catch(function (exception) {
                console.log(exception);
                reject(exception);
            });
        });
    };
    StreamStudioClient.prototype.getDevices = function (type) {
        return new Promise(function (resolve, reject) {
            console.log(navigator.mediaDevices.getSupportedConstraints());
            navigator.mediaDevices
                .getUserMedia({ audio: true, video: true })
                .then(function (stream) {
                stream.getTracks().forEach(function (t) { return t.stop(); });
                navigator.mediaDevices.enumerateDevices().then(function (devices) {
                    if (type !== "" && type !== undefined) {
                        var filtered = devices.filter(function (device) { return device.kind === type; });
                        resolve(filtered);
                    }
                    else {
                        resolve(devices);
                    }
                });
            })
                .catch(function (exception) {
                console.log(exception);
                reject(exception);
            });
        });
    };
    return StreamStudioClient;
}());
export default StreamStudioClient;
//# sourceMappingURL=index.js.map