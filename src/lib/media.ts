import { EventEmitter } from 'events';

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

class WebRTCReceiver extends EventEmitter{
    constructor(private streamId: string, private senderId: string, private client : Client){
        super();
        this.client.on("sdp", (params, correlationId) => {
            this.emit("remoteDescription", params)
        });

        this.client.on("ice", (params, correlationId) => {
            this.emit("iceCandidate", params);
        });        
    }

    sendAnswer(description : any){
        this.client.send("sdp", {streamId: this.streamId, senderId: this.senderId, sdp : description });
    }

    addIceCandidate(candidate : RTCIceCandidate){
        this.client.send("ice", {streamId: this.streamId, senderId: this.senderId, ice : candidate});
    }

    start(){
        this.client.send("start", {streamId: this.streamId, senderId: this.senderId});
    }
}

class StreamSender{

}

class Stream{

    constructor(private streamId : string, private client : Client){}

    createSender(){
    }

    async createReceiver() : Promise<WebRTCReceiver>{
        const senderObj = await this.client.sendAndWaitAnswer("createSender", {"streamId": this.streamId});
        return new WebRTCReceiver(this.streamId, senderObj["senderId"], this.client);
    }
    
    delete(){
        this.client.send("deleteStream", {streamId: this.streamId});
    }
}



class Client extends EventEmitter{
    private ws : WebSocket;

    constructor(private clientUrl: string){
        super();
        this.ws = new WebSocket(clientUrl)
        
        this.ws.onmessage = (message) => {
            try{
                const obj = JSON.parse(message.data);
                this.emit("message", obj);
                if (obj["action"] !== null){
                    this.emit(obj["action"], obj["params"], obj["correlationId"]); 
                }
            }catch{
                
            }
        }

    }
    
    send(action: string, params?: object, correlationId?: string) : string{
        if (correlationId === undefined){
            correlationId = generateUUID(); 
        }

        if (params === undefined){
            params = {}; 
        }


        console.log(JSON.stringify({
            "action": action,
            "params": params,
            "correlationId": correlationId
        }));
        this.ws.send(JSON.stringify({
            "action": action,
            "params": params,
            "correlationId": correlationId
        }))
        return correlationId;
    }

    async sendAndWaitAnswer(action: string, params?: object) : Promise<object>{
        const correlationId = generateUUID(); 
        
        const promise = new Promise<object>((resolve, reject) =>{
            
            let messageHandler = (data: any) => {};

            const timeout = setTimeout(() => {
                this.off("message", messageHandler);
                clearTimeout(timeout);
                reject('Timeout')
            }, 500);

            messageHandler = (data : any) => {
                if (data["correlationId"] == correlationId){
                    clearTimeout(timeout);
                    resolve(data["params"]);
                }
            };

            this.on("message", messageHandler);
            
        });

        this.send(action, params, correlationId);
        return promise;

    }

}


class MediaClient{
    
    private client : Client;
    
    constructor(private clientUrl: string){
        this.client = new Client(clientUrl);

    }

    deleteStream(streamId : string){
        this.client.send("deleteStream", {"streamId": streamId});
    }

    async createStream() : Promise<Stream>{
        const answer = await this.client.sendAndWaitAnswer("createStream");
        return new Stream(answer["streamId"], this.client);
    }
}

export default MediaClient;