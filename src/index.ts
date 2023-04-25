import { ChatGPTAPI } from 'chatgpt';
import { config } from 'dotenv';

config();

const OPEN_IA_API_KEY_VARIABLE_NAME = 'OPENIA_API_KEY';
const OPEN_IA_API_KEY = process.env[OPEN_IA_API_KEY_VARIABLE_NAME];

if (!OPEN_IA_API_KEY) throw new Error(`Can't find OpenIA API key! please set the '${OPEN_IA_API_KEY_VARIABLE_NAME}' environment variable`);

const chat = new ChatGPTAPI({
  apiKey: OPEN_IA_API_KEY,
});

async function main() {
  const resp = await chat.sendMessage('Olá, poderia me escrever um poema?');

  console.log(resp);
}

main();