import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

async function getCurrentJourneyId(uuid: string) {
  if (!uuid || uuid === "") {
    console.warn("Empty UUID provided to getCurrentJourneyId");
    return null;
  }
  
  try {
    const supabase = createClient();
    console.log("Fetching journey ID for UUID:", uuid);
    
    // 더 강력한 에러 핸들링을 위해 try-catch 추가
    try {
      const response = await supabase.from('journeys').select('id').eq('uuid', uuid).single();
      
      if (response.error) {
        console.error('Journey ID 조회 오류:', response.error);
        return null;
      }
      
      if (!response.data) {
        console.warn('Journey not found for UUID:', uuid);
        return null;
      }
      
      console.log("Journey ID found:", response.data.id);
      return response.data.id;
    } catch (dbError) {
      console.error('Supabase query error:', dbError);
      return null;
    }
  } catch (err) {
    console.error("Unexpected error in getCurrentJourneyId:", err);
    return null;
  }
}

interface JourneyState {
  currentJourneyUuid: string | null;
  currentJourneyId: number | null;
  lastUpdated: number | null;

  getCurrentJourneyId: () => Promise<number | null>;
  clearCurrentJourneyId: () => void;

  setCurrentJourneyUuid: (uuid: string) => void;
  clearCurrentJourneyUuid: () => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      currentJourneyId: null,
      currentJourneyUuid: null,
      lastUpdated: null,
      
      setCurrentJourneyUuid: (uuid: string) => {
        if (!uuid) {
          console.warn("Attempted to set empty journey UUID");
          return;
        }
        
        const currentUuid = get().currentJourneyUuid;
        const currentId = get().currentJourneyId;
        
        // 이미 UUID가 설정되어 있고 ID도 있으면 중복 작업 방지
        if (currentUuid === uuid && currentId) {
          console.log('Journey UUID already set to:', uuid);
          return;
        }
        
        console.log('Setting journey UUID:', uuid);
        
        // 먼저 UUID만 설정하고 ID는 비동기적으로 가져옴
        set({ currentJourneyUuid: uuid });
        
        // 만약 브라우저 환경이 아니면 함수 종료
        if (typeof window === 'undefined') {
          return;
        }
        // API를 통해 ID 가져오기 (Promise 처리는 하지만 반환하지 않음)
        const fetchId = async () => {
          try {
            // 이미 ID가 있으면 재사용
            if (currentId && currentUuid === uuid) {
              return;
            }
            
            // API를 통해 ID 가져오기
            const response = await fetch("/api/journeys", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ uuid }),
              // 캐시 방지 설정
              cache: 'no-store',
            });
            
            if (!response.ok) {
              throw new Error(`API 에러: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
              throw new Error(result.error);
            }
            
            const id = result.data?.id;
            if (id) {
              console.log('Setting journey ID from API:', id);
              set({ 
                currentJourneyId: id,
                lastUpdated: Date.now()
              });
              return;
            }
            throw new Error('API returned no journey ID');
          } catch (apiError) {
            console.error('Error getting journey ID from API:', apiError);
            
            // API 실패 시 기존 방식으로 폴백
            try {
              const id = await getCurrentJourneyId(uuid);
              if (id) {
                console.log('Setting journey ID with fallback:', id);
                set({ 
                  currentJourneyId: id,
                  lastUpdated: Date.now() 
                });
                return;
              }
            } catch (fallbackError) {
              console.error('Fallback error:', fallbackError);
            }
          }
        };
        
        // 비동기 처리 시작 (결과 기다리지 않음)
        fetchId();
      },
      
      clearCurrentJourneyId: () => {
        console.log('Journey ID가 초기화됨'); 
        set({ currentJourneyId: null });
      },
      
      clearCurrentJourneyUuid: () => {
        console.log('Journey UUID가 초기화됨');
        set({ 
          currentJourneyUuid: null, 
          currentJourneyId: null,
          lastUpdated: null 
        });
      },
      
      getCurrentJourneyId: async () => {
        try {
          const { currentJourneyUuid, currentJourneyId, lastUpdated } = get();
          
          if (!currentJourneyUuid) {
            console.warn("No current journey UUID set");
            return null;
          }
          
          // 이미 ID가 있고 최근에 업데이트되었으면 재사용 (5분 이내)
          const now = Date.now();
          const isRecent = lastUpdated && (now - lastUpdated < 5 * 60 * 1000);
          
          if (currentJourneyId !== null && isRecent) {
            console.log("Using cached journey ID:", currentJourneyId);
            return currentJourneyId;
          }
          
          // 브라우저 환경에서만 API 사용
          if (typeof window !== 'undefined') {
            try {
              const response = await fetch("/api/journeys", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ uuid: currentJourneyUuid }),
                // 캐시 방지 설정
                cache: 'no-store',
              });
              
              if (!response.ok) {
                throw new Error(`API 에러: ${response.status}`);
              }
              
              const result = await response.json();
              
              if (result.error) {
                throw new Error(result.error);
              }
              
              const id = result.data?.id;
              if (id) {
                console.log("Setting new journey ID from API:", id);
                set({ 
                  currentJourneyId: id,
                  lastUpdated: Date.now()
                });
                return id;
              }
            } catch (apiError) {
              console.error("API error in getCurrentJourneyId:", apiError);
              // API 실패 시 기존 방식으로 폴백
            }
          }
          
          // API 실패 또는 서버 환경에서는 기존 방식 사용
          console.log("Fetching new journey ID for UUID:", currentJourneyUuid);
          const id = await getCurrentJourneyId(currentJourneyUuid);
          
          // 상태 업데이트
          if (id) {
            console.log("Setting new journey ID in store:", id);
            set({ 
              currentJourneyId: id,
              lastUpdated: Date.now() 
            });
          } else {
            console.warn("Failed to get journey ID for UUID:", currentJourneyUuid);
          }
          
          return id;
        } catch (err) {
          console.error("Error in getCurrentJourneyId store method:", err);
          return null;
        }
      },
    }),
    {
      name: 'journey-storage',
      storage: createJSONStorage(() => {
        // localStorage가 사용 가능한지 먼저 확인
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage;
          }
          throw new Error('localStorage is not available');
        } catch (error) {
          console.warn('localStorage is not available, using memory storage instead');
          // localStorage가 없으면 메모리 스토리지 사용
          let storage: Record<string, string> = {};
          return {
            getItem: (name: string) => {
              return storage[name] || null;
            },
            setItem: (name: string, value: string) => {
              storage[name] = value;
            },
            removeItem: (name: string) => {
              delete storage[name];
            }
          };
        }
      }),
      partialize: (state) => ({
        currentJourneyUuid: state.currentJourneyUuid,
        currentJourneyId: state.currentJourneyId,
        lastUpdated: state.lastUpdated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Journey store rehydrated:', {
            uuid: state.currentJourneyUuid,
            id: state.currentJourneyId,
            lastUpdated: state.lastUpdated
          });
        } else {
          console.warn('Failed to rehydrate journey store');
        }
      },
    }
  )
);

//TODO: 3. 이거 스토어 쓰지 말고 아예 pk id를 uuid 로 바꾸자