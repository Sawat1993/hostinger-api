import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./schemas/user.schema").User[]>;
    create(createUserDto: CreateUserDto): Promise<import("./schemas/user.schema").User>;
    login(loginDto: LoginUserDto): Promise<{
        accessToken: string;
    }>;
}
