/**
 * 키보드 단축키 훅
 * 모달에서 Ctrl+S 저장, Esc 닫기 등 지원
 */

import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  onSave?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  onNew?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onSave,
  onClose,
  onDelete,
  onNew,
  enabled = true,
}: ShortcutConfig) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Ctrl/Cmd + S: 저장
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave?.();
    }

    // Escape: 닫기
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }

    // Ctrl/Cmd + Delete/Backspace: 삭제
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      onDelete?.();
    }

    // Ctrl/Cmd + N: 새로 만들기
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      onNew?.();
    }
  }, [enabled, onSave, onClose, onDelete, onNew]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
