import { getRouteRegex } from "../routes";

export function matchFile(path:string, opt:{files:Array<string>, projectDir:string}):Array<string>{
    return opt.files.filter(fp => {
        const relativeFp = fp.replace(opt.projectDir, '');

        const fileRoute = relativeFp.substring(0, relativeFp.lastIndexOf("/") + 1);

        if (fileRoute === path) return true;

        const pattern = getRouteRegex(fileRoute);

        if (pattern.re.test(path)) return true;

        return false;
    });
}

export function isEndpoint(filePath:string){
    return filePath.endsWith('/endpoint.ts');
}

export function isPage(filePath:string) {
    return filePath.endsWith('/page.tsx');
}
