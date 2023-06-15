
interface ServeError<F> {
    new (message:string): ServeError<F>,
    (message:string): ServeError<F>,
    name: string,
    message: string,
    stack?: Error['stack'],
    details?: F
}

function defineErrorType<F>(errorName:string){
    function CustomError(this: ServeError<F>, message:string, details?:any) {
        if (new.target) {
            this.name = errorName;
            this.message = message;
            this.details = details;
            Error.captureStackTrace(this, CustomError);
        }
        else {
            return new (CustomError as unknown as ServeError<F>)(message);
        }
    }
    return CustomError as unknown as ServeError<F>;
}


export const ApplicationError = defineErrorType('ApplicationError');

