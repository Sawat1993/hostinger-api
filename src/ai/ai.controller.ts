import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AIService } from './ai.service';
import { Public } from 'src/auth/public.decorator';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  // Query endpoint: use Gemini and vector search to answer
  @Get('query')
  @Public()
  async query(@Query('q') q: string, @Query('topK') topK = 5) {
    return this.aiService.query(q, Number(topK));
  }

  // Save endpoint: save content and generate embedding
  @Post('save')
  async save(@Body('content') content: string) {
    return this.aiService.save(content);
  }
}
