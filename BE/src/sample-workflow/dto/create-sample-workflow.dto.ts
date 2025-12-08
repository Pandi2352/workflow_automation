import { IsString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SampleNodeType } from '../enums/node-type.enum';

class NodePositionDto {
    @ApiPropertyOptional({ default: 0 })
    @IsNumber()
    @IsOptional()
    x?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsNumber()
    @IsOptional()
    y?: number;
}

class NodeDataDto {
    @ApiPropertyOptional({ description: 'Value for INPUT nodes' })
    @IsNumber()
    @IsOptional()
    value?: number;

    @ApiPropertyOptional({ description: 'Additional configuration' })
    @IsObject()
    @IsOptional()
    config?: Record<string, any>;
}

class NodeDto {
    @ApiProperty({ description: 'Unique node identifier' })
    @IsString()
    id: string;

    @ApiProperty({ description: 'User-friendly node name' })
    @IsString()
    nodeName: string;

    @ApiProperty({ enum: SampleNodeType, description: 'Type of node' })
    @IsEnum(SampleNodeType)
    type: SampleNodeType;

    @ApiPropertyOptional()
    @ValidateNested()
    @Type(() => NodeDataDto)
    @IsOptional()
    data?: NodeDataDto;

    @ApiPropertyOptional()
    @ValidateNested()
    @Type(() => NodePositionDto)
    @IsOptional()
    position?: NodePositionDto;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;
}

class EdgeDto {
    @ApiProperty({ description: 'Unique edge identifier' })
    @IsString()
    id: string;

    @ApiProperty({ description: 'Source node ID' })
    @IsString()
    source: string;

    @ApiProperty({ description: 'Target node ID' })
    @IsString()
    target: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    sourceHandle?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    targetHandle?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    label?: string;
}

class WorkflowSettingsDto {
    @ApiPropertyOptional({ description: 'Execution timeout in milliseconds', default: 300000 })
    @IsNumber()
    @IsOptional()
    @Min(1000)
    @Max(3600000)
    timeout?: number;

    @ApiPropertyOptional({ description: 'Maximum retry attempts for failed nodes', default: 3 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(10)
    maxRetries?: number;

    @ApiPropertyOptional({ description: 'Continue execution even if a node fails', default: false })
    @IsBoolean()
    @IsOptional()
    continueOnError?: boolean;
}

export class CreateSampleWorkflowDto {
    @ApiProperty({ description: 'Workflow name' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Workflow description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ type: [NodeDto], description: 'Workflow nodes' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NodeDto)
    nodes: NodeDto[];

    @ApiProperty({ type: [EdgeDto], description: 'Connections between nodes' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EdgeDto)
    edges: EdgeDto[];

    @ApiPropertyOptional()
    @ValidateNested()
    @Type(() => WorkflowSettingsDto)
    @IsOptional()
    settings?: WorkflowSettingsDto;

    @ApiPropertyOptional({ type: [String], description: 'Tags for categorization' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}
