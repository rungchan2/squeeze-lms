import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

async function getCurrentJourneyId(uuid: string) {
  if (!uuid || uuid === "") {
    return null;
  }
  const supabase = createClient();
  const { data, error } = await supabase.from('journeys').select('id').eq('uuid', uuid).single();
  if (error) {
    console.error('Journey ID 조회 오류:', error);
    return null;
  }
  return data?.id || null;
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
        console.log('Journey UUID가 설정됨:', uuid);
        set({ currentJourneyUuid: uuid });
      },
      clearCurrentJourneyId: () => {
        console.log('Journey ID가 초기화됨'); 
        set({ currentJourneyId: null });
      },
      clearCurrentJourneyUuid: () => {
        console.log('Journey UUID가 초기화됨');
        set({ currentJourneyUuid: null });
      },
      getCurrentJourneyId: async () => {
        const { currentJourneyUuid } = get();
        const id = await getCurrentJourneyId(currentJourneyUuid || "");
        set({ currentJourneyId: id });
        return id;
      },
    }),
    {
      name: 'journey-storage', // localStorage에 저장될 키 이름
      storage: createJSONStorage(() => localStorage),
    }
  )
);

//TODO: 3. 이거 스토어 쓰지 말고 아예 pk id를 uuid 로 바꾸자