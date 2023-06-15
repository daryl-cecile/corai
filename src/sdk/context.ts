import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import type { IncomingMessage, ServerResponse } from "http";
import { json, buffer, text, send, sendError, HttpError, createError } from "micro";
import { parse as parseQS} from "querystring";
import { getRouteRegex, parseRoute, extractRouteParams } from '../cli/routes';

type Request = IncomingMessage;
type Response<Req extends IncomingMessage> = ServerResponse<Req>;

export function createContext<I extends IncomingMessage>(req:I, res:ServerResponse<I>){
    return new Context(req, res);
}

export function parseQueryString(url?:string) {
	if (!url) return {};
	if (!url.includes("?")) return {};
	return parseQS(url.substring(url.indexOf("?") + 1))
}

export class Context<Req extends Request, Res extends Response<Req>> {
    private statusCode?:StatusCodes;
    private statusMessage?:string;
    private ended?:boolean;

    public readonly url:string;
    public readonly query:Record<string, any>;
    public readonly params:Record<string, any>;
    public readonly method:string;
    public readonly path:string;


    constructor(public readonly request:Req, public readonly response:Res, route?:string){
        this.url = request.url!;
        this.query = parseQueryString(request.url)
        this.method = request.method ?? "GET";
        this.path = request.url!.split("?").at(0)!;
        this.params = extractRouteParams(route, this.path);
    }

    async send(data?:any, options?:{ contentType?:string, statusCode?:number }) {
        if (this.statusMessage) this.response.statusMessage = this.statusMessage;
        if (options?.contentType) this.response.setHeader('Content-Type', options.contentType);
        send(this.response, options?.statusCode ?? this.statusCode ?? 200, data);
        this.ended = true;
    }

    async sendError(error:Error|HttpError) {
        sendError(this.request, this.response, error);
        this.ended = true;
        return this;
    }

    notFound(){
        const e = createError(StatusCodes.NOT_FOUND, `The page you have requested was not found: ${this.url}`, new Error());
        return this.sendError(e);
    }

    toString(){
        return JSON.stringify(this.toJSON());
    }

    toJSON(){
        return {
            url: this.url,
            query: this.query,
            method: this.method,
            path: this.path,
            params: this.params
        }
    }

    get hasSent(){
        return this.ended || !this.response.writable;
    }

    setStatus(statusCode:StatusCodes, message?:string){
        this.statusCode = statusCode;
        this.statusMessage = message ?? getReasonPhrase(statusCode);
        return this;
    }

    async readBody<O>(type:"json"):Promise<O>
    async readBody(type:"buffer"):Promise<Buffer> 
    async readBody(type:"text"):Promise<string> 
    async readBody(type:"json"|"buffer"|"text"){
        switch (type){
            case "json":
                return json(this.request);
            case "buffer":
                return buffer(this.request);
            case "text":
            default:
                return text(this.request);
        }
    }

}


export type PageContext = {
    params: Record<string, string>,
    queries: Record<string, any>
}


export type PageMetadata = Partial<{
    appName: string,
    title: string,
    description: string,
    favicon: string,
    referrer: string,
    keywords: Array<string>,
    colorScheme: string,
    canonical: string,
    lang: Record<string, string>,
    openGraph: Partial<{
        title: string,
        description: string,
        url: string,
        siteName: string,
        images: Array<{
            url: string,
            width: number,
            height: number,
            alt?: string
        }>,
        type: string,
        locale: string,
        authors: Array<string>,
        publishedTime: string
    }>
}>;
