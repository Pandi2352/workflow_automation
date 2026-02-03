import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { TriggerNodeBase } from '../base/TriggerNodeBase';
import oneDriveIcon from '../../../assets/nodeIcons/ms-onedrive-svgrepo-com.svg';

export const OneDriveNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
    const nodeStatus = data.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;

    return (
        <TriggerNodeBase
            id={id}
            label={String(data.label || 'New OneDrive Files')}
            badgeText="ONEDRIVE"
            detailText="Microsoft 365"
            icon={<img src={oneDriveIcon} alt="OneDrive" className="w-7 h-7 object-contain" />}
            accent="blue"
            selected={selected}
            isConnectable={isConnectable}
            executionStatus={nodeStatus}
        />
    );
});

export default OneDriveNode;
