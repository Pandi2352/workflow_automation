import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateWorkflowDto } from './dto/generate-workflow.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('generate-workflow')
    @ApiOperation({ summary: 'Generate a workflow structure from natural language' })
    @UsePipes(new ValidationPipe())
    async generateWorkflow(@Body() dto: GenerateWorkflowDto) {
        return this.aiService.generateWorkflow(dto.prompt);
    }
}
