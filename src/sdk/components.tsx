import type { ReactNode } from "react";
import type { PageMetadata } from "./context";


// @internal
export function Layout({metadata, children}:{metadata:PageMetadata, children:ReactNode}){
    return (
        <html>
            <head>
                {metadata?.title && <title>{metadata.title}</title>}

                <Meta name="description" content={metadata.description} />
                <Meta name="application-name" content={metadata.appName} />
                <Meta name="referrer" content={metadata.referrer} />
                <Meta name="color-scheme" content={metadata.colorScheme} />
                <Meta name="keywords" content={metadata.keywords?.join(', ')} />
                
                <LinkRel rel="canonical" href={metadata.canonical} />
                {Object.entries(metadata.lang ?? {}).map(lang => {
                    return <LinkRel key={lang[0]} rel="alternate" hrefLang={lang[0]} href={lang[1]} />
                })}
                <LinkRel rel="favicon" href={metadata.favicon} />

                <Meta property="og:title" content={metadata.openGraph?.title ?? metadata.title} />
                <Meta property="og:description" content={metadata.openGraph?.description ?? metadata.description} />
                <Meta property="og:url" content={metadata.openGraph?.url} />
                <Meta property="og:site_name" content={metadata.openGraph?.siteName} />
                <Meta property="og:locale" content={metadata.openGraph?.locale} />
                {metadata.openGraph?.images?.map(img => {
                    return (
                        <>
                            <Meta property="og:image:url" content={img.url} />
                            <Meta property="og:image:width" content={img.width.toString()} />
                            <Meta property="og:image:height" content={img.height.toString()} />
                            <Meta property="og:image:alt" content={img.alt} />
                        </>
                    )
                })}
                <Meta property="og:type" content="website" />
                
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}

function Meta(props:{name?:string, property?:string, content?:string}){
    if (!props.content) return null;

    return <meta name={props.name} property={props.property} content={props.content} />
}

function LinkRel(props:{rel:string, href?:string, type?:string, hrefLang?:string}){
    if (!props.href) return null;

    return <link rel={props.rel} href={props.href} type={props.type} hrefLang={props.hrefLang} />
}