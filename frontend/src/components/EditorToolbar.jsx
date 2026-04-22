export default function EditorToolbar({ editor }) {
  if (!editor) return null;

  const btn = (label, action, isActive, title) => (
    <button
      key={label}
      onClick={action}
      title={title || label}
      style={{
        ...s.btn,
        background: isActive ? 'var(--paper-warm)' : 'transparent',
        color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
        borderColor: isActive ? 'var(--border)' : 'transparent',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--paper-warm)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {label}
    </button>
  );

  const divider = (key) => <div key={key} style={s.divider} />;

  return (
    <div style={s.toolbar}>
      {/* Text style dropdown */}
      <select
        value={
          editor.isActive('heading', { level: 1 }) ? 'h1' :
          editor.isActive('heading', { level: 2 }) ? 'h2' :
          editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
        }
        onChange={e => {
          const val = e.target.value;
          if (val === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: parseInt(val[1]) }).run();
        }}
        style={s.select}
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      {divider('d1')}

      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'Bold (Ctrl+B)')}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'Italic (Ctrl+I)')}
      {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'Underline (Ctrl+U)')}

      {divider('d2')}

      {btn('≡', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), 'Bullet list')}
      {btn('①', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), 'Numbered list')}

      {divider('d3')}

      {btn('↩', () => editor.chain().focus().undo().run(), false, 'Undo (Ctrl+Z)')}
      {btn('↪', () => editor.chain().focus().redo().run(), false, 'Redo (Ctrl+Y)')}
    </div>
  );
}

const s = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '6px 12px',
    borderBottom: '1px solid var(--border-soft)',
    background: 'var(--paper-card)',
    flexWrap: 'wrap',
  },
  btn: {
    padding: '5px 9px',
    borderRadius: 6,
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
    transition: 'all 120ms',
    minWidth: 28,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    background: 'var(--border)',
    margin: '0 4px',
    flexShrink: 0,
  },
  select: {
    padding: '5px 8px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    color: 'var(--ink)',
    background: 'var(--paper-card)',
    outline: 'none',
    cursor: 'pointer',
  },
};
