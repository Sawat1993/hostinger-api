import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  PlanningPokerBoard,
  PlanningPokerBoardDocument,
} from './planning-poker.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PlanningPokerService {
  constructor(
    @InjectModel(PlanningPokerBoard.name)
    private boardModel: Model<PlanningPokerBoardDocument>,
    private usersService: UsersService,
  ) {}

  // Create a new planning poker board
  async createBoard(
    createBoardDto: CreateBoardDto,
    createdByEmail?: string,
  ): Promise<PlanningPokerBoardDocument> {
    try {
      const boardId = this.generateBoardId();
      const newBoard = new this.boardModel({
        name: createBoardDto.name,
        description: createBoardDto.description,
        boardId,
        createdByEmail: createdByEmail,
        participants: createBoardDto.participants || [],
        stories: [],
      });
      return await newBoard.save();
    } catch (error) {
      throw new HttpException(
        `Failed to create board: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get a board by ID
  async getBoard(
    boardId: string,
  ): Promise<{ name: string; description?: string; createdByEmail?: string }> {
    try {
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }
      return {
        name: board.name,
        description: board.description,
        createdByEmail: board.createdByEmail,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get board: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get participants of a board with their details (email and name)
  async getParticipants(
    boardId: string,
  ): Promise<Array<{ email: string; name: string }>> {
    try {
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }

      // Fetch all users once
      const allUsers = await this.usersService.findAll();

      // Map participants with their user details
      const participantDetails = board.participants.map((email: string) => {
        const user = allUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        return {
          email: email,
          name: user?.name || 'Unknown',
        };
      });

      return participantDetails;
    } catch (error) {
      throw new HttpException(
        `Failed to get participants: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Add a participant to the board
  async addParticipant(
    boardId: string,
    email: string,
  ): Promise<PlanningPokerBoardDocument> {
    try {
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }

      if (!board.participants.includes(email)) {
        board.participants.push(email);
        board.updatedAt = new Date();
        await board.save();
      }

      return board;
    } catch (error) {
      throw new HttpException(
        `Failed to add participant: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Delete a participant from the board
  async deleteParticipant(
    boardId: string,
    email: string,
  ): Promise<PlanningPokerBoardDocument> {
    try {
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }

      const participantIndex = board.participants.indexOf(email);
      if (participantIndex === -1) {
        throw new HttpException('Participant not found', HttpStatus.NOT_FOUND);
      }

      board.participants.splice(participantIndex, 1);
      board.updatedAt = new Date();
      await board.save();

      return board;
    } catch (error) {
      throw new HttpException(
        `Failed to delete participant: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get all stories for a board
  async getStories(boardId: string): Promise<any[]> {
    try {
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }

      return board.stories;
    } catch (error) {
      throw new HttpException(
        `Failed to get stories: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Add a story to the board
  async addStory(
    boardId: string,
    storyTitle: string,
  ): Promise<PlanningPokerBoardDocument> {
    try {
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }

      // Set all existing stories to current: false
      board.stories.forEach((story) => {
        story.current = false;
      });

      const storyId = this.generateStoryId();
      board.stories.unshift({
        storyId,
        title: storyTitle,
        votes: [],
        revealed: false,
        current: true,
        createdAt: new Date(),
      } as any);

      board.updatedAt = new Date();
      await board.save();

      return board;
    } catch (error) {
      throw new HttpException(
        `Failed to add story: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Submit a vote for a story
  async submitVoteForStory(
    boardId: string,
    storyId: string,
    email: string,
    vote: string,
  ): Promise<PlanningPokerBoardDocument> {
    try {
      // First verify the board and user before attempting the atomic update
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }

      // Verify user is either a participant or the board creator
      if (
        !board.participants.includes(email) &&
        board.createdByEmail !== email
      ) {
        throw new HttpException(
          'User is not a participant',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const story = board.stories.find((s) => s.storyId === storyId);
      if (!story) {
        throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
      }

      // Migrate old format (object) to new format (array) if needed
      if (
        story.votes &&
        typeof story.votes === 'object' &&
        !Array.isArray(story.votes)
      ) {
        const votesArray = Object.entries(story.votes).map(
          ([userEmail, userVote]) => ({
            email: userEmail,
            vote: userVote as string,
          }),
        );
        story.votes = votesArray as any;
        await board.save();
      }

      // Use fully atomic operation with $set on array element if exists, or $push if not
      // First try to update existing vote for this email
      let updatedBoard = await this.boardModel
        .findByIdAndUpdate(
          board._id,
          {
            $set: {
              'stories.$[story].votes.$[voteElem].vote': vote,
              updatedAt: new Date(),
            },
          },
          {
            arrayFilters: [
              { 'story.storyId': storyId },
              { 'voteElem.email': email },
            ],
            new: true,
          },
        )
        .exec();

      // If no vote was updated, add a new vote
      if (
        updatedBoard &&
        updatedBoard.stories.length > 0 &&
        !updatedBoard.stories[0].votes.some((v: any) => v.email === email)
      ) {
        updatedBoard = await this.boardModel
          .findByIdAndUpdate(
            board._id,
            {
              $push: {
                'stories.$[story].votes': { email, vote },
              },
              $set: {
                updatedAt: new Date(),
              },
            },
            {
              arrayFilters: [{ 'story.storyId': storyId }],
              new: true,
            },
          )
          .exec();
      }

      if (!updatedBoard) {
        throw new HttpException(
          'Failed to update board',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return updatedBoard;
    } catch (error) {
      throw new HttpException(
        `Failed to submit vote: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Reveal votes for a story
  async revealStoryVotes(
    boardId: string,
    storyId: string,
  ): Promise<PlanningPokerBoardDocument> {
    try {
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }

      const story = board.stories.find((s) => s.storyId === storyId);
      if (!story) {
        throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
      }

      story.revealed = true;
      board.updatedAt = new Date();
      await board.save();

      return board;
    } catch (error) {
      throw new HttpException(
        `Failed to reveal votes: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Reset votes for a story (new round)
  async resetStoryVotes(
    boardId: string,
    storyId: string,
  ): Promise<PlanningPokerBoardDocument> {
    try {
      const board = await this.boardModel.findOne({ boardId }).exec();
      if (!board) {
        throw new HttpException('Board not found', HttpStatus.NOT_FOUND);
      }

      const story = board.stories.find((s) => s.storyId === storyId);
      if (!story) {
        throw new HttpException('Story not found', HttpStatus.NOT_FOUND);
      }

      story.votes = [];
      story.revealed = false;
      board.updatedAt = new Date();
      await board.save();

      return board;
    } catch (error) {
      throw new HttpException(
        `Failed to reset votes: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Generate a unique board ID
  private generateBoardId(): string {
    return `B${uuidv4()}`;
  }

  // Generate a unique story ID
  private generateStoryId(): string {
    return `S${uuidv4()}`;
  }
}
