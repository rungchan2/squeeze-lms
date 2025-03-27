import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface JourneyState {
  currentJourneyId: number | null;
  setCurrentJourneyId: (id: number) => void;
  clearCurrentJourneyId: () => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set) => ({
      currentJourneyId: null,
      
      setCurrentJourneyId: (id: number) => {
        if (!id) {
          console.warn("유효하지 않은 journey ID");
          return;
        }
        set({ currentJourneyId: id });
      },
      
      clearCurrentJourneyId: () => {
        set({ currentJourneyId: null });
      },
    }),
    {
      name: 'journey-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentJourneyId: state.currentJourneyId,
      }),
    }
  )
);

//TODO: 3. 이거 스토어 쓰지 말고 아예 pk id를 uuid 로 바꾸자