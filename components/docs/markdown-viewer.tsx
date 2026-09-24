"use client";

import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useMemo, useRef } from "react";

type Props = {
  markdown: string;
  currentPath: string;
  anchor: string | null;
  onNavigate: (path: string, anchor: string | null) => void;
  onExternal: (url: string) => void | Promise<void>;
};

function resolveRelativePath(currentPath: string, href: string) {
  const decoded = decodeURIComponent(href);
  const [targetPart, hashPart = ""] = decoded.split("#", 2);
  const target = targetPart.split("?")[0];

  if (!target) return { path: null, anchor: hashPart || null };

  const base = currentPath.split("/").slice(0, -1);
  const segments = [...base, ...target.split("/")];
  const result: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      result.pop();
      continue;
    }
    result.push(segment);
  }

  return {
    path: result.join("/"),
    anchor: hashPart || null,
  };
}

function isExternalHref(href: string) {
  return /^(https?|mailto):/i.test(href);
}

function addCodeToolbar(container: HTMLElement, code: string, language: string) {
  if (container.querySelector("[data-copy-code]")) return;

  const toolbar = document.createElement("div");
  toolbar.className = "markdown-code-toolbar";

  const label = document.createElement("span");
  label.className = "markdown-code-language";
  label.textContent = language || "text";

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.copyCode = "true";
  button.dataset.code = code;
  button.className = "markdown-copy-button";
  button.textContent = "Copy";
  button.setAttribute("aria-label", "Copy code");
  button.title = "Copy code";

  toolbar.append(label, button);
  container.prepend(toolbar);
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function MarkdownViewer({
  markdown,
  currentPath,
  anchor,
  onNavigate,
  onExternal,
}: Props) {
  const articleRef = useRef<HTMLElement>(null);

  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(markdown) as string),
    [markdown],
  );

  useEffect(() => {
    let active = true;

    async function enhanceCodeBlocks() {
      const article = articleRef.current;
      if (!article) return;

      const blocks = Array.from(article.querySelectorAll("pre > code"));
      if (blocks.length) {
        const { codeToHtml } = await import("shiki");

        await Promise.all(
          blocks.map(async (codeElement) => {
            if (!active) return;

            const rawCode = codeElement.textContent ?? "";
            const languageClass = Array.from(codeElement.classList).find((value) =>
              value.startsWith("language-"),
            );
            const language = languageClass
              ? languageClass.replace("language-", "")
              : "text";

            let highlighted: string;

            try {
              highlighted = await codeToHtml(rawCode, {
                lang: language as never,
                theme: "dark-plus",
              });
            } catch {
              highlighted = await codeToHtml(rawCode, {
                lang: "text",
                theme: "dark-plus",
              });
            }

            if (!active) return;

            const markup = document.createElement("div");
            markup.innerHTML = highlighted;

            const newPre = markup.querySelector("pre");
            const originalPre = codeElement.parentElement;
            if (!newPre || !originalPre) return;

            const wrapper = document.createElement("div");
            wrapper.className = "markdown-code-wrapper";
            wrapper.appendChild(newPre);
            addCodeToolbar(wrapper, rawCode, language);
            originalPre.replaceWith(wrapper);
          }),
        );
      }

      if (anchor) {
        window.requestAnimationFrame(() => {
          if (!active) return;

          document.getElementById(anchor)?.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
        });
      }
    }

    void enhanceCodeBlocks();

    return () => {
      active = false;
    };
  }, [html, anchor]);

  function handleClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;

    const copyButton = target.closest<HTMLButtonElement>("[data-copy-code]");
    if (copyButton) {
      const code = copyButton.dataset.code ?? "";

      void copyText(code)
        .then(() => {
          copyButton.textContent = "Copied";
          window.setTimeout(() => {
            copyButton.textContent = "Copy";
          }, 1200);
        })
        .catch(() => {
          copyButton.textContent = "Copy failed";
          window.setTimeout(() => {
            copyButton.textContent = "Copy";
          }, 1200);
        });

      return;
    }

    const link = target.closest<HTMLAnchorElement>("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    if (href.startsWith("#")) return;

    if (isExternalHref(href)) {
      event.preventDefault();
      void onExternal(href);
      return;
    }

    if (/^javascript:/i.test(href)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    try {
      const resolved = resolveRelativePath(currentPath, href);

      if (resolved.path) {
        onNavigate(resolved.path, resolved.anchor);
      } else if (resolved.anchor) {
        document.getElementById(resolved.anchor)?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      }
    } catch {}
  }

  return (
    <article
      ref={articleRef}
      className="markdown"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
