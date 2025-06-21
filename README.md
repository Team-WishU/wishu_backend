# WISHU Backend (NestJS)

**WISHU 프로젝트**의 백엔드 서버입니다.  
NestJS 기반으로 구축된 RESTful API 서버이며, 위시리스트 기반 서비스의 핵심 비즈니스 로직을 처리합니다.

---

## 📦 개발 환경

| 항목       | 버전     |
| ---------- | -------- |
| Node.js    | v18.16.1 |
| NestJS CLI | v11.0.7  |

> ⚠️ `.nvmrc` 또는 `package-lock.json` 기반으로 버전 통일 필수입니다

---

## 🚀 프로젝트 실행

Node.js 버전 통일
.nvmrc 생성 해둠

> nvm install 18.16.1
> nvm use
> node -v 로 확인

## nvm 안되면 windows

> nvm use 18.16.1
> node -v 로 확인

## NestJS CLI 설치(전역)

> npm install -g @nestjs/cli
> 위 프로젝트에서는 nest 11.0.7입니다.
> npm install -g @nestjs/cli@11.0.7

npm버전은 node 설치할 때 따라오지만 버전 차이 때문에 문제가 생긴다면

> npm install -g npm@10.9.2

```bash
# 패키지 설치
npm ci

# 개발 서버 실행
npm run start:dev

# 일반 실행
npm run dev

# 프로덕션 실행
npm run start:prod
```
