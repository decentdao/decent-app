import { Viewer } from '@toast-ui/react-editor';
import '../../assets/css/Markdown.css';

const XMLSPECIAL = '[&<>"]';
const reXmlSpecial = new RegExp(XMLSPECIAL, 'g');

function replaceUnsafeChar(char: string) {
  switch (char) {
    case '&':
      return '&amp;';
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    case '"':
      return '&quot;';
    default:
      return char;
  }
}

function escapeXml(text: string) {
  if (reXmlSpecial.test(text)) {
    return text.replace(reXmlSpecial, replaceUnsafeChar);
  }
  return text;
}

const transformURI = (uri: string) => {
  if (uri.startsWith('ipfs://')) {
    const hash = uri.split('://')[1];
    const SNAPSHOT_IPFS_BASE_URL = 'https://snapshot.4everland.link/ipfs';
    return `${SNAPSHOT_IPFS_BASE_URL}/${hash}`;
  }

  return uri;
};

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <Viewer
      key={content}
      initialValue={content}
      theme="dark"
      customHTMLRenderer={{
        link(node, { entering }) {
          if (entering) {
            const { title, destination } = node as any;

            return {
              type: 'openTag',
              tagName: 'a',
              attributes: {
                href: transformURI(escapeXml(destination)),
                ...(title && { title: escapeXml(title) }),
              },
            };
          }
          return { type: 'closeTag', tagName: 'a' };
        },
        image(node, context) {
          const { title, destination } = node as any;
          const { getChildrenText, skipChildren } = context;

          skipChildren();

          return {
            type: 'openTag',
            tagName: 'img',
            selfClose: true,
            attributes: {
              src: transformURI(escapeXml(destination)),
              alt: getChildrenText(node),
              ...(title && { title: escapeXml(title) }),
            },
          };
        },
      }}
    />
  );
}
