import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common'; // Req is used in the @Req() decorator
import { Public } from '../auth/public.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.usersService.search(query);
  }

  @Post('register')
  @Public()
  async register(@Body() body: { email: string }) {
    return this.usersService.registerAndSendOtp(body.email);
  }

  @Post()
  @Public()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginUserDto) {
    return this.usersService.login(loginDto);
  }

  @Post('renew-token')
  async renewToken(@Req() request: any) {
    // The JWT guard attaches the payload to request.user
    const userEmail = request.user?.email;
    if (!userEmail) {
      throw new Error('User email not found in token');
    }
    return this.usersService.renewToken(userEmail);
  }
}
