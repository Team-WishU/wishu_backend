import { Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CommentsModule } from './comments/comments.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CommonModule } from './common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';
import { EmailVerificationModule } from './email-verification/email-verification.module';
@Module({
  imports: [
    AuthModule,
    UsersModule,
    ProductsModule,
    CommentsModule,
    WishlistModule,
    ChatbotModule,
    CommonModule,
    EmailVerificationModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  private readonly isDev: boolean =
    process.env.NODE_ENV === 'dev' ? true : false;
  configure() {
    mongoose.set('debug', this.isDev); //몽구스 쿼리 logger
  }
}
/* 실무방식 ConfigService
import { ConfigService } from '@nestjs/config';

imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  MongooseModule.forRootAsync({
    useFactory: (configService: ConfigService) => ({
      uri: configService.get<string>('MONGODB_URI'),
    }),
    inject: [ConfigService],
  }),
  ...
],
 */
