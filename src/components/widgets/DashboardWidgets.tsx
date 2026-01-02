import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, X, Plus, Settings, Heart, Wallet, CheckSquare, Calendar, CreditCard, Building2 } from 'lucide-react';

type WidgetType = 'dday' | 'budget' | 'checklist' | 'schedule' | 'expense' | 'venue';

interface Widget {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
}

const WIDGET_CONFIGS: Record<WidgetType, { title: string; icon: React.ReactNode; emoji: string }> = {
  dday: { title: 'D-day', icon: <Heart className="w-5 h-5" />, emoji: '💒' },
  budget: { title: '예산 현황', icon: <Wallet className="w-5 h-5" />, emoji: '💰' },
  checklist: { title: '체크리스트', icon: <CheckSquare className="w-5 h-5" />, emoji: '✅' },
  schedule: { title: '다가오는 일정', icon: <Calendar className="w-5 h-5" />, emoji: '📅' },
  expense: { title: '최근 지출', icon: <CreditCard className="w-5 h-5" />, emoji: '💳' },
  venue: { title: '관심 식장', icon: <Building2 className="w-5 h-5" />, emoji: '🏛️' },
};

interface CustomizableDashboardProps {
  initialWidgets?: Widget[];
  onWidgetsChange?: (widgets: Widget[]) => void;
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ 
  initialWidgets,
  onWidgetsChange 
}) => {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets || [
    { id: '1', type: 'dday', size: 'medium' },
    { id: '2', type: 'budget', size: 'large' },
    { id: '3', type: 'checklist', size: 'medium' },
    { id: '4', type: 'schedule', size: 'medium' },
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  const handleRemoveWidget = (id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    setWidgets(newWidgets);
    onWidgetsChange?.(newWidgets);
  };

  const handleAddWidget = (type: WidgetType) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      size: 'medium',
    };
    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    onWidgetsChange?.(newWidgets);
    setShowAddWidget(false);
  };

  const handleReorder = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    onWidgetsChange?.(newWidgets);
  };

  return (
    <div className="space-y-4">
      {/* 편집 모드 토글 */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1
            ${isEditMode 
              ? 'bg-rose-500 text-white' 
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }
          `}
        >
          <Settings className="w-4 h-4" />
          {isEditMode ? '완료' : '편집'}
        </button>
      </div>

      {/* 위젯 그리드 */}
      <Reorder.Group
        axis="y"
        values={widgets}
        onReorder={handleReorder}
        className="space-y-4"
      >
        {widgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            disabled={!isEditMode}
            className={`
              bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden
              ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}
            `}
          >
            <div className="relative">
              {isEditMode && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-stone-400" />
                    <span className="font-medium text-stone-700">
                      {WIDGET_CONFIGS[widget.type].emoji} {WIDGET_CONFIGS[widget.type].title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="p-2 rounded-full hover:bg-red-100 text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="p-4">
                <WidgetContent type={widget.type} />
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* 위젯 추가 버튼 */}
      {isEditMode && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowAddWidget(true)}
          className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          위젯 추가
        </motion.button>
      )}

      {/* 위젯 추가 모달 */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6"
          >
            <h3 className="text-lg font-bold text-stone-800 mb-4">위젯 추가</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(WIDGET_CONFIGS).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => handleAddWidget(type as WidgetType)}
                  className="p-4 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
                >
                  <span className="text-2xl mb-2 block">{config.emoji}</span>
                  <span className="font-medium text-stone-700">{config.title}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddWidget(false)}
              className="w-full mt-4 py-3 text-stone-500 font-medium"
            >
              취소
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// 각 위젯 타입별 콘텐츠 렌더링
const WidgetContent: React.FC<{ type: WidgetType }> = ({ type }) => {
  switch (type) {
    case 'dday':
      return <DDayWidget />;
    case 'budget':
      return <BudgetWidget />;
    case 'checklist':
      return <ChecklistWidget />;
    case 'schedule':
      return <ScheduleWidget />;
    case 'expense':
      return <ExpenseWidget />;
    case 'venue':
      return <VenueWidget />;
    default:
      return null;
  }
};

// 개별 위젯 컴포넌트들
const DDayWidget = () => (
  <div className="text-center py-4">
    <p className="text-sm text-stone-500 mb-1">결혼까지</p>
    <p className="text-4xl font-bold text-rose-500">D-281</p>
  </div>
);

const BudgetWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
      <Wallet className="w-4 h-4 text-amber-500" />
      예산 현황
    </h4>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-stone-500">사용</span>
        <span className="font-medium">2,500만원 / 5,000만원</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-amber-500 rounded-full" />
      </div>
    </div>
  </div>
);

const ChecklistWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
      <CheckSquare className="w-4 h-4 text-emerald-500" />
      체크리스트
    </h4>
    <div className="flex items-center justify-between">
      <span className="text-stone-500 text-sm">완료</span>
      <span className="text-2xl font-bold text-emerald-500">12/38</span>
    </div>
  </div>
);

const ScheduleWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
      <Calendar className="w-4 h-4 text-blue-500" />
      다가오는 일정
    </h4>
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
          15
        </div>
        <div>
          <p className="font-medium text-stone-800 text-sm">웨딩홀 투어</p>
          <p className="text-xs text-stone-500">오후 2:00</p>
        </div>
      </div>
    </div>
  </div>
);

const ExpenseWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
      <CreditCard className="w-4 h-4 text-purple-500" />
      최근 지출
    </h4>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-stone-600">웨딩드레스 계약금</span>
        <span className="font-medium text-stone-800">500,000원</span>
      </div>
    </div>
  </div>
);

const VenueWidget = () => (
  <div>
    <h4 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
      <Building2 className="w-4 h-4 text-rose-500" />
      관심 식장
    </h4>
    <p className="text-sm text-stone-500">저장된 식장 3곳</p>
  </div>
);

export default CustomizableDashboard;
