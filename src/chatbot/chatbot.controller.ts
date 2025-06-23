import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async handleMessage(
    @Body('message') message: string,
    @Body('nickname') nickname?: string,
  ) {
    console.log(`[CHATBOT] 메시지 수신: ${message}`);
    console.log('[🧪 ChatbotController] nickname:', nickname);

    const userId = nickname?.trim() || 'guest';
    console.log('[🧪 ChatbotController] userId used:', userId);

    const prevState = this.chatbotService.getUserState(userId);
    const mergedState = {
      ...prevState,
      nickname: nickname ?? prevState.nickname,
    };

    const result = await this.chatbotService.processMessage(
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
    this.chatbotService.setUserState(userId, newState);

    return { success: true, messages: reply };
  }

  @Post('reset')
  async resetChat(@Body('nickname') nickname: string) {
    const userId = nickname?.trim() || 'guest';
    this.chatbotService.clearUserState(userId);
    return { success: true };
  }
}
