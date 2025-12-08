import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExecutionStatus } from '../enums/execution-status.enum';

export class QueryHistoryDto {
    @ApiPropertyOptional({ description: 'Filter by workflow ID' })
    @IsString()
    @IsOptional()
    workflowId?: string;

    @ApiPropertyOptional({ enum: ExecutionStatus, description: 'Filter by execution status' })
    @IsEnum(ExecutionStatus)
    @IsOptional()
    status?: ExecutionStatus;

    @ApiPropertyOptional({ default: 1 })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 20 })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({ description: 'Sort by field', default: 'createdAt' })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc';
}
