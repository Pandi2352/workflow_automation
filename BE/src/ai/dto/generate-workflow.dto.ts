import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateWorkflowDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    prompt: string;
}
