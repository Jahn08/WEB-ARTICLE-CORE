class ConverterService {
    strToBytes(content: string): string {
        return btoa(unescape(encodeURIComponent(content)));
    }

    bytesToStr(content: string): string {
        return decodeURIComponent(escape(atob(content)));
    }
}

export { ConverterService };
