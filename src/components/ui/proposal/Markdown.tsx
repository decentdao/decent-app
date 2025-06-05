import { Button, Box } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../assets/css/Markdown.css';
import { getRandomBytes } from '../../../helpers';
import useSkipTab from '../../../hooks/utils/useSkipTab';
import { MarkdownViewer } from '../../Markdown/MarkdownViewer';

interface IMarkdown {
  truncate?: boolean;
  collapsedLines?: number;
  hideCollapsed?: boolean;
  content: string;
}

interface IMarkdownContent {
  children: React.ReactNode;
  collapsed: boolean;
  truncate: boolean | undefined;
  collapsedLines: number;
  markdownTextContainerRef: React.RefObject<HTMLParagraphElement>;
}

function MarkdowContentWithoutTabs({
  children,
  collapsed,
  truncate,
  collapsedLines,
  markdownTextContainerRef,
}: IMarkdownContent) {
  const markdownId = getRandomBytes().toString();
  useSkipTab(markdownId);

  return (
    <Box
      id={markdownId}
      noOfLines={collapsed || truncate ? collapsedLines : undefined}
      ref={markdownTextContainerRef}
      maxWidth="100%"
      width="100%"
    >
      {children}
    </Box>
  );
}

function MarkdowContentWithTabs({
  children,
  collapsed,
  truncate,
  collapsedLines,
  markdownTextContainerRef,
}: IMarkdownContent) {
  return (
    <Box
      noOfLines={collapsed || truncate ? collapsedLines : undefined}
      ref={markdownTextContainerRef}
      maxWidth="100%"
      width="100%"
    >
      {children}
    </Box>
  );
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

  const innerContent = (!hideCollapsed || !collapsed) && <MarkdownViewer content={content} />;

  return (
    <>
      {collapsed ? (
        <MarkdowContentWithoutTabs
          collapsed={true}
          truncate={truncate}
          collapsedLines={collapsedLines}
          markdownTextContainerRef={markdownTextContainerRef}
        >
          {innerContent}
        </MarkdowContentWithoutTabs>
      ) : (
        <MarkdowContentWithTabs
          collapsed={false}
          truncate={truncate}
          collapsedLines={collapsedLines}
          markdownTextContainerRef={markdownTextContainerRef}
        >
          {innerContent}
        </MarkdowContentWithTabs>
      )}

      {((hideCollapsed && content) ||
        (totalLines > collapsedLines && !totalLinesError && !truncate)) && (
        <Button
          variant="text"
          color="color-green-400"
          padding="0.25rem 0.75rem"
          gap="0.25rem"
          borderRadius="625rem"
          borderColor="transparent"
          borderWidth="1px"
          _hover={{ bg: 'color-green-950', borderColor: 'color-green-950' }}
          _active={{ bg: 'color-green-950', borderWidth: '1px', borderColor: 'color-green-800' }}
          onClick={handleToggleCollapse}
        >
          {t(collapsed ? 'showMore' : 'showLess')}
        </Button>
      )}
    </>
  );
}
