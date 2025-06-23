import { Controller, Post, Body } from '@nestjs/common';
import {
  ChatbotService,
  ChatbotState,
  ChatbotResponse,
} from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async handleMessage(
    @Body('message') message: string,
    @Body('userId') userId?: string,
  ): Promise<{ success: boolean; messages: unknown[] }> {
    const realUserId = userId?.trim() || 'guest';

    const prevState = this.chatbotService.getUserState(realUserId);
    const mergedState: ChatbotState = {
      ...prevState,
      userId: userId ?? prevState.userId,
    };

    const result: ChatbotResponse = await this.chatbotService.processMessage(
      message,
      mergedState,
    );

    if (!result || !result.reply || !result.newState) {
      return {
        success: false,
        messages: [{ type: 'bot', content: '처리 중 오류가 발생했어요.' }],
      };
    }

    const { reply, newState } = result;
    this.chatbotService.setUserState(realUserId, newState);

    return { success: true, messages: reply };
  }

  @Post('reset')
  resetChat(@Body('userId') userId: string): { success: boolean } {
    const realUserId = userId?.trim() || 'guest';
    this.chatbotService.clearUserState(realUserId);
    return { success: true };
  }
}
