class JQueryFeatures {
    constructor(private elem: JQuery<HTMLElement>) { }

    initHtmlEditor() { (this.elem as any).wysiwyg(); }

    initTagSelector() { 
        // TODO: Otherwise here is a clash between the RequireJS and NodeJS dependencies
        (this.elem as any).select2({
            tags: true,
            tokenSeparators: [',', '.', ' ', ':'],
            width: "100%"
        });
    }

    fixateElement() {
        (this.elem as any).affix({ offset: { top: 20 } });
    }
}

export { JQueryFeatures };
