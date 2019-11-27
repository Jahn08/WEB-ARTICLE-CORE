window.define = function(name, required, moduleFn) {
    const _require = function() { throw new Error('AMD require is not supported')};
    const _exports = window.define.modules[name] = {};
    const resolved = [_require, _exports];
    
    for (let i = 2; i < required.length; ++i) {
        const _module = window.define.modules[required[i]];
      
        if (!_module)
            throw new Error(`AMD module '${required[i]}' is not found`);
      
        resolved.push(_module);
    }

    moduleFn.apply(null, resolved);
}

window.define.modules = {
    jquery: jQuery,
    '@microsoft/signalr': signalR,
    '@uirouter/angularjs': angular,
    angular
};
