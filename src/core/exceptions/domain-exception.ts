import { DomainExceptionCode } from './domain-exception-codes.js';

export class Extension {
  constructor(
    public message: string,
    public key: string,
  ) {}
}

export class DomainException extends Error {
  code: DomainExceptionCode;
  extensions: Extension[];

  constructor(errorInfo: {
    code: DomainExceptionCode;
    message: string;
    extensions?: Extension[];
  }) {
    super(errorInfo.message);
    this.code = errorInfo.code;
    this.extensions = errorInfo.extensions || [];
    this.name = 'DomainException';
  }
}
