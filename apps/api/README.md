<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# test coverage
$ pnpm run test:cov
```

## Auth contract notes

- `POST /api/v1/auth/signin` accepts `ACTIVE` and `UNVERIFIED` accounts. Web sign-in sets the HTTP-only `refreshToken` cookie and returns `data.accessToken`; Mobile sign-in returns both tokens in the response body.
- `GET /api/v1/auth/google` starts Web Google OAuth with `{ deviceId, redirectPath?, clientState? }`; the callback links/creates an `ACTIVE` account, sets the Web refresh cookie, and redirects to `/home#googleAccessToken=...` by default. Safe `redirectPath` overrides the final path when provided. `clientState` is echoed as `googleState` in the URL fragment so Web can reject forged token fragments.
- `POST /api/v1/auth/google/mobile` accepts `{ idToken, deviceId }` from the native Google flow and returns the same access/refresh token body shape as mobile password sign-in.
- Google auth stores only provider identity (`GOOGLE`, provider account id, account id, email). Provider access/refresh tokens are not persisted.
- `POST /api/v1/auth/verify-email` always accepts `{ token }` and activates the account when the verification token is valid.
- Web clients should include `{ deviceId }` with verify-email when the user is already signed in. In that case the endpoint rotates a fresh `ACTIVE` access/refresh token pair for that device, stores the hashed refresh token on the session, sets the new `refreshToken` cookie, and returns only `data.accessToken` in the response body.
- Mobile clients should include `{ deviceId, deviceType: "MOBILE" }` with verify-email when the device should keep the newly verified session; the response may include both access and refresh tokens for SecureStore.
- Verify-email calls without `deviceId` remain valid and return `data: null`; this keeps external-link verification and legacy token-only calls compatible.

## Mail queue notes

- Signup, resend verification, and forgot-password flows enqueue BullMQ jobs on the `mail` queue instead of sending SMTP mail inline.
- `MailProcessor` runs in the API process, consumes `mail.verify-email` and `mail.password-reset`, and delegates delivery to the existing Nodemailer-backed `MailService`.
- Mail jobs retry up to 3 attempts with exponential backoff starting at 1 second. Redis must be available for auth mail enqueueing and worker processing.
- Queue transport uses `REDIS_URL` and `REDIS_KEY_PREFIX`; local development can use the Redis service from the root `docker-compose.yaml`.
- There is no separate worker command yet. Starting the API with `pnpm --filter api dev` starts the in-process mail worker through `MailModule`.
- Without Mailtrap SMTP credentials, queued jobs still run: `MailService` logs verification/reset links in development and skips SMTP delivery in other environments.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
