import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Hash the password before creating the user
      const SALT_ROUNDS = 10;
      const hashed = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);
      const toCreate = {
        ...createUserDto,
        password: hashed,
      } as CreateUserDto;

      const created = new this.userModel(toCreate);
      // Avoid returning the password in the response by converting toObject and deleting it
      const saved = await created.save();
      const obj = saved.toObject();
      delete obj.password;
      return obj as unknown as User;
    } catch (error) {
      this.logger.error(
        `Failed to create user (email=${createUserDto?.email})`,
        // second param expects stack or metadata; pass stack if available
        (error as Error)?.stack ?? error,
      );
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return this.userModel.find().lean().exec();
    } catch (error) {
      this.logger.error(
        'Failed to retrieve users',
        (error as Error)?.stack ?? error,
      );
      throw error;
    }
  }

  async login(loginDto: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string } | null> {
    try {
      const user = await this.userModel
        .findOne({ email: loginDto.email })
        .exec();
      if (!user) {
        this.logger.warn(
          `Login failed: user not found (email=${loginDto.email})`,
        );
        return null;
      }

      const match = await bcrypt.compare(loginDto.password, user.password);
      if (!match) {
        this.logger.warn(
          `Login failed: invalid password (email=${loginDto.email})`,
        );
        return null;
      }

      // Sign a JWT. Get secret from ConfigService and fail fast if missing
      const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured in ConfigService');
      }
      const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: '1h',
      });
      return { accessToken: token };
    } catch (error) {
      this.logger.error(
        `Failed to login user (email=${loginDto?.email})`,
        (error as Error)?.stack ?? error,
      );
      throw error;
    }
  }
}
