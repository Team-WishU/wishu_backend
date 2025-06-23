import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
  UnauthorizedException,
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
    @Query('friendId') friendId: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) {
      throw new UnauthorizedException('로그인 정보가 올바르지 않습니다.');
    }

    const { items, collaborators } =
      await this.sharedBucketService.getSharedWishlist(user._id, friendId);

    const bucket = await this.sharedBucketService.getOrCreateSharedBucket(
      user._id,
      friendId,
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
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) {
      throw new UnauthorizedException('로그인 정보가 올바르지 않습니다.');
    }
    return this.sharedBucketService.addComment(bucketId, user, text);
  }

  @Get(':bucketId/comments')
  async getComments(@Param('bucketId') bucketId: string) {
    return this.sharedBucketService.getComments(bucketId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMySharedBuckets(@Req() req: Request) {
    const user = req.user as UserPayload | undefined;
    if (!user || !user._id) {
      throw new UnauthorizedException('로그인 정보가 올바르지 않습니다.');
    }
    return this.sharedBucketService.findBucketsByUserId(user._id);
  }
}
