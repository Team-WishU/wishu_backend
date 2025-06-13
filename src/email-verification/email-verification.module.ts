import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmailVerification,
  EmailVerificationSchema,
} from './email-verification.schema';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationController } from './email-verification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailVerification.name, schema: EmailVerificationSchema },
    ]),
  ],
  controllers: [EmailVerificationController],
  providers: [EmailVerificationService],
})
export class EmailVerificationModule {}
