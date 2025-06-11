import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';

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

  describe('createProduct', () => {
    it('should call service.create and return response', async () => {
      const mockFile = {
        originalname: 'shoe.jpg',
        buffer: Buffer.from('...'),
      } as any;

      const createProductDto: CreateProductDto = {
        title: '테스트 신발',
        brand: 'ZARA',
        price: 69900,
        category: 'shoes',
        tags: ['캐쥬얼', '페미닌'],
        productUrl: 'https://zara.com/product/1',
      };

      const mockUser = {
        nickname: '빨간사과',
        profileImage: 'https://cdn.wishu.com/profile/redapple.png',
      };

      const mockResult = {
        success: true,
        message: '상품이 성공적으로 등록되었습니다.',
        data: {
          id: 'prd123',
          ...createProductDto,
          imageUrl: 'https://cdn.wishu.com/products/test.jpg',
          uploadedBy: mockUser,
          createdAt: new Date(),
        },
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockResult);

      const result = await controller.createProduct(
        mockFile,
        createProductDto,
        { user: mockUser } as any,
      );

      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(
        createProductDto,
        expect.stringContaining('https://cdn.wishu.com/products/'),
        mockUser,
      );
    });
  });
});
