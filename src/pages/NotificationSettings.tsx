import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Calendar, ListChecks, DollarSign, Heart, Megaphone, Clock, BellRing, Send } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useToastContext } from '../contexts/ToastContext';
import { subscribeToPush, unsubscribeFromPush } from '../api/push';
import { notificationAPI } from '../api/notifications';

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { preferences, fetchPreferences, updatePreferences } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [sendingTest, setSendingTest] = useState(false);

  // 테스트 알림 전송
  const sendTestNotification = async () => {
    try {
      setSendingTest(true);
      await notificationAPI.createTestNotification({
        title: '테스트 알림 🔔',
        message: '알림 기능이 정상적으로 작동합니다! 이 알림은 테스트용입니다.',
      });
      showToast('success', '테스트 알림이 전송되었습니다. 알림 센터를 확인해보세요!');
    } catch (error) {
      showToast('error', '테스트 알림 전송에 실패했습니다');
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchPreferences();
      setIsLoading(false);
    };
    loadData();

    // 푸시 권한 상태 확인
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, [fetchPreferences]);

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      showToast('success', '알림 설정이 변경되었습니다');
    } catch (error) {
      showToast('error', '설정 변경에 실패했습니다');
    }
  };

  const handleTimeChange = async (time: string) => {
    try {
      await updatePreferences({ preferred_time: time });
      showToast('success', '알림 시간이 변경되었습니다');
    } catch (error) {
      showToast('error', '설정 변경에 실패했습니다');
    }
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        if (permission === 'granted') {
          // 푸시 구독 등록
          await subscribeToPush();
          showToast('success', '푸시 알림이 활성화되었습니다');
          await updatePreferences({ push_enabled: true });
        } else if (permission === 'denied') {
          showToast('error', '푸시 알림이 차단되었습니다. 브라우저 설정에서 허용해주세요.');
        }
      } catch (error: any) {
        console.error('Push permission error:', error);
        showToast('error', error.message || '푸시 알림 등록에 실패했습니다');
      }
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await subscribeToPush();
        await updatePreferences({ push_enabled: true });
        showToast('success', '푸시 알림이 활성화되었습니다');
      } else {
        await unsubscribeFromPush();
        await updatePreferences({ push_enabled: false });
        showToast('success', '푸시 알림이 비활성화되었습니다');
      }
    } catch (error: any) {
      console.error('Push toggle error:', error);
      showToast('error', error.message || '설정 변경에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    );
  }

  const settingGroups = [
    {
      title: 'D-Day 알림',
      icon: <Calendar size={20} className="text-rose-500" />,
      items: [
        { key: 'dday_enabled', label: 'D-Day 마일스톤 알림', description: 'D-100, D-30, D-7, D-1 알림', value: preferences?.dday_enabled },
        { key: 'dday_daily', label: '매일 D-Day 알림', description: '매일 결혼식까지 남은 일수 알림', value: preferences?.dday_daily },
      ],
    },
    {
      title: '일정 알림',
      icon: <Calendar size={20} className="text-blue-500" />,
      items: [
        { key: 'schedule_enabled', label: '일정 리마인더', description: '예약된 일정 전 미리 알림', value: preferences?.schedule_enabled },
      ],
    },
    {
      title: '체크리스트 알림',
      icon: <ListChecks size={20} className="text-orange-500" />,
      items: [
        { key: 'checklist_enabled', label: '체크리스트 마감 알림', description: '마감일 임박 및 초과 알림', value: preferences?.checklist_enabled },
      ],
    },
    {
      title: '예산 알림',
      icon: <DollarSign size={20} className="text-yellow-500" />,
      items: [
        { key: 'budget_enabled', label: '예산 경고 알림', description: '예산 80%, 100% 도달 시 알림', value: preferences?.budget_enabled },
      ],
    },
    {
      title: '커플 활동 알림',
      icon: <Heart size={20} className="text-pink-500" />,
      items: [
        { key: 'couple_enabled', label: '파트너 활동 알림', description: '파트너가 정보를 수정할 때 알림', value: preferences?.couple_enabled },
      ],
    },
    {
      title: '공지사항',
      icon: <Megaphone size={20} className="text-purple-500" />,
      items: [
        { key: 'announcement_enabled', label: '공지사항 알림', description: '서비스 공지 및 업데이트 알림', value: preferences?.announcement_enabled },
      ],
    },
  ];


  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-lg px-4 py-4 shadow-soft sticky top-0 z-10 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-stone-600" />
          </button>
          <h1 className="text-lg font-semibold text-stone-800">알림 설정</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 테스트 알림 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Send size={20} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-blue-600">알림 테스트</h2>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-stone-600 mb-3">
              알림 기능이 정상적으로 작동하는지 테스트해보세요.
            </p>
            <button
              onClick={sendTestNotification}
              disabled={sendingTest}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sendingTest ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <Bell size={16} />
                  테스트 알림 보내기
                </>
              )}
            </button>
          </div>
        </div>

        {/* 푸시 알림 설정 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-rose-50 to-rose-100/50 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <BellRing size={20} className="text-rose-500" />
              <h2 className="text-sm font-semibold text-rose-600">푸시 알림</h2>
            </div>
          </div>
          <div className="p-4">
            {pushPermission === 'granted' ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-800">푸시 알림</p>
                  <p className="text-sm text-stone-500">브라우저 푸시 알림 수신</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences?.push_enabled ?? true}
                    onChange={(e) => handlePushToggle(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
            ) : pushPermission === 'denied' ? (
              <div className="text-center py-2">
                <p className="text-sm text-stone-600 mb-2">푸시 알림이 차단되어 있습니다</p>
                <p className="text-xs text-stone-400">브라우저 설정에서 알림을 허용해주세요</p>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-stone-600 mb-3">푸시 알림을 받으시겠습니까?</p>
                <button
                  onClick={requestPushPermission}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl text-sm font-semibold shadow-button hover:shadow-button-hover transition-all"
                >
                  푸시 알림 허용
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 알림 시간 설정 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-600">알림 시간</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">일일 알림 시간</p>
                <p className="text-sm text-gray-500">매일 D-Day 알림을 받을 시간</p>
              </div>
              <input
                type="time"
                value={preferences?.preferred_time?.slice(0, 5) || '09:00'}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>
        </div>

        {/* 카테고리별 알림 설정 */}
        {settingGroups.map((group) => (
          <div key={group.title} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                {group.icon}
                <h2 className="text-sm font-semibold text-gray-600">{group.title}</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => (
                <div key={item.key} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.value ?? true}
                      onChange={(e) => handleToggle(item.key, e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;
