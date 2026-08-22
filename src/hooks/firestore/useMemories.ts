import { useState, useEffect } from 'react';
import { MemoryItem } from '../../types/firestore';
import {
  defaultMemories,
  subscribeMemories,
  saveMemory,
  saveMemoriesBatch,
  deleteMemory,
  likeMemory,
} from '../../services/firestore/memories.service';

export function useMemories() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeMemories((items) => {
      setMemories(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return {
    memories,
    loading,
    saveMemory,
    saveMemoriesBatch,
    deleteMemory,
    likeMemory,
  };
}
