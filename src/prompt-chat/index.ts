import { ChatGPTAPI, ChatMessage } from 'chatgpt';
import colors from 'colors';
import { ReadStream, WriteStream } from 'tty';
import { ObjectRef, progressWriter, prompt, endLine } from './utils';

export enum Command {
  EXIT,
  RESET,
}

export type CommandHandlerFunction = (args: string[]) => void;

export type CommandHandler = {
  [k in Command]: CommandHandlerFunction;
}

export interface PromptChatConfig {
  apiKey: string;
}

export interface ConversationResult {
  totalOfTokens: number;
  conversationOutput: string;
}

export interface ConversationOptions {
  stdin?: ReadStream;
  stdout?: WriteStream;
  stderr?: WriteStream;
}

export class ChatController implements CommandHandler {
  private _isChatRunning: boolean;
  parentMessageId?: string;

  constructor() {
    this._isChatRunning = true;
  }

  stopChating() {
    this._isChatRunning = false;
  }

  get isChatRunning() {
    return this._isChatRunning;
  }

  [Command.EXIT]() {
    this.stopChating();
  }

  [Command.RESET]() {
    this.parentMessageId = undefined;
  }
}

export class CommandError extends Error { }

export class PromptChat {
  static readonly IS_COMMAND_REGEXP = /\/\w*/;
  static readonly COMMAND_MAP = new Map([
    [
      'exit',
      Command.EXIT
    ],
    [
      'reset',
      Command.RESET
    ],
  ]);

  static emitCommand(text: string, handler?: CommandHandler) {
    const isCommand = text.at(0) === '/';
    if (!isCommand) return;

    const args = text.slice(1).split(' ');

    const command = this.COMMAND_MAP.get(args.at(0) ?? '');
    if (command === undefined) throw new CommandError(`Command "${text}" don't exist!`);

    handler?.[command](args);

    return command;
  }

  static tokensToDolar(tokens: number) {
    return tokens / 1000 * 0.002;
  }

  static formatPrice(price: number) {
    return colors.green(`$ ${price}`);
  }

  private chat: ChatGPTAPI;

  constructor(config: PromptChatConfig) {
    const {
      apiKey,
    } = config;

    this.chat = new ChatGPTAPI({
      apiKey,
    });
  }

  async startConversation(options?: ConversationOptions) {
    const {
      stdin = process.stdin,
      stdout = process.stdout,
      stderr = process.stderr,
    } = options ?? {};

    const controller = new ChatController();
    const conversationResult: ConversationResult = {
      conversationOutput: '',
      totalOfTokens: 0,
    };

    let lastMessageLengthRef: ObjectRef<number> = { currenty: 0 };

    function onProgress(partialResponse: ChatMessage) {
      progressWriter(partialResponse.text, {
        startRef: lastMessageLengthRef,
        stdout,
      });
    }

    while (controller.isChatRunning) {
      const question = await prompt(colors.grey('User: '), { stdin, stdout });

      stdout.write(endLine());

      if (question.length === 0) {
        stderr.write(colors.grey('Error:') + 'Input length shold be 1 or more!' + endLine());
        continue;
      }

      try {
        if (PromptChat.emitCommand(question, controller) !== undefined) continue;
      } catch (e) {
        if (e instanceof CommandError) {
          stderr.write(colors.grey('Error: ') + e.message + endLine());
          continue;
        }

        if (stderr !== process.stderr) stderr.write(String(e));

        throw e;
      }

      stdout.write(colors.grey('ChatGPT: '));

      const resp = await this.chat.sendMessage(question, { onProgress, parentMessageId: controller.parentMessageId });

      lastMessageLengthRef.currenty = 0;

      controller.parentMessageId = resp.id;

      stdout.write(endLine(2));

      const usedTokens = resp.detail?.usage?.total_tokens;

      if (usedTokens) {
        const price = PromptChat.tokensToDolar(usedTokens);
        
        conversationResult.totalOfTokens += usedTokens;
        const totalPrice = PromptChat.tokensToDolar(conversationResult.totalOfTokens);

        stdout.write(colors.grey('Response price: ') + PromptChat.formatPrice(price) + endLine(2));
        stdout.write(colors.grey('Conversation prie: ') + PromptChat.formatPrice(totalPrice) + endLine(2));
      }
    }

    return conversationResult;
  }
}