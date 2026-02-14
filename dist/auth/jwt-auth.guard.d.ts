import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
export declare class JwtAuthGuard implements CanActivate {
    private reflector;
    private configService;
    private readonly secret;
    constructor(reflector: Reflector, configService: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
