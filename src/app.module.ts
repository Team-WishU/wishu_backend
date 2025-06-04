import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CommentsModule } from './comments/comments.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [AuthModule, UsersModule, ProductsModule, CommentsModule, WishlistModule, ChatbotModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
