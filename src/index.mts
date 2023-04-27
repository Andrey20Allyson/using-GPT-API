#!/usr/bin/env node

import { config } from 'dotenv';
import { PromptChat } from './prompt-chat/index.mjs';

config();

const OPEN_IA_API_KEY_VARIABLE_NAME = 'OPENIA_API_KEY';
const OPEN_IA_API_KEY = process.env[OPEN_IA_API_KEY_VARIABLE_NAME];

if (!OPEN_IA_API_KEY) throw new Error(`Can't find OpenIA API key! please set the '${OPEN_IA_API_KEY_VARIABLE_NAME}' environment variable`);

const promptChat = new PromptChat({ apiKey: OPEN_IA_API_KEY });

promptChat
  .startConversation()
  .then(totalPrice => console.log(`End.`));