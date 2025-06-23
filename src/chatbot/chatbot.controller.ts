import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  ChatbotService,
  ChatbotState,
  ChatbotResponse,
} from './chatbot.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @UseGuards(JwtAuthGuard)
  @Post('message')
  async handleMessage(
    @Body() body: any,
    @Req() req: Request,
  ): Promise<{ success: boolean; messages: unknown[] }> {
    const user = req.user as { _id: string } | undefined;
    const userId = user?._id;

    if (!userId) {
      return {
        success: false,
        messages: [{ type: 'bot', content: '로그인이 필요해요!' }],
      };
    }

    const message = body?.message;
    console.log('📨 [ChatbotController] 받은 message:', message);

    if (typeof message !== 'string' || message.trim().length === 0) {
      return {
        success: false,
        messages: [{ type: 'bot', content: '메시지를 입력해 주세요!' }],
      };
    }

    const prevState = this.chatbotService.getUserState(userId);
    const mergedState: ChatbotState = {
      ...body?.state,
      ...prevState,
      userId,
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
    this.chatbotService.setUserState(userId, result.newState);

    return { success: true, messages: reply };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset')
  resetChat(@Req() req: Request): { success: boolean } {
    const user = req.user as { _id: string } | undefined;
    const userId = user?._id;
    if (userId) {
      this.chatbotService.clearUserState(userId);
    }
    return { success: true };
  }
}
