import { ReactNode } from "react";
export function AppShell({children, dots=false}:{children:ReactNode;dots?:boolean}) { return <main className={`app enter ${dots ? "dots" : ""}`}>{children}</main>; }
