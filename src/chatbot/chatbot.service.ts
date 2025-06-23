import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

export interface ChatbotState {
  step: string;
  userId: string;
  lastTag?: string;
  currentCategory?: string;
  remainingTags?: string[];
  userTags?: string[];
}

export interface ChatbotReply {
  type: 'bot' | 'product';
  content?: string;
  buttons?: { id: string; label: string }[];
  products?: unknown[];
}

export interface ChatbotResponse {
  reply: ChatbotReply[];
  newState: ChatbotState;
}

@Injectable()
export class ChatbotService {
  private userStates = new Map<string, ChatbotState>();

  constructor(private readonly productsService: ProductsService) {}

  async getRandomProductByTagAndCategory(tag: string, category: string) {
    try {
      const products = await this.productsService.findByTagAndCategory(
        tag,
        category,
      );
      if (!products || products.length === 0) return null;
      return products[Math.floor(Math.random() * products.length)];
    } catch {
      return null;
    }
  }

  getUserState(userId: string): ChatbotState {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, { step: 'start', userId });
    }
    return this.userStates.get(userId)!;
  }

  setUserState(userId: string, state: ChatbotState) {
    this.userStates.set(userId, state);
  }

  clearUserState(userId: string) {
    this.userStates.delete(userId);
  }

  private shuffleTags(tags: string[]): string[] {
    return [...tags].sort(() => Math.random() - 0.5);
  }

  async processMessage(
    message: string,
    state: ChatbotState,
  ): Promise<ChatbotResponse> {
    const lower = message.toLowerCase().trim();
    const moreKeywords = [
      '더',
      '다른 상품',
      '또 보여줘',
      '다른거',
      '하나 더',
      '추천 더',
    ];

    const validTags = [
      '스트릿',
      '심플',
      '미니멀',
      '러블리',
      '걸리시',
      '캐주얼',
      '유니크',
      '하이틴',
      '오버핏',
      '크롭',
      '시크',
      '페미닌',
      '하이웨스트',
      '롱스커트',
      '와이드핏',
      '키치',
      '스포티',
      '클래식',
      '빈티지',
      '슬림핏',
      '큐티',
      '레트로',
      '포인트',
      '데일리',
      '컬러풀',
      '글리터',
      '무광',
      '투명',
    ];
    const validCategories = ['상의', '하의', '신발', '액세서리', '폰케이스'];

    // 1. 초기 상태
    if (
      state.step === 'start' &&
      ![
        'wish_similar',
        'tag_recommend',
        '나의 위시템과 유사상품 추천 받을래!',
        '전체 태그별 맘에 드는 태그 상품 추천 받을래!',
      ].includes(message)
    ) {
      return {
        reply: [
          {
            type: 'bot',
            content:
              '안녕하세요! 어떤 것을 도와드릴까요? 아래 선택지에서 선택해주세요 :)',
          },
        ],
        newState: { ...state, step: 'start' },
      };
    }

    // 2. 카테고리 선택
    if (validCategories.includes(message) && state.step === 'recommend_tag') {
      return {
        reply: [
          {
            type: 'bot',
            content: `'${message}' 카테고리를 선택했어요!\n원하는 태그를 골라주세요 👇`,
          },
        ],
        newState: { ...state, currentCategory: message },
      };
    }

    // 3. 태그 선택
    if (validTags.includes(message)) {
      const category = state.currentCategory;
      if (!category) {
        return {
          reply: [
            {
              type: 'bot',
              content: `카테고리 정보가 없어 상품을 불러올 수 없어요. 다시 시도해주세요.`,
            },
          ],
          newState: { ...state },
        };
      }

      const product = await this.getRandomProductByTagAndCategory(
        message,
        category,
      );

      if (!product) {
        return {
          reply: [
            {
              type: 'bot',
              content: `죄송해요! '${category}' 카테고리의 '${message}' 태그에 해당하는 상품이 없어요. 😥\n다른 태그를 골라주세요!`,
            },
          ],
          newState: state,
        };
      }

      return {
        reply: [
          {
            type: 'bot',
            content: `'${category}' 카테고리의 '${message}' 태그 추천 상품이에요!`,
          },
          { type: 'product', products: [product] },
        ],
        newState: { ...state, lastTag: message },
      };
    }

    // 4. 위시리스트 기반 추천 (userId 기준)
    if (
      state.step === 'start' &&
      (lower === 'wish_similar' ||
        message === '나의 위시템과 유사상품 추천 받을래!')
    ) {
      const tags = await this.productsService.getUserSavedTags(state.userId);
      const uniqueTags = [...new Set(tags)].filter(
        (t): t is string => typeof t === 'string',
      );

      if (!uniqueTags.length) {
        return {
          reply: [
            {
              type: 'bot',
              content: '위시리스트에 상품이 없어 추천이 어려워요. 🥲',
            },
          ],
          newState: { ...state, step: 'start' },
        };
      }

      const shuffled = this.shuffleTags(uniqueTags);
      const tag = shuffled[0];
      const product = await this.productsService.findByTag(tag);

      return {
        reply: [
          { type: 'bot', content: `보유 태그: ${uniqueTags.join(', ')}` },
          {
            type: 'bot',
            content: `위시리스트 기반 태그 '${tag}'의 추천 상품이에요!`,
          },
          { type: 'product', products: product.length ? [product[0]] : [] },
        ],
        newState: {
          step: 'recommend_wishlist',
          lastTag: tag,
          userId: state.userId,
          remainingTags: shuffled.filter((t) => t !== tag),
          userTags: uniqueTags,
        },
      };
    }

    // 5. 전체 태그 추천 흐름 시작
    if (
      state.step === 'start' &&
      (lower === 'tag_recommend' ||
        message === '전체 태그별 맘에 드는 태그 상품 추천 받을래!')
    ) {
      return {
        reply: [
          {
            type: 'bot',
            content: '아래에서 원하는 카테고리를 먼저 골라주세요!',
          },
        ],
        newState: { step: 'recommend_tag', userId: state.userId },
      };
    }

    // 6. '더 보여줘' 요청 처리
    if (state.step === 'recommend_tag') {
      if (moreKeywords.includes(message)) {
        const tag = state.lastTag!;
        const category = state.currentCategory!;
        const product = await this.getRandomProductByTagAndCategory(
          tag,
          category,
        );

        if (!product) {
          return {
            reply: [
              {
                type: 'bot',
                content: `죄송해요! '${category}' 카테고리의 '${tag}' 태그에 추가 상품이 없어요. 😥`,
              },
            ],
            newState: state,
          };
        }

        return {
          reply: [
            {
              type: 'bot',
              content: `이번에도 '${category}' 카테고리의 '${tag}' 태그 상품이에요!`,
            },
            { type: 'product', products: [product] },
          ],
          newState: { ...state },
        };
      }

      if (!validTags.includes(message)) {
        return {
          reply: [
            {
              type: 'bot',
              content: `죄송해요, '${message}' 태그는 아직 없어요! 다른 걸 골라주세요.`,
            },
          ],
          newState: state,
        };
      }

      const category = state.currentCategory!;
      const product = await this.getRandomProductByTagAndCategory(
        message,
        category,
      );

      if (!product) {
        return {
          reply: [
            {
              type: 'bot',
              content: `죄송해요! '${category}' 카테고리의 '${message}' 태그에 해당하는 상품이 없어요. 😥`,
            },
          ],
          newState: state,
        };
      }

      return {
        reply: [
          {
            type: 'bot',
            content: `'${category}' 카테고리의 '${message}' 태그 추천 상품이에요!`,
          },
          { type: 'product', products: [product] },
        ],
        newState: {
          step: 'recommend_tag',
          lastTag: message,
          currentCategory: category,
          userId: state.userId,
        },
      };
    }

    // fallback
    return {
      reply: [
        {
          type: 'bot',
          content: '죄송해요, 이해하지 못했어요. 태그를 다시 입력해 주세요!',
        },
      ],
      newState: state,
    };
  }
}
