import { Controller, Post, Body, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async handleMessage(@Body('message') message: string, @Req() req) {
    const userId = req.session?.userId || 'guest';
    const userState = this.chatbotService.getUserState(userId);
    const { reply, newState } = await this.chatbotService.processMessage(
      message,
      userState,
    );
    this.chatbotService.setUserState(userId, newState);
    return { success: true, messages: reply };
  }
}
