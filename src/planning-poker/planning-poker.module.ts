import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PlanningPokerBoard,
  PlanningPokerBoardSchema,
} from './planning-poker.schema';
import { PlanningPokerService } from './planning-poker.service';
import { PlanningPokerController } from './planning-poker.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanningPokerBoard.name, schema: PlanningPokerBoardSchema },
    ]),
    UsersModule,
  ],
  controllers: [PlanningPokerController],
  providers: [PlanningPokerService],
  exports: [PlanningPokerService],
})
export class PlanningPokerModule {}
