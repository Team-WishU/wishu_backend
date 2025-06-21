import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

interface ChatbotResponse {
  reply: {
    type: 'bot' | 'product';
    content?: string;
    buttons?: { id: string; label: string }[];
    products?: any[];
  }[];
  newState: any;
}

@Injectable()
export class ChatbotService {
  private userStates = new Map<string, any>();

  constructor(private readonly productsService: ProductsService) {}

  async getRandomProductByTag(tag: string) {
    try {
      const products = await this.productsService.findByTag(tag);
      if (!products || products.length === 0) return null;
      return products[Math.floor(Math.random() * products.length)];
    } catch {
      return null;
    }
  }

  getUserState(userId: string) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, { step: 'start' });
    }
    return this.userStates.get(userId);
  }

  setUserState(userId: string, state: any) {
    this.userStates.set(userId, state);
  }

  async processMessage(message: string, state: any): Promise<ChatbotResponse> {
    const lower = message.toLowerCase();
    const moreKeywords = [
      '더',
      '다른 상품',
      '또 보여줘',
      '다른거',
      '다른 거',
      '하나 더',
      '한 개 더',
      '추천 더',
    ];

    // 유사 상품 재요청 처리
    if (moreKeywords.includes(lower) && state.lastTag) {
      const product = await this.getRandomProductByTag(state.lastTag);
      return {
        reply: [
          {
            type: 'bot',
            content: `'${state.lastTag}' 태그의 다른 추천 상품이에요!`,
          },
          {
            type: 'product',
            products: product ? [product] : [],
          },
        ],
        newState: state,
      };
    }

    const tagList = ['캐주얼', '러블리', '스포티', '유니크'];

    if (tagList.includes(message)) {
      const product = await this.getRandomProductByTag(message);
      return {
        reply: [
          {
            type: 'bot',
            content: `'${message}' 태그의 추천 상품이에요!`,
          },
          {
            type: 'product',
            products: product ? [product] : [],
          },
        ],
        newState: { ...state, lastTag: message },
      };
    }

    // 초기 시작
    if (state.step === 'start' && lower === '') {
      return {
        reply: [
          {
            type: 'bot',
            content: '안녕하세요! 무엇을 도와드릴까요?',
            buttons: [
              {
                id: 'wish_similar',
                label: '나의 위시템과 유사상품 추천 받을래!',
              },
              {
                id: 'tag_recommend',
                label: '전체 태그별 맘에 드는 태그 상품 추천 받을래!',
              },
            ],
          },
        ],
        newState: { step: 'start' },
      };
    }

    switch (state.step) {
      case 'start':
        if (
          lower === 'wish_similar' ||
          message === '나의 위시템과 유사상품 추천 받을래!'
        ) {
          return {
            reply: [
              {
                type: 'bot',
                content:
                  '위시리스트 태그 중 하나를 골라주세요: 러블리, 캐주얼, 스포티, 유니크',
                buttons: tagList.map((tag) => ({ id: tag, label: tag })),
              },
            ],
            newState: { step: 'recommend_wishlist' },
          };
        }

        if (
          lower === 'tag_recommend' ||
          message === '전체 태그별 맘에 드는 태그 상품 추천 받을래!'
        ) {
          return {
            reply: [
              {
                type: 'bot',
                content: '원하는 태그를 입력해주세요 (예: 캐주얼, 러블리 등).',
                buttons: tagList.map((tag) => ({ id: tag, label: tag })),
              },
            ],
            newState: { step: 'recommend_tag' },
          };
        }
        break;

      case 'recommend_wishlist': {
        const tag = message.trim();
        const product = await this.getRandomProductByTag(tag);
        return {
          reply: [
            {
              type: 'bot',
              content: `위시리스트 기반 태그 '${tag}'의 추천 상품이에요!`,
            },
            {
              type: 'product',
              products: product ? [product] : [],
            },
          ],
          newState: { step: 'recommend_wishlist', lastTag: tag },
        };
      }

      case 'recommend_tag': {
        const tag = message.trim();
        const product = await this.getRandomProductByTag(tag);
        return {
          reply: [
            {
              type: 'bot',
              content: `태그 '${tag}'의 추천 상품이에요!`,
            },
            {
              type: 'product',
              products: product ? [product] : [],
            },
          ],
          newState: { step: 'recommend_tag', lastTag: tag },
        };
      }
    }

    // 알 수 없는 입력에 대한 fallback
    return {
      reply: [
        {
          type: 'bot',
          content:
            '죄송해요, 이해하지 못했어요. 태그를 입력하거나 버튼을 눌러주세요!',
        },
      ],
      newState: state,
    };
  }
}
