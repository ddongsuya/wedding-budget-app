import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Edit2, Trash2, X, Search, Calendar as CalendarIcon } from 'lucide-react';
import { eventAPI } from '@/api/events';
import { CalendarEvent, EVENT_CATEGORIES, EventCategory, EventFormData } from '@/types/event';
import { useToast } from '@/hooks/useToast';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ScheduleSkeleton } from '@/components/skeleton/ScheduleSkeleton';
import { WeekView } from '../components/schedule/WeekView';
import { checklistAPI } from '@/api/checklist';
import { ChecklistItem } from '@/types/checklist';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import DatePicker from '@/components/common/DatePicker/DatePicker';
import { useKeyboardAvoid } from '@/hooks/useKeyboardAvoid';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { PageTip } from '@/components/common/PageTip/PageTip';

const Schedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [deletingEventId, setDeletingEventId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleEventCount, setVisibleEventCount] = useState(20);
  const { toast } = useToast();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 월별 이벤트 로드
  useEffect(() => {
    loadEvents();
  }, [year, month]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await eventAPI.getEventsByMonth(year, month);
      setEvents(response.data.data);
    } catch (error) {
      toast.error((error as any)?.userMessage || '일정을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 이전/다음 월 이동
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // 주간 뷰 네비게이션
  const handleWeekChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  // 일정 추가 모달 열기
  const openAddEventModal = (date?: Date) => {
    setEditingEvent(null);
    if (date) setSelectedDate(date);
    setShowEventModal(true);
  };

  // 일정 수정 모달 열기
  const openEditEventModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  // 일정 삭제
  const handleDeleteEvent = async (eventId: string | number) => {
    setDeletingEventId(eventId);
  };

  const confirmDeleteEvent = async () => {
    if (deletingEventId === null) return;
    try {
      await eventAPI.deleteEvent(deletingEventId.toString());
      toast.success('일정이 삭제되었습니다');
      loadEvents();
    } catch (error) {
      toast.error((error as any)?.userMessage || '삭제에 실패했습니다');
    }
    setDeletingEventId(null);
  };

  // 일정 저장 (추가/수정)
  const handleSaveEvent = async (eventData: any) => {
    try {
      if (editingEvent) {
        await eventAPI.updateEvent(editingEvent.id.toString(), eventData);
        toast.success('일정이 수정되었습니다');
      } else {
        await eventAPI.createEvent(eventData as EventFormData);
        toast.success('일정이 추가되었습니다');
      }
      setShowEventModal(false);
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      toast.error((error as any)?.userMessage || (editingEvent ? '수정에 실패했습니다' : '추가에 실패했습니다'));
    }
  };

  // 캘린더 날짜 배열 생성
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // 시작 요일 맞추기 (일요일 = 0)
    const startDay = start.getDay();
    const prefixDays = Array(startDay).fill(null);

    return [...prefixDays, ...days];
  }, [currentDate]);

  // 검색 필터링
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter((event) => {
      const titleMatch = event.title.toLowerCase().includes(query);
      const categoryInfo = event.category ? EVENT_CATEGORIES[event.category] : null;
      const categoryMatch = categoryInfo ? categoryInfo.label.toLowerCase().includes(query) : false;
      return titleMatch || categoryMatch;
    });
  }, [events, searchQuery]);

  // 날짜별 이벤트 매핑
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(event => {
      // API에서 오는 날짜 형식을 yyyy-MM-dd로 정규화
      const eventDate = new Date(event.start_date);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    return map;
  }, [filteredEvents]);

  // 선택된 날짜의 이벤트
  const selectedDateEvents = selectedDate
    ? eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  // 무한 스크롤: 이벤트 목록 페이지네이션 (Requirements 10.2)
  const visibleEvents = filteredEvents.slice(0, visibleEventCount);
  const hasMoreEvents = visibleEventCount < filteredEvents.length;

  const eventSentinelRef = useInfiniteScroll({
    onLoadMore: () => setVisibleEventCount(prev => prev + 20),
    hasMore: hasMoreEvents,
    isLoading: false,
  });

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      <PageTip pageKey="schedule" />
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-lg px-4 py-4 shadow-soft sticky top-[60px] md:top-0 z-10 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          {viewMode === 'month' ? (
            <>
              <button
                onClick={goToPrevMonth}
                className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors touch-feedback"
              >
                <ChevronLeft size={22} className="text-stone-600" />
              </button>
              
              <div className="text-center">
                <h1 className="text-xl font-bold text-stone-800">
                  {format(currentDate, 'yyyy년 M월', { locale: ko })}
                </h1>
                <button
                  onClick={goToToday}
                  className="text-sm text-rose-500 font-medium hover:text-rose-600 transition-colors"
                >
                  오늘
                </button>
              </div>
              
              <button
                onClick={goToNextMonth}
                className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors touch-feedback"
              >
                <ChevronRight size={22} className="text-stone-600" />
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-stone-800">일정</h1>
              <button
                onClick={goToToday}
                className="text-sm text-rose-500 font-medium hover:text-rose-600 transition-colors"
              >
                오늘
              </button>
            </>
          )}
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-rose-500 text-white shadow-button'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-rose-500 text-white shadow-button'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            월간
          </button>
        </div>

        {/* 일정 추가 버튼 */}
        <button
          onClick={() => openAddEventModal()}
          className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-xl font-semibold shadow-button hover:shadow-button-hover hover:from-rose-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Plus size={20} />
          일정 추가
        </button>

        {/* 검색 입력 필드 */}
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="일정 검색 (제목, 카테고리)..."
            className="w-full pl-9 pr-9 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-stone-200 rounded-full transition-colors"
              aria-label="검색어 초기화"
            >
              <X size={14} className="text-stone-500" />
            </button>
          )}
        </div>

        {/* 요일 헤더 - 월간 뷰에서만 */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 text-center text-sm mt-4">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div
                key={day}
                className={`py-2 font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-stone-500'}`}
              >
                {day}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 주간 뷰 */}
      {viewMode === 'week' && (
        <div className="mx-4 mt-4">
          <WeekView
            currentDate={currentDate}
            events={events}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onWeekChange={handleWeekChange}
          />
        </div>
      )}

      {/* 월간 캘린더 그리드 */}
      {viewMode === 'month' && (
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-card overflow-hidden border border-stone-100">
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-20 border-b border-r border-stone-100/80" />;
            }

            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const dayOfWeek = day.getDay();

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(day)}
                className={`h-20 p-1 border-b border-r border-stone-100/80 flex flex-col items-center transition-all touch-feedback
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'bg-rose-50/80' : 'hover:bg-stone-50'}
                `}
              >
                {/* 날짜 숫자 */}
                <span className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                  ${isTodayDate ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm' : ''}
                  ${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-stone-700'}
                `}>
                  {format(day, 'd')}
                </span>

                {/* 이벤트 도트 */}
                <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="w-1.5 h-1.5 rounded-full shadow-sm"
                      style={{ backgroundColor: event.color }}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-stone-400">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* 선택된 날짜의 이벤트 목록 */}
      {selectedDate && (
        <div className="mx-4 mt-4">
          <h2 className="text-lg font-bold text-stone-800 mb-3">
            {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })}
          </h2>

          {selectedDateEvents.length === 0 ? (
            <EmptyState
              illustration="calendar"
              title="이 날의 일정이 없어요"
              description="새로운 일정을 추가해서 결혼 준비를 계획해보세요"
              actionLabel="일정 추가하기"
              onAction={() => openAddEventModal(selectedDate)}
              className="bg-white rounded-2xl shadow-card border border-stone-100"
            />
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map((event, index) => {
                const categoryInfo = event.category ? EVENT_CATEGORIES[event.category] : null;

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl p-4 shadow-card border border-stone-100 flex items-start gap-3 hover:shadow-card-hover transition-all stagger-item touch-feedback active:scale-[0.99]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* 카테고리 아이콘 */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: event.color + '15' }}
                    >
                      <span className="text-lg">{categoryInfo?.icon || '📅'}</span>
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-800 truncate">{event.title}</h3>

                      <div className="flex flex-wrap gap-2 mt-1.5 text-sm text-stone-500">
                        {/* 시간 */}
                        {event.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-stone-400" />
                            {event.start_time.slice(0, 5)}
                            {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                          </span>
                        )}

                        {/* 위치 */}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-stone-400" />
                            <span className="truncate max-w-[150px]">{event.location}</span>
                          </span>
                        )}
                      </div>

                      {/* 카테고리 태그 */}
                      {categoryInfo && (
                        <span
                          className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: event.color + '15',
                            color: event.color
                          }}
                        >
                          {categoryInfo.label}
                        </span>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditEventModal(event)}
                        className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
                      >
                        <Edit2 size={16} className="text-stone-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 다가오는 일정 (날짜 미선택 시) */}
      {!selectedDate && filteredEvents.length === 0 && (
        <div className="mx-4 mt-4">
          <EmptyState
            illustration="calendar"
            title={searchQuery ? '검색 결과가 없어요' : '등록된 일정이 없어요'}
            description={searchQuery ? '다른 검색어로 시도해보세요' : '식장 방문, 피팅 등 일정을 추가해보세요'}
            actionLabel={searchQuery ? undefined : '일정 추가하기'}
            onAction={searchQuery ? undefined : () => openAddEventModal()}
          />
        </div>
      )}

      {!selectedDate && filteredEvents.length > 0 && (
        <UpcomingEvents 
          events={filteredEvents} 
          onEventClick={(event) => setSelectedDate(new Date(event.start_date))}
          onEditEvent={openEditEventModal}
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      {/* 일정 추가/수정 모달 */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          selectedDate={selectedDate}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
        />
      )}

      {/* 일정 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={deletingEventId !== null}
        onClose={() => setDeletingEventId(null)}
        onConfirm={confirmDeleteEvent}
        title="일정 삭제"
        message="이 일정을 삭제하시겠습니까?"
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </div>
  );
};

// 다가오는 일정 컴포넌트
interface UpcomingEventsProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string | number) => void;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events, onEventClick, onEditEvent, onDeleteEvent }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingEvents = events
    .filter(e => new Date(e.start_date) >= today)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5);

  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  if (upcomingEvents.length === 0) return null;

  return (
    <div className="mx-4 mt-4">
      <h2 className="text-lg font-bold text-stone-800 mb-3">다가오는 일정</h2>
      <div className="space-y-2">
        {upcomingEvents.map((event) => {
          const categoryInfo = event.category ? EVENT_CATEGORIES[event.category] : null;
          const isExpanded = expandedId === event.id;

          return (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden transition-all"
            >
              {/* 기본 정보 (클릭 가능) */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-stone-50 transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: event.color + '20' }}
                >
                  <span>{categoryInfo?.icon || '📅'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-stone-800 truncate">{event.title}</h3>
                  <p className="text-sm text-stone-500">
                    {format(new Date(event.start_date), 'M월 d일 (EEE)', { locale: ko })}
                    {event.start_time && ` ${event.start_time.slice(0, 5)}`}
                  </p>
                </div>
                <ChevronRight 
                  size={20} 
                  className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                />
              </button>

              {/* 상세 정보 (펼쳐졌을 때) */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-stone-100 animate-fade-in">
                  <div className="space-y-2 mt-3">
                    {/* 시간 */}
                    {event.start_time && (
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Clock size={14} className="text-stone-400" />
                        <span>
                          {event.start_time.slice(0, 5)}
                          {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                        </span>
                      </div>
                    )}

                    {/* 위치 */}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <MapPin size={14} className="text-stone-400" />
                        <span className="truncate">{event.location}</span>
                        {event.location_url && (
                          <a
                            href={event.location_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-500 hover:text-rose-600 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            지도 보기
                          </a>
                        )}
                      </div>
                    )}

                    {/* 메모 */}
                    {event.description && (
                      <p className="text-sm text-stone-500 bg-stone-50 p-2 rounded-lg">
                        {event.description}
                      </p>
                    )}

                    {/* 카테고리 태그 */}
                    {categoryInfo && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: event.color + '20',
                          color: event.color
                        }}
                      >
                        {categoryInfo.label}
                      </span>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                      className="flex-1 py-2 px-3 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 size={14} />
                      수정
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                      className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 일정 추가/수정 모달
interface EventModalProps {
  event: CalendarEvent | null;
  selectedDate: Date | null;
  onClose: () => void;
  onSave: (data: Partial<CalendarEvent>) => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, selectedDate, onClose, onSave }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  useKeyboardAvoid(modalRef);
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_date: event?.start_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
    start_time: event?.start_time || '',
    end_date: event?.end_date || '',
    end_time: event?.end_time || '',
    is_all_day: event?.is_all_day || false,
    category: event?.category || 'venue_visit' as EventCategory,
    location: event?.location || '',
    location_url: event?.location_url || '',
    reminder_minutes: event?.reminder_minutes || 30,
    linked_checklist_id: event?.linked_checklist_id || '',
  });
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [titleError, setTitleError] = useState('');

  // 체크리스트 항목 로드
  useEffect(() => {
    checklistAPI.getItems()
      .then((res) => setChecklistItems(res.data.data || []))
      .catch(() => { /* 로드 실패 시 무시 */ });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setTitleError('제목을 입력해주세요');
      return;
    }
    setTitleError('');

    const categoryInfo = EVENT_CATEGORIES[formData.category];
    
    onSave({
      ...formData,
      linked_checklist_id: formData.linked_checklist_id || undefined,
      color: categoryInfo.color,
      icon: categoryInfo.icon,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'title') setTitleError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-20 md:pb-4">
      <div ref={modalRef} className="bg-white rounded-2xl w-full max-w-lg max-h-full flex flex-col">
        {/* 헤더 */}
        <div className="flex-shrink-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-stone-800">
            {event ? '일정 수정' : '일정 추가'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={24} className="text-stone-600" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="예: 웨딩홀 방문"
              className={`w-full px-4 py-2.5 border ${titleError ? 'border-red-400 focus:ring-red-500' : 'border-stone-300 focus:ring-rose-500'} rounded-xl focus:ring-2 focus:border-transparent`}
              required
            />
            {titleError && <p className="text-red-500 text-xs mt-1">{titleError}</p>}
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              카테고리
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EVENT_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChange('category', key)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    formData.category === key
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                시작 날짜 *
              </label>
              <DatePicker
                value={formData.start_date}
                onChange={(date) => handleChange('start_date', date)}
                placeholder="시작 날짜 선택"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                종료 날짜
              </label>
              <DatePicker
                value={formData.end_date}
                onChange={(date) => handleChange('end_date', date)}
                placeholder="종료 날짜 선택"
              />
            </div>
          </div>

          {/* 종일 체크박스 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_all_day"
              checked={formData.is_all_day}
              onChange={(e) => handleChange('is_all_day', e.target.checked)}
              className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500"
            />
            <label htmlFor="is_all_day" className="text-sm text-stone-700">
              종일
            </label>
          </div>

          {/* 시간 (종일이 아닐 때만) */}
          {!formData.is_all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* 위치 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              위치
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="예: 서울 강남구 테헤란로 123"
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* 위치 URL */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              위치 링크 (지도)
            </label>
            <input
              type="url"
              value={formData.location_url}
              onChange={(e) => handleChange('location_url', e.target.value)}
              placeholder="https://map.naver.com/..."
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              메모
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="일정에 대한 메모를 입력하세요"
              rows={3}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 체크리스트 항목 연결 */}
          {checklistItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                연결할 체크리스트 항목
              </label>
              <select
                value={formData.linked_checklist_id}
                onChange={(e) => handleChange('linked_checklist_id', e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">선택 안함</option>
                {checklistItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.category_icon ? `${item.category_icon} ` : ''}{item.title}
                    {item.is_completed ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 알림 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              알림
            </label>
            <select
              value={formData.reminder_minutes}
              onChange={(e) => handleChange('reminder_minutes', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value={0}>알림 없음</option>
              <option value={10}>10분 전</option>
              <option value={30}>30분 전</option>
              <option value={60}>1시간 전</option>
              <option value={1440}>1일 전</option>
              <option value={2880}>2일 전</option>
              <option value={10080}>1주일 전</option>
            </select>
          </div>

        </form>

        {/* 버튼 - 하단 고정 */}
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-stone-200 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
          >
            {event ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
