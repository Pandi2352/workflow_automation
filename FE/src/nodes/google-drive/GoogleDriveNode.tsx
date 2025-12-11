import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import googleDriveIcon from '../../assets/nodeIcons/google-drive-svgrepo-com.svg';


interface GoogleDriveNodeData extends Record<string, unknown> {
    label?: string;
    executionStatus?: string;
}


const GoogleDriveLogo = () => (
    <img src={googleDriveIcon} alt="Google Drive" className="w-full h-full object-contain" />
);

export const GoogleDriveNode = memo(({ data, isConnectable, selected }: NodeProps) => {
    const driveData = data as GoogleDriveNodeData;
    
    return (
        <div className="relative group min-w-[180px]">
            <div className={`relative flex flex-col items-stretch bg-white rounded-lg border border-gray-100 overflow-hidden duration-200 ${
                selected ? 'border-gray-400 shadow-md' : 'border-gray-400 shadow-md'
            }`}>
                
                {/* Header Section */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 shrink-0">
                            <GoogleDriveLogo />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Drive</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold tracking-tight border border-blue-100">
                        <Zap size={8} fill="currentColor" />
                        <span>TRIGGER</span>
                    </div>
                </div>

                {/* Body Content */}
                <div className="px-3 py-3 bg-white">
                     <span className="block text-sm font-bold text-slate-900 leading-tight max-w-[180px] truncate" title={driveData.label || 'New File'}>
                        {driveData.label || 'New File'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block font-medium">Google Workspace</span>
                </div>

                {/* Status Line */}
                {!!driveData.executionStatus && (
                    <div className={`h-[3px] w-full ${
                        driveData.executionStatus === 'SUCCESS' ? 'bg-green-500' : 
                        driveData.executionStatus === 'FAILED' ? 'bg-red-500' : 
                        'bg-blue-500 animate-pulse'
                    }`} />
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-blue-500 -right-[7px]"
            />
        </div>
    );
});
