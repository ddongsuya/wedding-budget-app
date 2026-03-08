import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PhotoReference, PhotoCategory, photoReferenceAPI, UpdatePhotoInput } from '@/api/photoReferences';

const CATEGORIES: PhotoCategory[] = [
  { id: 'outdoor', name: '야외', icon: '🌳' },
  { id: 'indoor', name: '실내', icon: '🏠' },
  { id: 'pose', name: '포즈', icon: '💃' },
  { id: 'props', name: '소품', icon: '🎀' },
  { id: 'dress', name: '드레스', icon: '👗' },
  { id: 'suit', name: '수트', icon: '🤵' },
  { id: 'makeup', name: '메이크업', icon: '💄' },
  { id: 'etc', name: '기타', icon: '📷' },
];

interface PhotoEditModalProps {
  photo: PhotoReference;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: PhotoReference) => void;
}

const PhotoEditModal: React.FC<PhotoEditModalProps> = ({ photo, isOpen, onClose, onUpdated }) => {
  const [title, setTitle] = useState(photo.title || '');
  const [memo, setMemo] = useState(photo.memo || '');
  const [category, setCategory] = useState(photo.category || 'etc');
  const [tags, setTags] = useState<string[]>(photo.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(photo.title || '');
      setMemo(photo.memo || '');
      setCategory(photo.category || 'etc');
      setTags(photo.tags || []);
      setTagInput('');
      setError('');
    }
  }, [isOpen, photo]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const data: UpdatePhotoInput = {
        title: title.trim() || undefined,
        memo: memo.trim() || undefined,
        category,
        tags: tags.length > 0 ? tags : undefined,
      };
      const response = await photoReferenceAPI.update(photo.id, data);
      onUpdated(response.data.data);
      onClose();
    } catch {
      setError('수정에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 pb-20 md:pb-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-full flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-stone-800">사진 수정</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={24} className="text-stone-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl">{error}</div>
          )}

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">카테고리</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-xl border-2 transition-all text-center ${
                    category === cat.id
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-lg md:text-xl">{cat.icon}</span>
                  <p className="text-xs mt-1">{cat.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 해변 실루엣 샷"
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">메모</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="이 사진에 대한 메모를 남겨보세요"
              rows={2}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">태그</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="태그 입력 후 Enter"
                className="flex-1 px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors text-sm"
              >
                추가
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-sm text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-rose-700">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-stone-200 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditModal;
