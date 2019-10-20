function limitToFormat(): (input: string, length: number) => string {
    return function (input, length) {
        input = input || '';
        return input.length > length ? input.substr(0, length) + '...' : input;
    };
}

export { limitToFormat };
