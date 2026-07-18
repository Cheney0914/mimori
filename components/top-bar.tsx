import Link from "next/link";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { LanguageCode } from "@/lib/types";
export function TopBar({language="en",onLanguageChange,world=true,disabled=false}:{language?:LanguageCode;onLanguageChange?:(language:LanguageCode)=>void;world?:boolean;disabled?:boolean}){return <nav className="top"><button className="toplanguage" disabled={disabled} onClick={()=>onLanguageChange?.(language==="en"?"ja":"en")}>{language==="en"?"ENGLISH":"日本語"}<ChevronDown size={13} strokeWidth={2.5}/></button>{world&&<Link href="/world">MY WORLD <ArrowUpRight size={13} strokeWidth={2.5}/></Link>}</nav>}
