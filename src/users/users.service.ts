import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async registerAndSendOtp(email: string): Promise<{ message: string }> {
    try {
      const otp = this.generateOtp();
      const otpExpiresAt = new Date();
      otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

      await this.userModel.findOneAndUpdate(
        { email },
        { email, otp, otpExpiresAt },
        { upsert: true },
      );

      // Send OTP via email
      const emailResult = await this.emailService.sendOtpEmail(email, otp);

      if (!emailResult.success) {
        this.logger.error(
          `Failed to send OTP email to ${email}: ${emailResult.error}`,
        );
        throw new HttpException(
          { message: 'Failed to send OTP email' },
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`OTP generated and sent to ${email}: ${otp}`);
      return { message: `OTP sent to ${email}` };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to register and send OTP`, error);
      throw new HttpException(
        { message: 'Failed to send OTP' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { email, password, name, otp } = createUserDto;

      // Find user by email
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new HttpException(
          { message: 'User not found. Please register first.' },
          HttpStatus.NOT_FOUND,
        );
      }

      // Validate OTP exists and hasn't expired
      if (!user.otp || user.otp !== otp) {
        throw new HttpException(
          { message: 'Invalid OTP' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (new Date() > user.otpExpiresAt) {
        throw new HttpException(
          { message: 'OTP has expired' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Hash password and update user
      const SALT_ROUNDS = 10;
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);

      const updated = await this.userModel.findOneAndUpdate(
        { email },
        {
          name,
          password: hashed,
          otp: null,
          otpExpiresAt: null,
        },
        { new: true },
      );

      // Send welcome email
      const emailResult = await this.emailService.sendWelcomeEmail(email, name);

      if (!emailResult.success) {
        this.logger.warn(
          `Welcome email failed to send to ${email}: ${emailResult.error}`,
        );
        // Don't throw error here as user is already created
      }

      const obj = updated.toObject();
      delete obj.password;
      return obj as unknown as User;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Failed to create user (email=${createUserDto?.email})`,
        (error as Error)?.stack ?? error,
      );
      throw new HttpException(
        {
          message: error.message || 'Failed to create user',
        },
        HttpStatus.BAD_REQUEST,
      );
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
      throw new HttpException(
        {
          message: error.message || 'Failed to retrieve users',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(loginDto: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string } | null> {
    try {
      const user = await this.userModel
        .findOne({ email: loginDto.email })
        .collation({ locale: 'en', strength: 2 })
        .exec();
      if (!user) {
        throw new HttpException(
          { message: `Login failed: user not found (email=${loginDto.email})` },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const match = await bcrypt.compare(loginDto.password, user.password);
      if (!match) {
        throw new HttpException(
          {
            message: `Login failed: invalid password (email=${loginDto.email})`,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Sign a JWT. Get secret from ConfigService and fail fast if missing
      const JWT_SECRET = this.configService.get<string>('JWT_SECRET');
      if (!JWT_SECRET) {
        throw new HttpException(
          { message: 'JWT_SECRET is not configured in ConfigService' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const token = jwt.sign(
        { sub: user._id, email: user.email, name: user.name },
        JWT_SECRET,
        {
          expiresIn: '1h',
        },
      );
      return { accessToken: token };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Failed to login user' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async search(query: string): Promise<User[]> {
    try {
      if (!query || query.trim() === '') {
        return [];
      }
      // Search by name or email using regex for case-insensitive matching
      const searchRegex = new RegExp(query, 'i');
      const users = await this.userModel
        .find({
          $or: [{ name: searchRegex }, { email: searchRegex }],
        })
        .lean()
        .exec();
      return users;
    } catch (error) {
      this.logger.error(
        `Failed to search users (query=${query})`,
        (error as Error)?.stack ?? error,
      );
      throw new HttpException(
        {
          message: error.message || 'Failed to search users',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
