import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateSampleWorkflowDto } from './create-sample-workflow.dto';

export class ImportWorkflowDto {
    @ApiPropertyOptional({ description: 'Workflow schema version', default: 1 })
    @IsNumber()
    @IsOptional()
    @Min(1)
    schemaVersion?: number;

    @ApiProperty({ description: 'Workflow payload to import' })
    @ValidateNested()
    @Type(() => CreateSampleWorkflowDto)
    workflow: CreateSampleWorkflowDto;

    @ApiPropertyOptional({ description: 'Optional override name for the imported workflow' })
    @IsString()
    @IsOptional()
    name?: string;
}
