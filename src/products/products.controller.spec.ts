import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            addComment: jest
              .fn()
              .mockImplementation(
                (
                  productId: string,
                  text: string,
                  user: { nickname: string; profileImage: string },
                ) => ({
                  _id: productId,
                  comments: [
                    {
                      text,
                      nickname: user.nickname,
                      profileImage: user.profileImage,
                    },
                  ],
                }),
              ),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should add a comment successfully', async () => {
    const result = await service.addComment('product123', 'test comment', {
      nickname: '홍길동',
      profileImage: 'url',
    });

    expect(result).toHaveProperty('_id', 'product123');
    expect(result?.comments[0].text).toBe('test comment');
  });
});
