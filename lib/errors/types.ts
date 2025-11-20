/**
 * Custom Error Types for Pulpa NFC Distribution
 *
 * Provides typed, structured errors with user-friendly messages
 * and detailed context for logging and debugging.
 */

export enum ErrorCode {
  // Blockchain Errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  MINTER_ROLE_MISSING = 'MINTER_ROLE_MISSING',
  CONTRACT_ERROR = 'CONTRACT_ERROR',

  // Database Errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',

  // Security Errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BLACKLISTED_ADDRESS = 'BLACKLISTED_ADDRESS',
  RECIPIENT_ALREADY_RECEIVED = 'RECIPIENT_ALREADY_RECEIVED',
  NFC_NOT_REGISTERED = 'NFC_NOT_REGISTERED',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Configuration Errors
  MISSING_ENV_VARIABLE = 'MISSING_ENV_VARIABLE',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',

  // Validation Errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Unknown Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  nfcId?: string;
  ambassadorAddress?: string;
  recipientAddress?: string;
  transactionHash?: string;
  amount?: string;
  timestamp?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  [key: string]: unknown;
}

export class PulpaError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly context: ErrorContext;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'PulpaError';
    this.code = code;
    this.severity = severity;
    this.userMessage = userMessage;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// Blockchain Error Classes
export class InsufficientBalanceError extends PulpaError {
  constructor(context: ErrorContext = {}) {
    super(
      ErrorCode.INSUFFICIENT_BALANCE,
      'Minter wallet has insufficient balance for transaction',
      'El sistema no tiene suficientes fondos para completar esta transacción. Por favor, contacta al administrador.',
      ErrorSeverity.CRITICAL,
      context,
      true
    );
  }
}

export class TransactionFailedError extends PulpaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      ErrorCode.TRANSACTION_FAILED,
      `Transaction failed: ${message}`,
      'La transacción blockchain falló. Por favor, intenta nuevamente.',
      ErrorSeverity.HIGH,
      context,
      true
    );
  }
}

export class NetworkError extends PulpaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      ErrorCode.NETWORK_ERROR,
      `Network error: ${message}`,
      'Error de conexión de red. Por favor, verifica tu conexión e intenta nuevamente.',
      ErrorSeverity.HIGH,
      context,
      true
    );
  }
}

export class GasEstimationError extends PulpaError {
  constructor(context: ErrorContext = {}) {
    super(
      ErrorCode.GAS_ESTIMATION_FAILED,
      'Failed to estimate gas for transaction',
      'No se pudo estimar el costo de la transacción. Por favor, intenta nuevamente.',
      ErrorSeverity.MEDIUM,
      context,
      true
    );
  }
}

export class InvalidAddressError extends PulpaError {
  constructor(address: string, context: ErrorContext = {}) {
    super(
      ErrorCode.INVALID_ADDRESS,
      `Invalid Ethereum address: ${address}`,
      'La dirección de wallet proporcionada no es válida. Por favor, verifica e intenta nuevamente.',
      ErrorSeverity.LOW,
      { ...context, invalidAddress: address },
      true
    );
  }
}

export class MinterRoleMissingError extends PulpaError {
  constructor(context: ErrorContext = {}) {
    super(
      ErrorCode.MINTER_ROLE_MISSING,
      'Wallet does not have MINTER role on token contract',
      'El sistema no tiene los permisos necesarios. Por favor, contacta al administrador.',
      ErrorSeverity.CRITICAL,
      context,
      true
    );
  }
}

export class ContractError extends PulpaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      ErrorCode.CONTRACT_ERROR,
      `Smart contract error: ${message}`,
      'Error al interactuar con el contrato. Por favor, intenta nuevamente.',
      ErrorSeverity.HIGH,
      context,
      true
    );
  }
}

// Database Error Classes
export class DatabaseConnectionError extends PulpaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      ErrorCode.DATABASE_CONNECTION_FAILED,
      `Database connection failed: ${message}`,
      'Error de conexión a la base de datos. Por favor, intenta nuevamente.',
      ErrorSeverity.CRITICAL,
      context,
      true
    );
  }
}

export class DatabaseQueryError extends PulpaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      ErrorCode.DATABASE_QUERY_FAILED,
      `Database query failed: ${message}`,
      'Error al consultar la base de datos. Por favor, intenta nuevamente.',
      ErrorSeverity.HIGH,
      context,
      true
    );
  }
}

export class RecordNotFoundError extends PulpaError {
  constructor(recordType: string, context: ErrorContext = {}) {
    super(
      ErrorCode.RECORD_NOT_FOUND,
      `${recordType} not found`,
      `No se encontró el registro solicitado.`,
      ErrorSeverity.LOW,
      { ...context, recordType },
      true
    );
  }
}

// Security Error Classes
export class RateLimitError extends PulpaError {
  constructor(retryAfter: number, context: ErrorContext = {}) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      `Has excedido el límite de distribuciones. Por favor, intenta en ${Math.ceil(retryAfter / 60)} minutos.`,
      ErrorSeverity.MEDIUM,
      { ...context, retryAfter },
      true
    );
  }
}

export class BlacklistedAddressError extends PulpaError {
  constructor(address: string, reason: string, context: ErrorContext = {}) {
    super(
      ErrorCode.BLACKLISTED_ADDRESS,
      `Address ${address} is blacklisted: ${reason}`,
      'Esta dirección ha sido bloqueada por razones de seguridad.',
      ErrorSeverity.HIGH,
      { ...context, blacklistedAddress: address, reason },
      true
    );
  }
}

export class RecipientAlreadyReceivedError extends PulpaError {
  constructor(address: string, context: ErrorContext = {}) {
    super(
      ErrorCode.RECIPIENT_ALREADY_RECEIVED,
      `Recipient ${address} has already received tokens`,
      'Esta dirección ya ha recibido tokens $PULPA anteriormente.',
      ErrorSeverity.MEDIUM,
      { ...context, recipientAddress: address },
      true
    );
  }
}

export class NFCNotRegisteredError extends PulpaError {
  constructor(nfcId: string, context: ErrorContext = {}) {
    super(
      ErrorCode.NFC_NOT_REGISTERED,
      `NFC ${nfcId} is not registered`,
      'Este NFC no está registrado. Por favor, registra el NFC primero.',
      ErrorSeverity.MEDIUM,
      { ...context, nfcId },
      true
    );
  }
}

export class UnauthorizedError extends PulpaError {
  constructor(context: ErrorContext = {}) {
    super(
      ErrorCode.UNAUTHORIZED,
      'Unauthorized access',
      'No tienes permiso para realizar esta acción.',
      ErrorSeverity.HIGH,
      context,
      true
    );
  }
}

// Configuration Error Classes
export class MissingEnvVariableError extends PulpaError {
  constructor(variableName: string, context: ErrorContext = {}) {
    super(
      ErrorCode.MISSING_ENV_VARIABLE,
      `Missing required environment variable: ${variableName}`,
      'Error de configuración del sistema. Por favor, contacta al administrador.',
      ErrorSeverity.CRITICAL,
      { ...context, variableName },
      false // Not operational - this is a programming error
    );
  }
}

export class InvalidConfigurationError extends PulpaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      ErrorCode.INVALID_CONFIGURATION,
      `Invalid configuration: ${message}`,
      'Error de configuración del sistema. Por favor, contacta al administrador.',
      ErrorSeverity.CRITICAL,
      context,
      false
    );
  }
}

// Validation Error Classes
export class ValidationError extends PulpaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      ErrorCode.INVALID_INPUT,
      `Validation failed: ${message}`,
      message,
      ErrorSeverity.LOW,
      context,
      true
    );
  }
}

export class MissingFieldError extends PulpaError {
  constructor(fieldName: string, context: ErrorContext = {}) {
    super(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Missing required field: ${fieldName}`,
      `El campo "${fieldName}" es requerido.`,
      ErrorSeverity.LOW,
      { ...context, fieldName },
      true
    );
  }
}

// Helper function to create PulpaError from unknown error
export function toPulpaError(error: unknown, context: ErrorContext = {}): PulpaError {
  if (error instanceof PulpaError) {
    return error;
  }

  if (error instanceof Error) {
    return new PulpaError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
      ErrorSeverity.MEDIUM,
      { ...context, originalError: error.message, stack: error.stack },
      true
    );
  }

  return new PulpaError(
    ErrorCode.UNKNOWN_ERROR,
    String(error),
    'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    ErrorSeverity.MEDIUM,
    { ...context, originalError: String(error) },
    true
  );
}
