import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ChatbotService {
  constructor(private readonly productsService: ProductsService) {}

  async getRandomProductByTag(tag: string) {
    const products = await this.productsService.findByTag(tag);
    const selected = products[Math.floor(Math.random() * products.length)];
    console.log('🎯 selected product:', selected); // 확인용 로그
    return selected;
  }

  private userStates = new Map<string, any>();

  getUserState(userId: string) {
    return this.userStates.get(userId) || {};
  }

  setUserState(userId: string, state: any) {
    this.userStates.set(userId, state);
  }

  async processMessage(
    message: string,
    state: any,
  ): Promise<{ reply: any[]; newState: any }> {
    const lower = message.toLowerCase().trim();

    if (['다른거', '더', '또'].includes(lower) && state?.selectedTag) {
      const product = await this.getRandomProductByTag(state.selectedTag);
      return {
        reply: [
          { type: 'bot', content: `다른 "${state.selectedTag}" 추천이에요!` },
          { type: 'bot', products: product ? [product] : [] },
        ],
        newState: state,
      };
    }

    const knownTags = ['러블리', '유니크', '스포티', '캐주얼', '미니멀'];
    const matchedTag = knownTags.find((tag) => lower.includes(tag));

    if (matchedTag) {
      const product = await this.getRandomProductByTag(matchedTag);
      return {
        reply: [
          { type: 'bot', content: `태그 "${matchedTag}"에 대한 추천이에요!` },
          { type: 'bot', products: product ? [product] : [] },
        ],
        newState: { selectedTag: matchedTag },
      };
    }

    return {
      reply: [
        {
          type: 'bot',
          content: '어떤 분위기를 원하시나요? (예: 러블리, 스트릿)',
        },
      ],
      newState: state,
    };
  }
}
