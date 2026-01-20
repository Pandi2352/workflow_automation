import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { TriggerNodeBase } from '../base/TriggerNodeBase';
import googleDriveIcon from '../../../assets/nodeIcons/google-drive-svgrepo-com.svg';

interface GoogleDriveNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
}

export const GoogleDriveNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const driveData = data as GoogleDriveNodeData;
    const { currentExecution } = useWorkflowStore();

    const nodeStatus = driveData.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;

    return (
        <TriggerNodeBase
            label={driveData.label || 'New Drive Files'}
            badgeText="GOOGLE DRIVE"
            detailText="Cloud Workspace"
            icon={<img src={googleDriveIcon} alt="Google Drive" className="w-7 h-7 object-contain" />}
            accent="blue"
            selected={selected}
            isConnectable={isConnectable}
            executionStatus={nodeStatus}
        />
    );
});

export default GoogleDriveNode;

