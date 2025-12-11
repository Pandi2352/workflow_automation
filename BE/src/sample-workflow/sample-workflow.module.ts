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
import { GoogleDriveController } from './controllers/google-drive.controller';
import { OneDriveController } from './controllers/onedrive.controller';
import { CredentialsModule } from '../credentials/credentials.module';
import { ConfigModule } from '@nestjs/config';
import { GoogleDriveService } from './node-services/google-drive.service';
import { OneDriveService } from './node-services/onedrive.service';
import { GmailService } from './node-services/gmail.service';
import { SchedulerService } from './services/scheduler.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SampleWorkflow.name, schema: SampleWorkflowSchema },
            { name: WorkflowHistory.name, schema: WorkflowHistorySchema },
        ]),
        CredentialsModule,
        ConfigModule,
    ],
    controllers: [SampleWorkflowController, GoogleDriveController, OneDriveController],
    providers: [
        SampleWorkflowService,
        WorkflowExecutorService,
        WorkflowValidatorService,
        NodeRegistryService,
        ExpressionEvaluatorService,
        GoogleDriveService,
        OneDriveService,
        GmailService,
        SchedulerService,
    ],
    exports: [SampleWorkflowService, NodeRegistryService, ExpressionEvaluatorService],
})
export class SampleWorkflowModule { }
