import { Controller, Post, Body, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async handleMessage(@Body('message') message: string, @Req() req) {
    console.log(`[CHATBOT] 메시지 수신: ${message}`);

    const userId = req.session?.userId || 'guest';
    const userState = this.chatbotService.getUserState(userId);

    const result = await this.chatbotService.processMessage(message, userState);

    if (!result || !result.reply || !result.newState) {
      return {
        success: false,
        messages: [{ type: 'bot', content: '처리 중 오류가 발생했어요.' }],
      };
    }

    const { reply, newState } = result;
    this.chatbotService.setUserState(userId, newState);

    return { success: true, messages: reply };
  }
}
