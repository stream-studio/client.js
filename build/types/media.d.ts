declare class MediaClient {
    private clientUrl;
    private ws;
    private events;
    constructor(clientUrl: string);
    createStream(): Promise<string>;
}
export default MediaClient;
