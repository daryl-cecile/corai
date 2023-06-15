import { bundleRequire } from "bundle-require";
import { Context, PageMetadata } from "../../sdk";
import { renderToString } from "react-dom/server";
import { stringifyJSX } from "./jsxHelper";
import { existsSync } from "fs";
import mime from "mime";
import { join } from "path";
import { readFile } from "fs/promises";
import { Layout } from "../../sdk/components";

export async function handleEndpoint(filePath:string, context:Context<any, any>){
    const {mod} = await bundleRequire({
        filepath: filePath
    });

    const handler = mod[context.method] ?? mod.default ?? mod;

    await handler(context);
}

export async function handleResource(context:Context<any, any>) {
    const resourcePath = join( __filename, "./../../internal", context.path.replace("/_serve/", "/") );

    if (!context.path.startsWith("/_serve/") || !existsSync(resourcePath)) return;
    
    const file = await readFile(resourcePath);
    await context.send(file, { contentType: mime.getType(resourcePath) ?? "application/octet-stream" });
}

export async function handlePublicAssets(projectRootAbsPath:string, context:Context<any, any>) {
    const fileName = context.path.replace(/[.]*/, '');
    const publicAssetPath = join(projectRootAbsPath , 'public', fileName);
    
    if (!existsSync(publicAssetPath)) return;

    const file = await readFile(publicAssetPath);
    await context.send(file, { contentType: mime.getType(publicAssetPath) ?? "application/octet-stream" });
}

export async function handlePage(filePath:string, context:Context<any, any>) {
    // TODO handle pre building for PROD
    const {mod} = await bundleRequire({
        filepath: filePath
    });

    const Page = mod.default ?? mod.Page ?? mod;

    const metadata:PageMetadata = normalizeMetadata(mod.metadata ?? mod.generateMetadata?.());

    const clientJSX = await renderToClientJSX(
        <Layout metadata={metadata}>
            <Page params={context.params} queries={context.query} />
        </Layout>
    );
    const clientJSXString = stringifyJSX(clientJSX);

    if ("jsx" in context.query) {
        context.send(clientJSXString, { contentType: 'application/json' });
        return;
    }

    let html = renderToString(clientJSX);
    html += `<script>window.__INITIAL_JSX_STRING__ = ${JSON.stringify(clientJSXString).replace(/</g, "\\u003c")}</script>`;
    html += `<script type="importmap">${getImportMap()}</script>`;
    html += `<script type="module" src="/_serve/client.mjs"></script>`;

    context.send(html, { contentType: 'text/html' });
}

function getImportMap(){
    return JSON.stringify({
        imports: {
            "react": "https://esm.sh/react@canary",
            "react-dom/client": "https://esm.sh/react-dom@canary/client"
        }
    });
}

function normalizeMetadata(meta?:PageMetadata):PageMetadata {
    const finalMetadata:PageMetadata = {
        title: meta?.title ?? 'Serve',
        description: meta?.description ?? 'A small but extensible React Server',
        favicon: meta?.favicon ?? '/favicon.ico'
    }

    return finalMetadata;
}

async function renderToClientJSX(jsx:any):Promise<any> {
    if ( typeof jsx === "string" || typeof jsx === "number" || typeof jsx === "boolean" || jsx == null ) return jsx;
    
    if ( Array.isArray(jsx) ) return Promise.all( jsx.map(child => renderToClientJSX(child)) );

    if ( jsx != null && typeof jsx === "object" ){

        if ( jsx.$$typeof === Symbol.for("react.element") ) {

            if (typeof jsx.type === "string") return { ...jsx, props: await renderToClientJSX(jsx.props) };
            
            if (typeof jsx.type === "function") {

                const Component = jsx.type;
                const props = jsx.props;
                const returnedJsx = await Component(props);
                return renderToClientJSX(returnedJsx);

            }

            throw Error('Not implemented');

        }

        const rendered:Array<Promise<[string, any]>> = Object.entries(jsx).map(async ([propName, value]):Promise<[string, any]> => [
            propName,
            await renderToClientJSX(value),
        ]);

        return Object.fromEntries(await Promise.all(rendered));

    }

    throw Error('Not implemented');
}