import { ValidationErrorInfo } from './types/common'

type ApiErrorArgs = {
  message: string;
  status: number;

  body?: any;
};

export class ApiError<Body> extends Error {
  public readonly status: number
  public readonly body: Body
  constructor({ message, status, body }: ApiErrorArgs) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type ValidationErrorBody = {
  detail: ValidationErrorInfo[];
};

export class ValidationError extends ApiError<ValidationErrorBody> {
  constructor(args: ApiErrorArgs) {
    super(args)
    this.name = 'ValidationError'
  }

  get fieldErrors(): ValidationErrorInfo[] {
    // NOTE: this is a hack to support both FastAPI/Pydantic errors
    // and some custom 422 errors that might not be in the Pydantic format.
    if (typeof this.body.detail === 'string') {
      return [
        {
          loc: ['body'],
          msg: this.body.detail,
          type: 'value_error',
        },
      ]
    }
    return this.body.detail || []
  }

  getFieldErrors(field: string): ValidationErrorInfo[] {
    return this.fieldErrors.filter(
      (error) => error.loc[error.loc.length - 1] === field,
    )
  }
}