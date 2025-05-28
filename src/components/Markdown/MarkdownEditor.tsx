import { Box } from '@chakra-ui/react';
import { Editor } from '@toast-ui/react-editor';
import { useRef, useState } from 'react';
import useIPFSClient, { GATEWAY_URL } from '../../providers/App/hooks/useIPFSClient';

interface MarkdownEditorProps {
  height: string;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export function MarkdownEditor({
  height,
  onChange,
  placeholder = '',
  initialValue = '',
}: MarkdownEditorProps) {
  const editorRef = useRef<Editor>(null);
  const [uploadedPercent, setUploadedPercent] = useState(0);
  const { add } = useIPFSClient();

  const editor = editorRef.current?.getInstance();
  // it can't be a empty string which cause a weird bug that value becomes something else.
  //   Workaround: set it to a string with a space.
  // check https://github.com/nhn/tui.editor/issues/3206
  const editorInitialValue = initialValue || ' ';

  return (
    <Box
      onDrop={async e => {
        e.preventDefault();

        // if md, set markdown
        const file = e.dataTransfer?.files[0];
        if (file && file.name.toLowerCase().endsWith('.md')) {
          const md = await file.text();
          editor?.setMarkdown(md);
        }

        // if pdf, upload to ipfs and insert link
        if (file && file.name.toLowerCase().endsWith('.pdf')) {
          add(file, setUploadedPercent).then(response =>
            editor?.exec('addLink', {
              linkText: file.name,
              linkUrl: `${GATEWAY_URL}/ipfs/${response.Hash}`,
            }),
          );
        }
      }}
    >
      <Box
        height="0.25rem"
        bgColor="color-blue-900"
        width={`${uploadedPercent}%`}
      />
      <Editor
        ref={editorRef}
        usageStatistics={false}
        placeholder={placeholder}
        initialValue={editorInitialValue}
        previewStyle="vertical"
        height={height}
        initialEditType="wysiwyg"
        useCommandShortcut={true}
        referenceDefinition={true}
        toolbarItems={[
          [
            'heading',
            'bold',
            'italic',
            'strike',
            'ul',
            'ol',
            'task',
            'indent',
            'outdent',
            'table',
            'image',
            'link',
            'code',
            'codeblock',
            'hr',
            'quote',
          ],
        ]}
        linkAttributes={{
          target: '_blank',
          rel: 'noopener noreferrer',
        }}
        onBeforeConvertWysiwygToMarkdown={(md: string) => {
          return md.replace(/\\(_)/g, '$1'); // Remove escaped underscores
        }}
        onChange={() => {
          if (onChange) onChange(editor?.getMarkdown() || '');
        }}
        hooks={{
          addImageBlobHook(blob, cb) {
            add(blob, setUploadedPercent).then(response =>
              cb(`${GATEWAY_URL}/ipfs/${response.Hash}`),
            );
          },
        }}
        theme="dark"
      />
    </Box>
  );
}
