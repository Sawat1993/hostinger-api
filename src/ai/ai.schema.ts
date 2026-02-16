import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'ai' })
export class AI {
  @Prop({ required: true })
  content: string; // The data Gemini will read

  @Prop({ type: [Number], index: false })
  embedding: number[]; // The vector data
}

export type AIDocument = HydratedDocument<AI>;
export const AISchema = SchemaFactory.createForClass(AI);
