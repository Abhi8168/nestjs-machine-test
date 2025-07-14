import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskCreateDto } from './dto/task-create.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { count } from 'console';

@ApiBearerAuth('JWT-auth')
@Controller('task')
export class TaskController {
  constructor(
    private readonly taskService: TaskService, // Replace with actual service type
  ) {}

  @Post('create')
  async createTask(
    @Body() payload: TaskCreateDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      const userDetail = req?.user;
      await this.taskService.createTask(payload, userDetail);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Task created successfully',
      });
    } catch (err) {
      if (err instanceof ForbiddenException) {
        return res.status(HttpStatus.FORBIDDEN).json(err.getResponse());
      } else if (err instanceof UnauthorizedException) {
        return res.status(HttpStatus.UNAUTHORIZED).json(err.getResponse());
      } else if (err instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json(err.getResponse());
      } else if (err instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json(err.getResponse());
      } else {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
    }
    // Logic to create a task
  }

  @Get('fetch')
  @ApiOperation({ summary: 'Get paginated tasks (archived/unarchived)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'isDeleted',
    required: false,
    type: Boolean,
    example: false,
    description: 'Filter by archive status: true = archived, false = active',
  })
  async getAllTasks(
    @Req() req: any,
    @Res() res: any,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('isDeleted') isDeleted: boolean,
  ) {
    try {
      limit = limit ? limit : 10;
      page = page ? page : 1;

      const skip = (page - 1) * limit;

      const userDetail = req?.user;
      const filter: any = {
        where: {
          userId: userDetail.id,
          isDeleted: isDeleted ? true : false,
        },
      };
      const tasks = await this.taskService.findAllPaginated(
        filter,
        skip,
        limit,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        count: tasks.total,
        tasks: tasks.data,
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json(err.getResponse());
      } else if (err instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json(err.getResponse());
      } else {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
    }
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a task (mark as isDeleted: true)' })
  @ApiParam({ name: 'id', required: true, description: 'Task ID' })
  async archiveTask(@Param('id') id: string, @Res() res: any, @Req() req: any) {
    try {
      const userDetail = req?.user;
      const updated = await this.taskService.updateTask(
        id,
        {
          isDeleted: true,
        },
        userDetail,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Task archived successfully',
      });
    } catch (err) {
      if (err instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json(err.getResponse());
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to archive task',
      });
    }
  }
  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive a task (mark as isDeleted: false)' })
  @ApiParam({ name: 'id', required: true, description: 'Task ID' })
  async unarchiveTask(
    @Param('id') id: string,
    @Res() res: any,
    @Req() req: any,
  ) {
    try {
      const userDetail = req?.user;
      const updated = await this.taskService.updateTask(
        id,
        {
          isDeleted: false,
        },
        userDetail,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Task unarchived successfully',
      });
    } catch (err) {
      if (err instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json(err.getResponse());
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to unarchive task',
      });
    }
  }
}
