import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Delete,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { Request } from 'express';

interface UserPayload {
  _id: string;
  nickname?: string;
  profileImage?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  sendRequest(@Req() req: Request, @Body('userId') userId: string) {
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) throw new UnauthorizedException();
    return this.friendsService.sendRequest(user._id, userId);
  }

  @Post('accept')
  acceptRequest(@Req() req: Request, @Body('userId') userId: string) {
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) throw new UnauthorizedException();
    return this.friendsService.acceptRequest(user._id, userId);
  }

  @Delete(':friendId')
  removeFriend(@Req() req: Request, @Param('friendId') friendId: string) {
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) throw new UnauthorizedException();
    return this.friendsService.removeFriend(user._id, friendId);
  }

  @Get()
  getFriends(@Req() req: Request) {
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) throw new UnauthorizedException();
    return this.friendsService.getFriends(user._id);
  }

  @Get('requests')
  getFriendRequests(@Req() req: Request) {
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) throw new UnauthorizedException();
    return this.friendsService.getFriendRequests(user._id);
  }
}
