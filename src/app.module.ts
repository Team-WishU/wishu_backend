import { Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CommonModule } from './common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { FriendsModule } from './friends/friends.module';
import mongoose from 'mongoose';
import { EmailVerificationModule } from './email-verification/email-verification.module';
import { SharedBucketModule } from './shared-bucket/shared-bucket.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ProductsModule,
    ChatbotModule,
    CommonModule,
    EmailVerificationModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    FriendsModule,
    SharedBucketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  private readonly isDev: boolean =
    process.env.NODE_ENV === 'dev' ? true : false;
  configure() {
    //몽구스 쿼리 logger
    mongoose.set('debug', this.isDev);
  }
}
