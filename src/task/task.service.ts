import { BadRequestException, Injectable } from '@nestjs/common';
import { Task } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private readonly prismaService: PrismaService) {}

  async createTask(payload, userDetail) {
    const taskFind = await this.prismaService.task.findFirst({
      where: {
        userId: userDetail.id,
        title: {
          contains: payload.title.trim(), // Partial match
          mode: 'insensitive', // Case-insensitive
        },
      },
    });

    if (taskFind) {
      throw new BadRequestException({
        success: false,
        message: 'Task with a similar title already exists',
      });
    }

    const task = await this.prismaService.task.create({
      data: {
        title: payload.title.trim(),
        description: payload.description.trim(),
        userId: userDetail.id,
      },
    });

    return task;
  }

  async findAllPaginated(filter, skip: number, limit: number) {
    const allTasks = await this.prismaService.task.findMany({
      ...filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      total: await this.prismaService.task.count(filter),
      data: allTasks,
    };
  }

  async updateTask(id: string, data: Partial<Task>, userDetail) {
    const taskFind = await this.prismaService.task.findFirst({
      where: {
        id,
        userId: userDetail.id,
      },
    });

    if (!taskFind) {
      throw new BadRequestException({
        success: false,
        message: 'Task not found or you do not have permission to update it',
      });
    } else if (taskFind.isDeleted && data.isDeleted) {
      throw new BadRequestException({
        success: false,
        message: 'Task is already archived',
      });
    } else if (!taskFind.isDeleted && !data.isDeleted) {
      throw new BadRequestException({
        success: false,
        message: 'Task is already active',
      });
    }
    return this.prismaService.task.update({
      where: { id },
      data,
    });
  }
}
