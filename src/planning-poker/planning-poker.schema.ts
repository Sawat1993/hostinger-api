import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Vote {
  @Prop({ required: true })
  email: string; // User email

  @Prop({ required: true })
  vote: string; // Vote value
}

@Schema({ _id: false })
export class Story {
  @Prop({ required: true })
  storyId: string; // Unique story identifier

  @Prop({ required: true })
  title: string; // Story title/description

  @Prop({ type: [Vote], default: [] })
  votes: Vote[]; // Array of votes per story

  @Prop({ default: false })
  revealed: boolean; // Whether votes for this story are revealed

  @Prop({ default: false })
  current: boolean; // Whether this is the current story being voted on

  @Prop()
  estimate?: number; // Story points/estimate

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ collection: 'planning-poker-boards' })
export class PlanningPokerBoard {
  @Prop({ required: true })
  name: string; // Board name

  @Prop()
  description?: string; // Board description

  @Prop({ required: true })
  boardId: string; // Unique board identifier

  @Prop()
  createdByEmail?: string; // Email of the board creator/admin

  @Prop({ type: [String], default: [] })
  participants: string[]; // List of participant emails

  @Prop({ type: [Story], default: [] })
  stories: Story[]; // Array of stories with individual votes

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type PlanningPokerBoardDocument = HydratedDocument<PlanningPokerBoard>;
export const PlanningPokerBoardSchema =
  SchemaFactory.createForClass(PlanningPokerBoard);
