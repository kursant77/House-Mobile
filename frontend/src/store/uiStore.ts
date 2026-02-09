import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
    isMuted: boolean;
    toggleMuted: () => void;
    setMuted: (muted: boolean) => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            isMuted: false,
            toggleMuted: () => set((state) => ({ isMuted: !state.isMuted })),
            setMuted: (muted) => set({ isMuted: muted }),
        }),
        {
            name: 'ui-storage',
        }
    )
);
