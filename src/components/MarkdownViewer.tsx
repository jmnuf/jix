import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark as higlighterDarkStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
      components={{
        h1: 'h2',
        h2: 'h3',
        h3: 'h4',
        h4: 'h5',
        h5: 'h6',
        h6: 'h6',
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

