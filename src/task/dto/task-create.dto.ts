import { IsNotEmpty, IsString } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskCreateDto {
  @ApiProperty({ example: 'Task Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Task Description' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
