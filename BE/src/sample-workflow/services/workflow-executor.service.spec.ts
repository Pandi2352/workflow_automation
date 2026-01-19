import { WorkflowExecutorService } from './workflow-executor.service';
import { ExecutionStatus } from '../enums/execution-status.enum';
import { SampleNodeType } from '../enums/node-type.enum';

describe('WorkflowExecutorService', () => {
    const createService = (historyOverrides: Partial<Record<string, any>> = {}) => {
        const historyModel = {
            findByIdAndUpdate: jest.fn(),
            findById: jest.fn(),
            updateOne: jest.fn(),
            ...historyOverrides,
        };

        const nodeRegistry = { getNode: jest.fn() };
        const expressionEvaluator = { evaluate: jest.fn() };
        const credentialsService = { findById: jest.fn() };

        const service = new WorkflowExecutorService(
            historyModel as any,
            nodeRegistry as any,
            expressionEvaluator as any,
            credentialsService as any,
        );

        return { service, historyModel };
    };

    it('promotes queued executions when a slot frees up', async () => {
        const { service, historyModel } = createService();
        const runExecutionInternal = jest
            .spyOn(service as any, 'runExecutionInternal')
            .mockResolvedValue(undefined);
        jest.spyOn(service as any, 'addLog').mockResolvedValue(undefined);

        const workflow = {
            _id: { toString: () => 'workflow-1' },
            name: 'Queue Test',
            settings: { maxConcurrency: 1 },
        } as any;

        await (service as any).enqueueOrRunExecution('exec-1', workflow, {});
        await (service as any).enqueueOrRunExecution('exec-2', workflow, {});

        expect(runExecutionInternal).toHaveBeenCalledTimes(1);
        expect(historyModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'exec-2',
            expect.objectContaining({ status: ExecutionStatus.QUEUED }),
        );

        historyModel.findById.mockReturnValue({
            select: () => ({
                exec: async () => ({
                    workflowId: { toString: () => 'workflow-1' },
                }),
            }),
        });

        await (service as any).onExecutionFinished('exec-1');

        expect(runExecutionInternal).toHaveBeenCalledTimes(2);
    });

    it('computes exponential backoff with caps and optional jitter', () => {
        const { service } = createService();
        const computeBackoffDelay = (service as any).computeBackoffDelay.bind(service);

        const policy = {
            maxRetries: 5,
            baseDelayMs: 1000,
            maxDelayMs: 3000,
            jitter: 0,
        };

        expect(computeBackoffDelay(policy, 1)).toBe(1000);
        expect(computeBackoffDelay(policy, 2)).toBe(2000);
        expect(computeBackoffDelay(policy, 3)).toBe(3000);
        expect(computeBackoffDelay(policy, 4)).toBe(3000);
    });

    it('applies node-specific retry policy defaults', () => {
        const { service } = createService();
        const resolveRetryPolicy = (service as any).resolveRetryPolicy.bind(service);

        const policy = resolveRetryPolicy(SampleNodeType.OCR, {}, {});

        expect(policy.maxRetries).toBeGreaterThanOrEqual(4);
        expect(policy.baseDelayMs).toBeGreaterThanOrEqual(2000);
        expect(policy.maxDelayMs).toBeGreaterThanOrEqual(60000);
    });
});
