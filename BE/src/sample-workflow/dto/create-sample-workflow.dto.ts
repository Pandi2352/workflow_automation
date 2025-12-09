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

/**
 * Input field DTO for structured node inputs
 */
class NodeInputFieldDto {
    @ApiProperty({ description: 'Input field name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Data type', enum: ['string', 'number', 'boolean', 'array', 'object', 'any', 'date', 'file', 'json'] })
    @IsString()
    type: string;

    @ApiPropertyOptional({ description: 'Value type: static or expression', enum: ['static', 'expression'], default: 'static' })
    @IsString()
    @IsOptional()
    valueType?: string;

    @ApiPropertyOptional({ description: 'The value (static) or expression string' })
    @IsOptional()
    value?: any;

    @ApiPropertyOptional({ description: 'Field description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Is this field required', default: false })
    @IsBoolean()
    @IsOptional()
    required?: boolean;

    @ApiPropertyOptional({ description: 'Default value if not provided' })
    @IsOptional()
    defaultValue?: any;

    @ApiPropertyOptional({ description: 'Schema for array/object types' })
    @IsObject()
    @IsOptional()
    schema?: Record<string, any>;
}

/**
 * Output field DTO for structured node outputs
 */
class NodeOutputFieldDto {
    @ApiProperty({ description: 'Output field name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Data type', enum: ['string', 'number', 'boolean', 'array', 'object', 'any', 'date', 'file', 'json'] })
    @IsString()
    type: string;

    @ApiPropertyOptional({ description: 'Field description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Schema for array/object types' })
    @IsObject()
    @IsOptional()
    schema?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Example value' })
    @IsOptional()
    example?: any;
}

class NodeDataDto {
    @ApiPropertyOptional({ description: 'Simple value for basic nodes (backward compatibility)' })
    @IsOptional()
    value?: any;

    @ApiPropertyOptional({ description: 'Node configuration/settings' })
    @IsObject()
    @IsOptional()
    config?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Structured input fields with types and values/expressions', type: [NodeInputFieldDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NodeInputFieldDto)
    @IsOptional()
    inputs?: NodeInputFieldDto[];

    @ApiPropertyOptional({ description: 'Structured output fields declaration', type: [NodeOutputFieldDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NodeOutputFieldDto)
    @IsOptional()
    outputs?: NodeOutputFieldDto[];

    @ApiPropertyOptional({ description: 'Input mappings - key to expression mapping' })
    @IsObject()
    @IsOptional()
    inputMappings?: Record<string, string>;

    @ApiPropertyOptional({ description: 'Static input values' })
    @IsObject()
    @IsOptional()
    inputValues?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Output mapping transformation' })
    @IsObject()
    @IsOptional()
    outputMapping?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Credentials reference ID' })
    @IsString()
    @IsOptional()
    credentialId?: string;

    @ApiPropertyOptional({ description: 'Custom node-specific parameters' })
    @IsObject()
    @IsOptional()
    parameters?: Record<string, any>;
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
