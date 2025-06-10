import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      birthYear: number;
      gender: string;
    },
  ) {
    return this.usersService.registerUser(body);
  }
}
