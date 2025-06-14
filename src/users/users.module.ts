import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './users.schema';
import {
  EmailVerification,
  EmailVerificationSchema,
} from '../email-verification/email-verification.schema';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => CommentsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
