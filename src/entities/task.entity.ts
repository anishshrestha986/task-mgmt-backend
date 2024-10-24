/* eslint-disable @typescript-eslint/no-var-requires */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import toJSON from './plugins/toJSON.plugin';
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const soft_delete = require('mongoose-delete');

@Schema({
  timestamps: true,
})
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true, default: false })
  status: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.plugin(toJSON);
TaskSchema.plugin(aggregatePaginate);

TaskSchema.plugin(soft_delete, {
  overrideMethods: true,
  indexFields: true,
});
