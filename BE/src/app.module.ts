import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkflowsModule } from './workflows/workflows.module';
import { SampleWorkflowModule } from './sample-workflow/sample-workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/workflow_automation'),
    WorkflowsModule,
    SampleWorkflowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
