// 파일 위치: src/domains/report/hooks/useSlashMenu.js
import { useState, useEffect } from 'react';

export function useSlashMenu(quillRef, setContent) {
  const [slashMenu, setSlashMenu] = useState({ visible: false, top: 0, left: 0, index: null });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (slashMenu.visible && !event.target.closest('.slash-menu')) {
        setSlashMenu({ visible: false, top: 0, left: 0, index: null });
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && slashMenu.visible) {
        setSlashMenu({ visible: false, top: 0, left: 0, index: null });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [slashMenu.visible]);

  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    
    quill.keyboard.addBinding({ key: '/', shiftKey: false }, function(range) {
      const bounds = quill.getBounds(range.index);
      setSlashMenu({ visible: true, top: bounds.bottom + 10, left: bounds.left, index: range.index + 1 });
      return true; 
    });
  }, [quillRef]);

  const insertSlashCommand = (type) => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    quill.deleteText(slashMenu.index - 1, 1); 
    
    let html = "";
    if (type === "table") {
      html = `<table style="width: 100%; border-collapse: collapse;" border="1"><tbody><tr><td style="padding: 8px; background-color: #f1f5f9;"><strong>구분</strong></td><td style="padding: 8px; background-color: #f1f5f9;"><strong>목표</strong></td><td style="padding: 8px; background-color: #f1f5f9;"><strong>실적</strong></td></tr><tr><td style="padding: 8px;"><br></td><td style="padding: 8px;"><br></td><td style="padding: 8px;"><br></td></tr></tbody></table><p><br></p>`;
    } else if (type === "quote") {
      html = `<blockquote style="border-left: 4px solid #166534; padding-left: 14px; margin: 10px 0; color: #475569; background-color: #f0fdf4; padding: 12px; border-radius: 4px;">여기에 핵심 요약문을 작성하세요.</blockquote><p><br></p>`;
    } else if (type === "sign") {
      html = `<p style="text-align: right;"><strong>작성자:</strong> ____________ (인)&nbsp;&nbsp;&nbsp;&nbsp;<strong>승인자:</strong> ____________ (인)</p><p><br></p>`;
    }

    quill.clipboard.dangerouslyPasteHTML(slashMenu.index - 1, html);
    setSlashMenu({ visible: false, top: 0, left: 0, index: null });
    setContent(quill.root.innerHTML);
  };

  return { slashMenu, insertSlashCommand };
}