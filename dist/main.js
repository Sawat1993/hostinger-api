"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const logger = new common_1.Logger('Bootstrap');
    const configService = app.get(config_1.ConfigService);
    const rawPort = configService.get('PORT');
    logger.log(`PORT from ConfigService: ${String(rawPort ?? 'not set')}`);
    const port = Number(rawPort ?? 3000) || 3000;
    logger.log(`Resolved numeric port: ${port}`);
    const jwtGuard = app.get(jwt_auth_guard_1.JwtAuthGuard);
    app.useGlobalGuards(jwtGuard);
    await app.listen(port);
    logger.log(`Application is listening on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map