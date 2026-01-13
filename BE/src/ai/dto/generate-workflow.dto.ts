import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateWorkflowDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    prompt: string;

    @ApiProperty({ required: false })
    @IsOptional()
    currentNodes?: any[];

    @ApiProperty({ required: false })
    @IsOptional()
    currentEdges?: any[];
}
