function inject (...dependencies: Array<string|Function>) {
    return (constructor: Function) => {
        constructor.$inject = dependencies.map(d => typeof d === 'string' ? d: d.name);
    };
}

export { inject };
