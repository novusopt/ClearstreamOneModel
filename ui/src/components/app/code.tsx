"use client";

import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { Check, CheckCircle, Copy01, AlertTriangle } from "@untitledui/icons";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useState } from "react";
import type { SchemaIssue } from "@/lib/standards/validate";
import { cx } from "@/utils/cx";

const highlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [t.propertyName, t.definition(t.propertyName)], color: "#0d5a50" },
    { tag: [t.keyword, t.operatorKeyword, t.controlKeyword], color: "#0f7062", fontWeight: "500" },
    { tag: [t.string, t.special(t.string)], color: "#8a5a0b" },
    { tag: [t.number, t.bool, t.null, t.atom], color: "#9c3d1e" },
    { tag: [t.comment, t.meta], color: "#8b9794", fontStyle: "italic" },
    { tag: [t.function(t.variableName), t.typeName], color: "#1d4e89" },
    { tag: [t.punctuation, t.separator], color: "#6b7a77" },
  ]),
);

const LANGUAGES = { yaml, sql, python };

interface CodeProps {
  value: string;
  language: keyof typeof LANGUAGES;
  onChange?: (value: string) => void;
  minHeight?: string;
  maxHeight?: string;
  ariaLabel: string;
}

export function Code({ value, language, onChange, minHeight, maxHeight, ariaLabel }: CodeProps) {
  const extensions = useMemo(
    () => [LANGUAGES[language](), highlight, EditorView.lineWrapping, EditorView.contentAttributes.of({ "aria-label": ariaLabel })],
    [language, ariaLabel],
  );
  return (
    <CodeMirror
      value={value}
      theme="none"
      editable={Boolean(onChange)}
      readOnly={!onChange}
      onChange={onChange}
      extensions={extensions}
      minHeight={minHeight}
      maxHeight={maxHeight}
      basicSetup={{ foldGutter: false, highlightActiveLine: Boolean(onChange), highlightActiveLineGutter: Boolean(onChange), lineNumbers: true }}
    />
  );
}

/** A generated document with its standard, whether it validates, and what is wrong if it does not. */
export function DocumentPanel({ title, standard, yamlText, issues, maxHeight = "560px", className }: { title: string; standard: string; yamlText: string; issues: SchemaIssue[]; maxHeight?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(yamlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className={cx("overflow-hidden rounded-xl border border-secondary bg-primary", className)}>
      <div className="flex items-center gap-3 border-b border-secondary bg-secondary px-4 py-2">
        <span className="min-w-0">
          <span className="block truncate font-mono text-xs font-medium text-secondary">{title}</span>
          <span className="block font-mono text-[11px] text-tertiary">{standard}</span>
        </span>
        <span className={cx("ml-auto flex shrink-0 items-center gap-1 text-xs font-medium", issues.length ? "text-warning-primary" : "text-success-primary")}>
          {issues.length ? <AlertTriangle className="size-3.5" /> : <CheckCircle className="size-3.5" />}
          {issues.length ? `${issues.length} schema ${issues.length === 1 ? "issue" : "issues"}` : "Valid"}
        </span>
        <button type="button" onClick={copy} aria-label={`Copy ${title}`} className="shrink-0 cursor-pointer rounded p-1 text-quaternary outline-brand hover:text-secondary focus-visible:outline-2">
          {copied ? <Check className="size-4 text-success-primary" /> : <Copy01 className="size-4" />}
        </button>
      </div>
      {issues.length > 0 && (
        <ul className="border-b border-secondary bg-warning-primary px-4 py-2 text-xs text-warning-primary">
          {issues.slice(0, 4).map((issue) => (
            <li key={`${issue.path}${issue.message}`}>
              <span className="font-mono">{issue.path}</span> {issue.message}
            </li>
          ))}
        </ul>
      )}
      <Code value={yamlText} language="yaml" maxHeight={maxHeight} ariaLabel={title} />
    </div>
  );
}
