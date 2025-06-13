// users/dto/create-user.dto.ts

import {
  IsEmail,
  IsString,
  IsDateString,
  IsIn,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsDateString()
  birthDate: string;

  @IsIn(['male', 'female'])
  gender: string;

  @IsString()
  nickname: string;

  @IsIn([
    'mouse.png',
    'cow.png',
    'tiger.png',
    'rabbit.png',
    'dragon.png',
    'snake.png',
    'horse.png',
    'sheep.png',
    'monkey.png',
    'chicken.png',
    'dog.png',
    'pig.png',
  ])
  profileImage: string;
}
