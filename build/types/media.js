import { uuid } from 'uuidv4';
import { EventEmitter } from 'events';
var MediaClient = /** @class */ (function () {
    function MediaClient(clientUrl) {
        var _this = this;
        this.clientUrl = clientUrl;
        this.events = new EventEmitter();
        this.ws = new WebSocket(clientUrl);
        this.ws.onmessage = function (message) {
            try {
                _this.events.emit("message", JSON.parse(message.data));
            }
            catch (_a) {
            }
        };
    }
    MediaClient.prototype.createStream = function () {
        var _this = this;
        var correlationId = uuid();
        var promise = new Promise(function (resolve, reject) {
            var messageHandler = function (data) { };
            var timeout = setTimeout(function () {
                _this.events.off("message", messageHandler);
                clearTimeout(timeout);
                reject('Timeout');
            }, 500);
            messageHandler = function (data) {
                if (data["correlationId"] == correlationId) {
                    clearTimeout(timeout);
                    resolve(data["params"]["streamId"]);
                }
            };
            _this.events.on("message", messageHandler);
        });
        this.ws.send(JSON.stringify({
            "action": "createStream",
            "params": {},
            "correlationId": correlationId
        }));
        return promise;
    };
    return MediaClient;
}());
export default MediaClient;
//# sourceMappingURL=media.js.map