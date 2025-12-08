export enum ExecutionStatus {
    PENDING = 'PENDING',
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    PAUSED = 'PAUSED',
    WAITING = 'WAITING',
}

export enum NodeExecutionStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
    CANCELLED = 'CANCELLED',
}

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}
