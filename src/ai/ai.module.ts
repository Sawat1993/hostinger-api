import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AI, AISchema } from './ai.schema';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: AI.name, schema: AISchema }])],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
