// src/@types/express/index.d.ts
import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      nickname: string;
      profileImage: string;
    };
  }
}
