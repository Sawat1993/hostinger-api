import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private userModel;
    private configService;
    private readonly logger;
    constructor(userModel: Model<UserDocument>, configService: ConfigService);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    login(loginDto: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
    } | null>;
}
