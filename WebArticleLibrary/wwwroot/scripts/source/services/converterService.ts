import { ISCEService } from "angular";

class ConverterService {
    strToBytes(content: string): string {
        return btoa(unescape(encodeURIComponent(content)));
    }
    
    convertByteStringToHtml($sce: ISCEService, content: string): string {
        return $sce.trustAsHtml(this.bytesToStr(content));
    }

    bytesToStr(content: string): string {
        return decodeURIComponent(escape(atob(content)));
    }
}

export { ConverterService };
