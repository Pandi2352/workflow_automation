import { IsNumber, IsBoolean, IsOptional, IsObject, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClientInfo } from '../../common/utils/client-info.util';

export class ExecuteWorkflowDto {
    @ApiPropertyOptional({ description: 'Execution timeout in milliseconds' })
    @IsNumber()
    @IsOptional()
    @Min(1000)
    @Max(3600000)
    timeout?: number;

    @ApiPropertyOptional({ description: 'Maximum retry attempts for failed nodes' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(10)
    maxRetries?: number;

    @ApiPropertyOptional({ description: 'Whether to retry failed nodes' })
    @IsBoolean()
    @IsOptional()
    retryFailedNodes?: boolean;

    @ApiPropertyOptional({ description: 'Continue execution even if a node fails' })
    @IsBoolean()
    @IsOptional()
    continueOnError?: boolean;

    @ApiPropertyOptional({ description: 'Custom trigger data to pass to the workflow' })
    @IsObject()
    @IsOptional()
    triggerData?: Record<string, any>;
}

// Internal DTO with client info - populated by controller
export interface ExecuteWorkflowOptions extends ExecuteWorkflowDto {
    clientInfo?: ClientInfo;
}
