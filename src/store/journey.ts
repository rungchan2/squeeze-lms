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
    
    const { data, error } = await supabase.from('journeys').select('id').eq('uuid', uuid).single();
    
    if (error) {
      console.error('Journey ID 조회 오류:', error);
      return null;
    }
    
    if (!data) {
      console.warn('Journey not found for UUID:', uuid);
      return null;
    }
    
    console.log("Journey ID found:", data.id);
    return data.id;
  } catch (err) {
    console.error("Unexpected error in getCurrentJourneyId:", err);
    return null;
  }
}

interface JourneyState {
  currentJourneyUuid: string | null;
  currentJourneyId: number | null;

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
      setCurrentJourneyUuid: (uuid: string) => {
        if (!uuid) {
          console.warn("Attempted to set empty journey UUID");
          return;
        }
        
        const currentUuid = get().currentJourneyUuid;
        if (currentUuid === uuid) {
          console.log('Journey UUID already set to:', uuid);
          return;
        }
        
        console.log('Setting journey UUID:', uuid);
        set({ currentJourneyUuid: uuid, currentJourneyId: null });
        
        // UUID가 설정되면 바로 ID도 가져오기
        getCurrentJourneyId(uuid).then(id => {
          if (id) {
            console.log('Setting journey ID:', id);
            set({ currentJourneyId: id });
          }
        });
      },
      clearCurrentJourneyId: () => {
        console.log('Journey ID가 초기화됨'); 
        set({ currentJourneyId: null });
      },
      clearCurrentJourneyUuid: () => {
        console.log('Journey UUID가 초기화됨');
        set({ currentJourneyUuid: null, currentJourneyId: null });
      },
      getCurrentJourneyId: async () => {
        try {
          const { currentJourneyUuid, currentJourneyId } = get();
          
          if (!currentJourneyUuid) {
            console.warn("No current journey UUID set");
            return null;
          }
          
          // 이미 ID가 있으면 재사용
          if (currentJourneyId !== null) {
            console.log("Using cached journey ID:", currentJourneyId);
            return currentJourneyId;
          }
          
          // 없으면 새로 조회
          console.log("Fetching new journey ID for UUID:", currentJourneyUuid);
          const id = await getCurrentJourneyId(currentJourneyUuid);
          
          if (id) {
            console.log("Setting new journey ID in store:", id);
            set({ currentJourneyId: id });
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentJourneyUuid: state.currentJourneyUuid,
        currentJourneyId: state.currentJourneyId,
      }),
    }
  )
);

//TODO: 3. 이거 스토어 쓰지 말고 아예 pk id를 uuid 로 바꾸자