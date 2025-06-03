import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark as higlighterDarkStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useRef, useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { visit } from "unist-util-visit";

interface MarkdownViewerProps {
  content: string;
  onCheckboxChange?: (e: { readonly checked: boolean; index: number; event: ChangeEvent<HTMLInputElement>; }) => void;
}

function indexedCheckboxes() {
  return (tree: any) => {
    let checkboxIndex = 0;
    visit(tree, 'listItem', (node: any) => {
      if (node.checked == null) return;
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties['data-index'] = checkboxIndex;
      checkboxIndex++;
    });
  };
}

export function MarkdownViewer({ content, onCheckboxChange }: MarkdownViewerProps) {

  return (
    <Markdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }], indexedCheckboxes]}
      components={{
        h1: 'h2',
        h2: 'h3',
        h3: 'h4',
        h4: 'h5',
        h5: 'h6',
        h6: 'h6',

        input(props) {
          const { children, className, node, disabled, ...rest } = props;
          const [checked, setChecked] = useState(!!props.checked);
          const ref = useRef<HTMLInputElement | null>(null);
          const [idx, setIdx] = useState(-1);
          useEffect(() => {
            if (ref.current == null) return;
            const elem = ref.current;
            const parent = elem.parentElement!;
            const index = parent.dataset.index ?? '-1';
            elem.dataset.index = index;
            setIdx(+index);
          }, []);

          if (props.type !== 'checkbox') {
            return (
              <input {...rest} className={className} disabled />
            );
          }

          return <input {...rest} ref={ref} checked={checked} className={className} onChange={(event) => {
            setChecked(!checked);
            onCheckboxChange?.({ event, checked, index: idx });
          }} />
        },

        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className ?? '');
          if (match == null) {
            return (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          }
          const lang = match[1];
          return (
            // @ts-ignore IDK wtf is the error this has or why it's giving it, this is literally copied from the react-markdown readme
            <SyntaxHighlighter
              {...rest}
              PreTag="div"
              children={String(children).replace(/\n$/, '')}
              language={lang}
              style={higlighterDarkStyle}
            />
          );
        }
      }}
    >
      {content}
    </Markdown>
  );
}

