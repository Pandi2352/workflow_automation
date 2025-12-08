import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workflow, WorkflowDocument } from './schemas/workflow.schema';
import { CreateWorkflowDto } from './dto/create-workflow.dto';

@Injectable()
export class WorkflowsService {
    constructor(@InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocument>) { }

    async create(createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
        const createdWorkflow = new this.workflowModel(createWorkflowDto);
        return createdWorkflow.save();
    }

    async findAll(): Promise<Workflow[]> {
        return this.workflowModel.find().exec();
    }

    async findOne(id: string): Promise<Workflow> {
        const workflow = await this.workflowModel.findById(id).exec();
        if (!workflow) {
            throw new NotFoundException(`Workflow wih ID ${id} not found`);
        }
        return workflow;
    }

    async update(id: string, updateWorkflowDto: Partial<CreateWorkflowDto>): Promise<Workflow> {
        const updatedWorkflow = await this.workflowModel
            .findByIdAndUpdate(id, updateWorkflowDto, { new: true })
            .exec();

        if (!updatedWorkflow) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        return updatedWorkflow;
    }

    async remove(id: string): Promise<void> {
        const result = await this.workflowModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
    }
}
