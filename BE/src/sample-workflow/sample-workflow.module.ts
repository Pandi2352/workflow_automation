import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SampleWorkflowController } from './sample-workflow.controller';
import { SampleWorkflow, SampleWorkflowSchema } from './schemas/sample-workflow.schema';
import { WorkflowExecutorService } from './services/workflow-executor.service';
import { WorkflowValidatorService } from './services/workflow-validator.service';
import { NodeRegistryService } from './services/node-registry.service';
import { ExpressionEvaluatorService } from './services/expression-evaluator.service';
import { SampleWorkflowService } from './sample-workflow.service';
import { WorkflowHistory, WorkflowHistorySchema } from './schemas/workflow-history.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SampleWorkflow.name, schema: SampleWorkflowSchema },
            { name: WorkflowHistory.name, schema: WorkflowHistorySchema },
        ]),
    ],
    controllers: [SampleWorkflowController],
    providers: [
        SampleWorkflowService,
        WorkflowExecutorService,
        WorkflowValidatorService,
        NodeRegistryService,
        ExpressionEvaluatorService,
    ],
    exports: [SampleWorkflowService, NodeRegistryService, ExpressionEvaluatorService],
})
export class SampleWorkflowModule { }
