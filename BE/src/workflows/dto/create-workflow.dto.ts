import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkflowDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ default: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty()
    @IsArray()
    @IsOptional()
    nodes?: any[];

    @ApiProperty()
    @IsArray()
    @IsOptional()
    edges?: any[];

    @ApiProperty()
    @IsOptional()
    meta?: {
        tags: string[];
        createdBy: string;
    };
}
