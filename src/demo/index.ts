import StreamStudioClient from "../lib";
const client = new StreamStudioClient("", "");

document.querySelector("body").innerHTML = `<h1>Hello World!</h1>`;

console.log("StreamStudio", client);

client.connect(); 