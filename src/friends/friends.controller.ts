import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  sendRequest(@Req() req: Request, @Body('userId') userId: string) {
    const user = req.user as unknown as { userId: string };
    return this.friendsService.sendRequest(user.userId, userId);
  }

  @Post('accept')
  acceptRequest(@Req() req: Request, @Body('userId') userId: string) {
    const user = req.user as unknown as { userId: string };
    return this.friendsService.acceptRequest(user.userId, userId);
  }

  @Delete(':friendId')
  removeFriend(@Req() req: Request, @Param('friendId') friendId: string) {
    const user = req.user as unknown as { userId: string };
    return this.friendsService.removeFriend(user.userId, friendId);
  }

  @Get()
  getFriends(@Req() req: Request) {
    const user = req.user as unknown as { userId: string };
    return this.friendsService.getFriends(user.userId);
  }

  @Get('requests')
  getFriendRequests(@Req() req: Request) {
    const user = req.user as unknown as { userId: string };
    return this.friendsService.getFriendRequests(user.userId);
  }
}
