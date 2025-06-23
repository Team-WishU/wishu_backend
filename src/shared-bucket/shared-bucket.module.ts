import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedBucket, SharedBucketSchema } from './shared-bucket.schema';
import { SharedBucketService } from './shared-bucket.service';
import { SharedBucketController } from './shared-bucket.controller';
import { SharedBucketGateway } from './shared-bucket.gateway';
import { Product, ProductSchema } from '../products/products.schema';
import { UsersModule } from '../users/users.module';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SharedBucket.name, schema: SharedBucketSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    forwardRef(() => FriendsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [SharedBucketController],
  providers: [SharedBucketService, SharedBucketGateway],
  exports: [SharedBucketService],
})
export class SharedBucketModule {}
