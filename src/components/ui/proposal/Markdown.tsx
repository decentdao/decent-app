import { Button, Image, Box } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../../../assets/css/Markdown.css';

function CustomMarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt || ''}
      onError={() => setError(true)}
    />
  );
}

const MarkdownComponents: Components = {
  img: image => {
    return (
      <CustomMarkdownImage
        src={image.src}
        alt={image.alt || ''}
      />
    );
  },
};

interface IMarkdown {
  truncate?: boolean;
  collapsedLines?: number;
  hideCollapsed?: boolean;
  content: string;
}

export default function Markdown({
  truncate,
  content,
  collapsedLines = 6,
  hideCollapsed = false,
}: IMarkdown) {
  const { t } = useTranslation('common');
  const [collapsed, setCollapsed] = useState(true);
  const [totalLines, setTotalLines] = useState(0);
  const [totalLinesError, setTotalLinesError] = useState(false);
  const markdownTextContainerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (
      markdownTextContainerRef &&
      markdownTextContainerRef.current &&
      document &&
      document.defaultView
    ) {
      const divHeight = markdownTextContainerRef.current.scrollHeight;
      const lineHeight = parseInt(
        document.defaultView.getComputedStyle(markdownTextContainerRef.current, null).lineHeight,
      );
      if (isNaN(lineHeight)) {
        setCollapsed(false);
        setTotalLinesError(true);
      } else {
        const lines = divHeight / lineHeight;
        setTotalLines(lines);
        setTotalLinesError(false);
      }
    }
  }, [content]);

  const handleToggleCollapse = () => {
    setCollapsed(prevState => !prevState);
  };

  const handleTransformURI = (uri: string) => {
    if (uri.startsWith('ipfs://')) {
      const hash = uri.split('://')[1];
      const SNAPSHOT_IPFS_BASE_URL = 'https://snapshot.4everland.link/ipfs';
      return `${SNAPSHOT_IPFS_BASE_URL}/${hash}`;
    }

    return uri;
  };

  return (
    <>
      <Box
        noOfLines={collapsed || truncate ? collapsedLines : undefined}
        ref={markdownTextContainerRef}
        maxWidth="100%"
        width="100%"
      >
        {(!hideCollapsed || !collapsed) && (
          <ReactMarkdown
            remarkPlugins={truncate ? [] : [remarkGfm]}
            urlTransform={handleTransformURI}
            components={MarkdownComponents}
            className="markdown-body"
          >
            {content}
          </ReactMarkdown>
        )}
      </Box>

      {((hideCollapsed && content) ||
        (totalLines > collapsedLines && !totalLinesError && !truncate)) && (
        <Button
          variant="text"
          color="celery-0"
          padding="0.25rem 0.75rem"
          gap="0.25rem"
          borderRadius="625rem"
          borderColor="transparent"
          borderWidth="1px"
          _hover={{ bg: 'celery--6', borderColor: 'celery--6' }}
          _active={{ bg: 'celery--6', borderWidth: '1px', borderColor: 'celery--5' }}
          onClick={handleToggleCollapse}
        >
          {t(collapsed ? 'showMore' : 'showLess')}
        </Button>
      )}
    </>
  );
}
