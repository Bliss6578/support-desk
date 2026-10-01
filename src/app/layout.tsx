import type{Metadata}from"next";import"./globals.css";import{StoreProvider}from"@/store/provider";import{Header}from"@/components/Header";
export const metadata:Metadata={title:"SupportDesk",description:"Support ticket operations dashboard"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><StoreProvider><Header/><main>{children}</main></StoreProvider></body></html>}
