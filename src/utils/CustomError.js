class CustomError extends Error {
    constructor(code) {
        super(code);
        this.code = code;
    }
}

export default CustomError;