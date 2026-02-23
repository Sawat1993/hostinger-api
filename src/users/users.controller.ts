import { Controller, Get, Post, Body, Query } from '@nestjs/common';
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

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginUserDto) {
    return this.usersService.login(loginDto);
  }
}
