import { get_encoding } from "tiktoken";

const encoderForGpt2 = get_encoding("gpt2");

const encoded = encoderForGpt2.encode("Hello, I am Rayyan");
console.log(encoded);

const decoder = encoderForGpt2.decode(encoded);
console.log(new TextDecoder().decode(decoder));
