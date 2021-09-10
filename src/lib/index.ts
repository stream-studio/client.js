import "core-js/stable";
import "regenerator-runtime/runtime";
import Hls from "hls.js";

interface Quality {
  quality: number;
  bitrate: number;
}

export default class StreamStudioClient {
  private isVideoMuted: boolean;
  private isAudioMuted: boolean;
  private element?: HTMLVideoElement;
  private audioInputDevice: any;
  private videoInputDevice: any;
  private peerConnection?: RTCPeerConnection;
  private eventListenerList: Array<any>;
  private webSocketUrl: string;
  private hls?: Hls;

  private lastQualityChange: Date;
  private currentQuality: number;
  private webSocket: WebSocket;
  private qualitySwitchInterval?: any;

  private qualities: Array<Quality>;

  constructor(private url: string, private externalId: string) {
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

  connect() {
    this.webSocket = new WebSocket(this.webSocketUrl);

    this.webSocket.onopen = (event) => {
      this.webSocket.send(
        JSON.stringify({
          action: "client/connect",
          params: { id: this.externalId },
        })
      );
      this.fireEvent({ action: "client/ready" });
    };

    this.webSocket.onclose = (e) => {
      this.fireEvent({
        action: "client/disconnected",
        params: { code: e.code, reason: e.reason },
      });
    };

    this.webSocket.onerror = (e) => {
      this.fireEvent({ action: "client/error" });
    };

    this.webSocket.onmessage = (e) => {
      let msg = JSON.parse(e.data);
      if (
        "action" in msg &&
        msg.action !== "room/publish" &&
        msg.action !== "room/unpublish" &&
        msg.action !== "room/updated" &&
        msg.action !== "rooms/stats" &&
        msg.action !== "room/deleted" &&
        msg.action !== "room/created" &&
        msg.action !== "room/error"
      ) {
        if ("sdp" in msg) {
          this.peerConnection.setRemoteDescription(msg.sdp).then(() => {
            this.peerConnection
              .createAnswer()
              .then((anwser) => {
                this.peerConnection.setLocalDescription(anwser).then(() => {
                  this.webSocket.send(
                    JSON.stringify({
                      action: "signaling",
                      params: { sdp: anwser },
                    })
                  );
                });
              })
              .catch((error) => {
                this.fireEvent({
                  action: "room/error",
                  params: { code: 2000, reason: "Negociation error " + error },
                });
              });
          });
        }
      } else if ("ice" in msg) {
        this.peerConnection.addIceCandidate(msg.ice);
      } else if (msg.action == "room/join") {
      } else if (msg.action == "room/join") {
        if (this.element != null) {
          if (Hls.isSupported()) {
            this.hls = new Hls({
              enableWorker: true,
              liveBackBufferLength: 900,
            });
            this.hls.loadSource(msg.params["hls"]);
            this.hls.attachMedia(this.element);
            this.hls.on(Hls.Events.MEDIA_ATTACHING, () => {
              this.element.play();
            });
            this.fireEvent({ action: "room/joined", params: msg.params });
          } else if (
            this.element.canPlayType("application/vnd.apple.mpegurl")
          ) {
            this.element.src = msg.params["hls"];
            this.element.addEventListener("canplay", () => {
              this.element.play();
            });
            this.fireEvent({ action: "room/joined", params: msg.params });
          } else {
            this.fireEvent({
              action: "room/error",
              params: { code: 1000, reason: "Can't start hls player" },
            });
          }
        }
      } else if (msg.action === "room/slow-link") {
        this.fireEvent({ action: "room/slow-link", params: {} });

        if (
          Math.floor(
            (new Date().getTime() - this.lastQualityChange.getTime()) / 1000
          ) >= 10
        ) {
          const nextQuality = this.currentQuality + 1;
          if (nextQuality < this.qualities.length)
            var sender = this.peerConnection.getSenders().find(function (s) {
              return s.track.kind == "video";
            });
          this.currentQuality = nextQuality;
          this.setVideoParams(
            sender,
            this.qualities[this.currentQuality].quality,
            this.qualities[this.currentQuality].bitrate
          );
          this.lastQualityChange = new Date();
          this.fireEvent({
            action: "room/switch-quality",
            params: this.qualities[this.currentQuality],
          });
          this.webSocket.send(JSON.stringify({ action: "room/ask-keyframe" }));
        }
      } else {
        this.fireEvent(msg);
      }
    };
  }

  fireEvent(data: {}) {
    this.eventListenerList.forEach((callback) => {
      callback(data);
    });
  }

  addEventListener(callback: Function) {
    this.eventListenerList.push(callback);
  }

  removeEventListener(callback: Function) {
    const index = this.eventListenerList.indexOf(callback);
    if (index > -1) {
      this.eventListenerList.splice(index, 1);
    }
  }

  getVideoInputDevices() {
    return this.getDevices("videoinput");
  }

  getAudioInputDevices() {
    return this.getDevices("audioinput");
  }

  getStats() {
    this.webSocket.send(JSON.stringify({ action: "rooms/stats" }));
  }

  join(roomId: string, externalId: string) {
    if (roomId !== null && roomId !== undefined) {
      this.webSocket.send(
        JSON.stringify({ action: "room/join", params: { room: roomId } })
      );
    } else {
      throw new Error("roomId and externalId must be not null");
    }
  }

  stop() {
    this.webSocket.send(JSON.stringify({ action: "room/unjoin" }));
    if (this.hls !== null) {
      this.hls.stopLoad();
      if (this.element !== null) {
        this.element.src = null;
      }
    }
  }

  unJoin() {
    this.stop();
  }

  setPreviewElement(element: HTMLVideoElement) {
    this.element = element;
  }

  getDeviceStream(): Promise<MediaStream> {
    const constraints: any = {};
    if (this.audioInputDevice != null) {
      constraints.audio = {
        deviceId: { exact: this.audioInputDevice.deviceId },
      };
    } else {
      constraints.audio = true;
    }
    if (this.videoInputDevice != null) {
      constraints.video = {
        deviceId: { exact: this.videoInputDevice.deviceId },
      };
    } else {
      constraints.video = true;
    }

    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia(constraints).then(
        (stream) => {
          resolve(stream);
        },
        (error) => {
          reject(error.message);
        }
      );
    });
  }

  startPreview(stream: MediaStream) {
    if (this.element != null) {
      if (stream === undefined || stream === null) {
        this.getDeviceStream()
          .then((stream) => {
            this.element.srcObject = <MediaStream>stream;
            this.element.muted = true;
          })
          .catch((error) => {
            console.log("error");
          });
      } else {
        this.element.srcObject = stream;
        this.element.muted = true;
      }
    } else {
      throw new Error("Preview Element must be set");
    }
  }

  testSwitchQuality() {
    if (this.currentQuality > 0) {
      if (
        Math.floor(
          (new Date().getTime() - this.lastQualityChange.getTime()) / 1000
        ) > 90
      ) {
        var sender = this.peerConnection.getSenders().find(function (s) {
          return s.track.kind == "video";
        });
        this.currentQuality = this.currentQuality - 1;
        this.setVideoParams(
          sender,
          this.qualities[this.currentQuality].quality,
          this.qualities[this.currentQuality].bitrate
        );
        this.lastQualityChange = new Date();
        this.fireEvent({
          action: "room/switch-quality",
          params: this.qualities[this.currentQuality],
        });
        this.webSocket.send(JSON.stringify({ action: "room/ask-keyframe" }));
      }
    }
  }

  startPublishing(roomId: string) {
    if (roomId !== null && roomId !== undefined) {
      if ((<MediaStream>this.element.srcObject).getTracks().length == 2) {
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

        (<MediaStream>this.element.srcObject).getTracks().forEach((track) => {
          this.peerConnection.addTrack(
            track,
            <MediaStream>this.element.srcObject
          );
        });

        this.qualitySwitchInterval = setInterval(
          this.testSwitchQuality.bind(this),
          1000
        );

        this.peerConnection.createOffer().then((offer) => {
          let h264 = false;

          if (offer.sdp.includes("H264") || offer.sdp.includes("h264")) {
            h264 = true;
          } else if (offer.sdp.includes("VP8") || offer.sdp.includes("vp8")) {
            h264 = false;
          } else {
            this.fireEvent({
              action: "room/error",
              params: { code: 2001, reason: "Imcomptible codecs " },
            });
          }
          this.webSocket.send(
            JSON.stringify({
              action: "room/publish",
              params: { room: roomId, h264: h264 },
            })
          );
        });

        this.peerConnection.onsignalingstatechange = (event) => {};

        this.peerConnection.onconnectionstatechange = (event) => {
          switch (this.peerConnection.connectionState) {
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

        this.peerConnection.oniceconnectionstatechange = (event) => {
          if (this.peerConnection.iceConnectionState === "failed") {
            this.fireEvent({
              action: "room/error",
              params: {
                code: 2002,
                reason: "Failed to publish connect to server (ICE)",
              },
            });
          }
          console.log(event);
        };

        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.webSocket.send(
              JSON.stringify({
                action: "signaling",
                params: { ice: event.candidate },
              })
            );
          }
        };
        this.peerConnection.onnegotiationneeded = (event) => {
          console.log("ok");
        };

        this.peerConnection.ontrack = (event) => {
          console.log(event);
        };
      } else {
        throw new Error("devices are not ready, please try again");
      }
    } else {
      throw new Error("roomId must be not null");
    }
  }

  async setVideoParams(sender: RTCRtpSender, height: number, bitrate: number) {
    const scaleRatio = sender.track.getSettings().height / height;
    const params = sender.getParameters();

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

    if (
      sender.getParameters().encodings &&
      sender.getParameters().encodings[0].scaleResolutionDownBy == 1
    ) {
      sender.track.applyConstraints({ height });
    }
  }

  unmuteVideo() {
    if (this.peerConnection !== null) {
      var sender = this.peerConnection.getSenders().find(function (s) {
        return s.track.kind == "video";
      });
      sender.track.enabled = true;
      this.isVideoMuted = false;

      this.webSocket.send(
        JSON.stringify({ action: "room/update", params: { video: true } })
      );
    }
  }

  muteVideo() {
    if (this.peerConnection !== null) {
      var sender = this.peerConnection.getSenders().find(function (s) {
        return s.track.kind == "video";
      });
      sender.track.enabled = false;
      this.isVideoMuted = true;
      this.webSocket.send(
        JSON.stringify({ action: "room/update", params: { video: false } })
      );
    }
  }

  unmuteAudio() {
    if (this.peerConnection !== null) {
      var sender = this.peerConnection.getSenders().find(function (s) {
        return s.track.kind == "audio";
      });
      sender.track.enabled = true;
      this.isAudioMuted = false;

      this.webSocket.send(
        JSON.stringify({ action: "room/update", params: { audio: true } })
      );
    }
  }

  muteAudio() {
    if (this.peerConnection !== null) {
      var sender = this.peerConnection.getSenders().find(function (s) {
        return s.track.kind == "audio";
      });
      sender.track.enabled = false;
      this.isAudioMuted = true;

      this.webSocket.send(
        JSON.stringify({ action: "room/update", params: { audio: false } })
      );
    }
  }

  stopPublishing() {
    this.webSocket.send(JSON.stringify({ action: "room/unpublish" }));
    if (this.peerConnection != null) {
      this.closePeerConnection();
      if (this.qualitySwitchInterval) {
        clearInterval(this.qualitySwitchInterval);
        this.qualitySwitchInterval = null;
      }
      this.peerConnection = null;
    }
  }

  closePeerConnection() {
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
  }

  stopPreview() {
    if (this.element != null) {
      (<MediaStream>this.element.srcObject)
        .getTracks()
        .forEach((t) => t.stop());
    }
  }

  switchVideoDevice(device: any) {
    this.videoInputDevice = device;
    this.getDeviceStream().then((stream) => {
      if (this.peerConnection !== null) {
        var videoSender = this.peerConnection.getSenders().find(function (s) {
          return s.track.kind == "video";
        });

        videoSender.replaceTrack(stream.getVideoTracks()[0]);

        if (this.isVideoMuted) {
          stream.getVideoTracks()[0].enabled = false;
        }

        var audioSender = this.peerConnection.getSenders().find(function (s) {
          return s.track.kind == "audio";
        });
        audioSender.replaceTrack(stream.getAudioTracks()[0]);

        if (this.isAudioMuted) {
          stream.getAudioTracks()[0].enabled = false;
        }

        this.webSocket.send(JSON.stringify({ action: "room/ask-keyframe" }));
      }
      this.stopPreview();
      this.startPreview(stream);
    });
  }

  switchAudioDevice(device: any) {
    this.audioInputDevice = device;
    this.getDeviceStream().then((stream: MediaStream) => {
      if (this.peerConnection !== null) {
        var videoSender = this.peerConnection.getSenders().find(function (s) {
          return s.track.kind == "video";
        });
        videoSender.replaceTrack(stream.getVideoTracks()[0]);

        if (this.isVideoMuted) {
          stream.getVideoTracks()[0].enabled = false;
        }

        var audioSender = this.peerConnection.getSenders().find(function (s) {
          return s.track.kind == "audio";
        });
        audioSender.replaceTrack(stream.getAudioTracks()[0]);

        if (this.isAudioMuted) {
          stream.getAudioTracks()[0].enabled = false;
        }

        this.webSocket.send(JSON.stringify({ action: "room/ask-keyframe" }));
      }
      this.stopPreview();
      this.startPreview(stream);
    });
  }

  askPermissions() {
    return new Promise<void>((resolve, reject) => {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((device) => {
          resolve();
        })
        .catch((exception) => {
          console.log(exception);
          reject(exception);
        });
    });
  }

  getDevices(type: any) {
    return new Promise(function (resolve, reject) {
      console.log(navigator.mediaDevices.getSupportedConstraints());
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
          stream.getTracks().forEach((t) => t.stop());

          navigator.mediaDevices.enumerateDevices().then((devices) => {
            if (type !== "" && type !== undefined) {
              const filtered = devices.filter((device) => device.kind === type);
              resolve(filtered);
            } else {
              resolve(devices);
            }
          });
        })
        .catch((exception) => {
          console.log(exception);
          reject(exception);
        });
    });
  }
}
