import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Excalidraw Workspace UI Layout & Overlap Protection', async (t) => {
  await t.test('WorkspaceTopNav mounts TopPillToolbar centered with zero overlap', () => {
    const topNavCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/WorkspaceTopNav.tsx'),
      'utf8'
    );
    assert.ok(topNavCode.includes('import { TopPillToolbar }'), 'TopPillToolbar must be imported');
    assert.ok(
      topNavCode.includes('<TopPillToolbar editor={editor} />'),
      'TopPillToolbar must be rendered with editor prop'
    );
    assert.ok(
      topNavCode.includes('absolute left-1/2 -translate-x-1/2 top-0'),
      'TopPillToolbar must be positioned horizontally centered at top'
    );
  });

  await t.test('TopPillToolbar contains all 12 Excalidraw tools and helper caption', () => {
    const toolbarCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/canvas/TopPillToolbar.tsx'),
      'utf8'
    );
    const expectedTools = [
      'lock',
      'hand',
      'select',
      'rectangle',
      'diamond',
      'ellipse',
      'arrow',
      'line',
      'draw',
      'text',
      'eraser',
      'frame',
    ];
    for (const tool of expectedTools) {
      assert.ok(
        toolbarCode.includes(`id: '${tool}'`),
        `Tool ${tool} must be included in toolbar tools list`
      );
    }
    assert.ok(
      toolbarCode.includes('To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool'),
      'Helper caption must be present in TopPillToolbar'
    );
  });

  await t.test('WhiteboardCanvas sets all default TLDraw chrome to null', () => {
    const canvasCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/canvas/WhiteboardCanvas.tsx'),
      'utf8'
    );
    assert.ok(canvasCode.includes('PageMenu: null'), 'PageMenu must be set to null to avoid top-left overlap');
    assert.ok(canvasCode.includes('MainMenu: null'), 'MainMenu must be set to null');
    assert.ok(canvasCode.includes('Toolbar: null'), 'Default Toolbar must be set to null');
    assert.ok(canvasCode.includes('NavigationPanel: null'), 'NavigationPanel must be set to null');
    assert.ok(canvasCode.includes('QuickActions: null'), 'QuickActions must be set to null');
    assert.ok(canvasCode.includes('onEditorMount?.(mountedEditor)'), 'handleMount must notify onEditorMount');
  });

  await t.test('CSS rules strictly enforce zero TLDraw chrome visibility in index.css', () => {
    const cssCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/index.css'),
      'utf8'
    );
    assert.ok(cssCode.includes('.tlui-page-menu'), 'CSS must target .tlui-page-menu');
    assert.ok(cssCode.includes('.tlui-top-left-zone'), 'CSS must target .tlui-top-left-zone');
    assert.ok(cssCode.includes('.tlui-page-menu__trigger'), 'CSS must target .tlui-page-menu__trigger');
    assert.ok(cssCode.includes('[data-testid="main.page-menu"]'), 'CSS must target [data-testid="main.page-menu"]');
    assert.ok(cssCode.includes('display: none !important'), 'CSS must enforce display: none !important');
  });

  await t.test('App.tsx shares editor state between WhiteboardCanvas and WorkspaceTopNav', () => {
    const appCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/App.tsx'),
      'utf8'
    );
    assert.ok(appCode.includes('const [editor, setEditor] = useState<Editor | null>(null);'));
    assert.ok(appCode.includes('editor={editor}'));
    assert.ok(appCode.includes('onEditorMount={setEditor}'));
  });
});
