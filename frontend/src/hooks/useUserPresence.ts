import { useState, useEffect } from "react";
import { presenceService, UserPresence } from "@/services/api/presence";
import { useAuthStore } from "@/store/authStore";

export function useUserPresence(userId: string | undefined) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    presenceService.getUserPresence(userId).then(setPresence);

    // Subscribe to updates
    const unsubscribe = presenceService.subscribeToPresence(userId, setPresence);

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Update own presence when user changes
  useEffect(() => {
    if (!user?.id) return;

    // Set online when component mounts
    presenceService.updatePresence(true);

    // Set offline when component unmounts
    return () => {
      presenceService.updatePresence(false);
    };
  }, [user?.id]);

  return presence;
}
