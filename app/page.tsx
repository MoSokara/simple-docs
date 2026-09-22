import {DocsApp} from "@/components/docs/docs-app";import {getDocsTree} from "@/lib/docs";
export default function Home(){return <DocsApp tree={getDocsTree()}/>}
