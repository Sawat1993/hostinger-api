"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const jwt = require("jsonwebtoken");
const public_decorator_1 = require("./public.decorator");
let JwtAuthGuard = class JwtAuthGuard {
    constructor(reflector, configService) {
        this.reflector = reflector;
        this.configService = configService;
        const secret = this.configService.get('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET is not configured in ConfigService');
        }
        this.secret = secret;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers?.authorization;
        if (!authHeader) {
            throw new common_1.UnauthorizedException('Missing Authorization header');
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            throw new common_1.UnauthorizedException('Invalid Authorization header');
        }
        try {
            const payload = jwt.verify(token, this.secret);
            request.user = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map