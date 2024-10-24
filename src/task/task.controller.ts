import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  InternalServerErrorException,
  HttpException,
  Delete,
  Patch,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { InjectConnection } from '@nestjs/mongoose';
import {
  Connection,
  FilterQuery,
  PaginateOptions,
  PipelineStage,
} from 'mongoose';
import { CreateTaskDto } from './dto/createTask.dto';
import { NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetQueryDto } from '@/dto/getQuery.dto';
import { pick } from '@/utils/object.util';
import { ITaskDocument } from '@interfaces/entities';
import { UpdateTaskDto } from './dto/updateTask.dto';
import { transaction } from '@utils/transaction.util';

@ApiTags('Task')
@Controller('task')
export class TaskController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private taskService: TaskService,
  ) {}

  @Get('/')
  async getAllTasks(@Query() query: GetQueryDto) {
    const filter: FilterQuery<ITaskDocument> = pick(query, ['q']);
    const options: PaginateOptions = pick(query, [
      'limit',
      'page',
      'sort',
      'pagination',
    ]);

    const pipeLine: PipelineStage[] = [];
    if (filter.q) {
      pipeLine.push({
        $match: {
          title: {
            $regex: filter.q,
            $options: 'i',
          },

          description: {
            $regex: filter.q,
            $options: 'i',
          },
        },
      });
    }
    const Tasks = await this.taskService.getAllTask(pipeLine, options, true);
    return Tasks;
  }

  @Post('/')
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    const createTaskData = new CreateTaskDto();
    Object.assign(createTaskData, createTaskDto);
    try {
      const Task = await this.taskService.createTask(createTaskData, session);
      await session.commitTransaction();

      return Task;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new InternalServerErrorException();
    } finally {
      session.endSession();
    }
  }

  @Get('/:id')
  async getTaskById(@Param('id') id: string) {
    const Task = await this.taskService.getTaskById(id);
    if (!Task) throw new NotFoundException('Task not found');
    return Task;
  }

  @Delete('/:id')
  async deleteTaskById(@Param('id') id: string) {
    return await transaction(this.mongoConnection, async (session) => {
      let Task = await this.taskService.getTaskById(id);
      if (!Task) throw new NotFoundException('Task not found');

      Task = await this.taskService.deleteTask(id);
      return Task;
    });
  }

  @Patch('/:id')
  async updateTaskById(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return await transaction(this.mongoConnection, async (session) => {
      const task = await this.taskService.getTaskById(id);
      if (!task) throw new NotFoundException('Task not found');

      const updatedTask = await this.taskService.updateTask(
        id,
        updateTaskDto,
        session,
      );
      return updatedTask;
    });
  }
}
