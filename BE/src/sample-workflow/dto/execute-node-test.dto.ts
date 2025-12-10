import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class ExecuteNodeTestDto {
    @ApiProperty({ description: 'Type of the node to execute (e.g., GOOGLE_DRIVE)' })
    @IsString()
    @IsNotEmpty()
    nodeType: string;

    @ApiProperty({ description: 'Configuration data for the node', type: Object })
    @IsObject()
    @IsNotEmpty()
    nodeData: Record<string, any>;

    @ApiProperty({ description: 'Simulated inputs from previous nodes', required: false })
    @IsOptional()
    inputs?: any[];
}
