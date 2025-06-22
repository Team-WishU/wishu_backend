import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SharedBucketService, UserPayload } from './shared-bucket.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('shared-buckets')
export class SharedBucketController {
  constructor(private readonly sharedBucketService: SharedBucketService) {}

  @UseGuards(JwtAuthGuard)
  @Get('wishlist')
  async getSharedWishlist(
    @Query('user1') user1: string,
    @Query('user2') user2: string,
  ) {
    const { items, collaborators } =
      await this.sharedBucketService.getSharedWishlist(user1, user2);
    const bucket = await this.sharedBucketService.getOrCreateSharedBucket(
      user1,
      user2,
    );
    return {
      bucketId: bucket._id,
      collaborators,
      items,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':bucketId/comment')
  async addComment(
    @Param('bucketId') bucketId: string,
    @Body('text') text: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserPayload;
    return this.sharedBucketService.addComment(bucketId, user, text);
  }

  @Get(':bucketId/comments')
  async getComments(@Param('bucketId') bucketId: string) {
    return this.sharedBucketService.getComments(bucketId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMySharedBuckets(@Req() req: Request) {
    // JwtStrategy에서 payload.sub을 userId로 바꿔서 넣으므로 userId로 접근!
    const user = req.user as { userId?: string };
    const userId = user.userId;
    if (!userId) throw new Error('userId가 JWT payload에 없음!');
    return this.sharedBucketService.findBucketsByUserId(userId);
  }
}
