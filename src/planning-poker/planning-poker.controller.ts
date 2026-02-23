import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  Delete,
} from '@nestjs/common';
import { PlanningPokerService } from './planning-poker.service';
import { CreateBoardDto } from './dto/create-board.dto';

@Controller('planning-poker')
export class PlanningPokerController {
  constructor(private readonly planningPokerService: PlanningPokerService) {}

  // Create a new board
  @Post('board')
  async createBoard(
    @Body() createBoardDto: CreateBoardDto,
    @Request() req: any,
  ) {
    const createdByEmail = req.user?.email;
    return this.planningPokerService.createBoard(
      createBoardDto,
      createdByEmail,
    );
  }

  // Get a board by ID
  @Get('board/:boardId')
  async getBoard(@Param('boardId') boardId: string) {
    return this.planningPokerService.getBoard(boardId);
  }

  // Get participants of a board
  @Get('board/:boardId/participants')
  async getParticipants(@Param('boardId') boardId: string) {
    return this.planningPokerService.getParticipants(boardId);
  }

  // Get all stories for a board
  @Get('board/:boardId/stories')
  async getStories(@Param('boardId') boardId: string) {
    return this.planningPokerService.getStories(boardId);
  }

  // Add a participant to the board
  @Post('board/:boardId/participant')
  async addParticipant(
    @Param('boardId') boardId: string,
    @Body('email') email: string,
  ) {
    return this.planningPokerService.addParticipant(boardId, email);
  }

  // Delete a participant from the board
  @Delete('board/:boardId/participant/:email')
  async deleteParticipant(
    @Param('boardId') boardId: string,
    @Param('email') email: string,
  ) {
    return this.planningPokerService.deleteParticipant(boardId, email);
  }

  // Add a story to the board
  @Post('board/:boardId/story')
  async addStory(
    @Param('boardId') boardId: string,
    @Body('title') title: string,
  ) {
    return this.planningPokerService.addStory(boardId, title);
  }

  // Submit a vote for a story
  @Post('board/:boardId/story/:storyId/vote')
  async submitVote(
    @Param('boardId') boardId: string,
    @Param('storyId') storyId: string,
    @Body('vote') vote: string,
    @Request() req: any,
  ) {
    const email = req.user.email;
    return this.planningPokerService.submitVoteForStory(
      boardId,
      storyId,
      email,
      vote,
    );
  }

  // Reveal votes for a story
  @Post('board/:boardId/story/:storyId/reveal')
  async revealVotes(
    @Param('boardId') boardId: string,
    @Param('storyId') storyId: string,
  ) {
    return this.planningPokerService.revealStoryVotes(boardId, storyId);
  }
}
