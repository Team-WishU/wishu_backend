import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface JwtPayload {
  _id: string;
  email: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.usersService.register(dto);
  }

  @Get('check-nickname')
  checkNickname(@Query('nickname') nickname: string) {
    return this.usersService.checkNickname(nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: { user: JwtPayload }) {
    return this.usersService.findById(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Request() req: { user: JwtPayload }, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(req.user._id, dto); // userId → _id
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('nickname/:nickname')
  getUserByNickname(@Param('nickname') nickname: string) {
    return this.usersService.findByNickname(nickname);
  }
}
