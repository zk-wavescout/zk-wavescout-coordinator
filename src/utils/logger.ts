type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function timestamp(): string {
  return new Date().toISOString();
}

function formatLog(level: LogLevel, message: string, data?: any): void {
  const colorMap = {
    debug: colors.gray,
    info: colors.blue,
    warn: colors.yellow,
    error: colors.red,
  };

  const color = colorMap[level];
  const prefix = `${color}[${level.toUpperCase()}]${colors.reset} ${timestamp()}`;

  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDev) formatLog('debug', message, data);
  },
  info: (message: string, data?: any) => {
    formatLog('info', message, data);
  },
  warn: (message: string, data?: any) => {
    formatLog('warn', message, data);
  },
  error: (message: string, data?: any) => {
    formatLog('error', message, data);
  },
};
