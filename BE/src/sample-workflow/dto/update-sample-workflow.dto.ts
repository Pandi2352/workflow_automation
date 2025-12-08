import { PartialType } from '@nestjs/swagger';
import { CreateSampleWorkflowDto } from './create-sample-workflow.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSampleWorkflowDto extends PartialType(CreateSampleWorkflowDto) {
    @ApiPropertyOptional({ description: 'Whether the workflow is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
