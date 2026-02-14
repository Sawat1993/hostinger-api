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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
let UsersService = UsersService_1 = class UsersService {
    constructor(userModel, configService) {
        this.userModel = userModel;
        this.configService = configService;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async create(createUserDto) {
        try {
            const SALT_ROUNDS = 10;
            const hashed = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);
            const toCreate = {
                ...createUserDto,
                password: hashed,
            };
            const created = new this.userModel(toCreate);
            const saved = await created.save();
            const obj = saved.toObject();
            delete obj.password;
            return obj;
        }
        catch (error) {
            this.logger.error(`Failed to create user (email=${createUserDto?.email})`, error?.stack ?? error);
            throw error;
        }
    }
    async findAll() {
        try {
            return this.userModel.find().lean().exec();
        }
        catch (error) {
            this.logger.error('Failed to retrieve users', error?.stack ?? error);
            throw error;
        }
    }
    async login(loginDto) {
        try {
            const user = await this.userModel
                .findOne({ email: loginDto.email })
                .exec();
            if (!user) {
                this.logger.warn(`Login failed: user not found (email=${loginDto.email})`);
                return null;
            }
            const match = await bcrypt.compare(loginDto.password, user.password);
            if (!match) {
                this.logger.warn(`Login failed: invalid password (email=${loginDto.email})`);
                return null;
            }
            const JWT_SECRET = this.configService.get('JWT_SECRET');
            if (!JWT_SECRET) {
                throw new Error('JWT_SECRET is not configured in ConfigService');
            }
            const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, {
                expiresIn: '1h',
            });
            return { accessToken: token };
        }
        catch (error) {
            this.logger.error(`Failed to login user (email=${loginDto?.email})`, error?.stack ?? error);
            throw error;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map