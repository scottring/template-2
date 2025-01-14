import { create } from 'zustand';
import { collection, doc, onSnapshot, query, orderBy, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Itinerary, ItineraryItem, TimeScale, ItineraryType } from '@/types/models';

interface ItineraryStore {
  itineraries: Itinerary[];
  setItineraries: (itineraries: Itinerary[]) => void;
  
  // Core operations
  createItinerary: (data: Omit<Itinerary, 'id'>) => Promise<string>;
  updateItemStatus: (itineraryId: string, itemId: string, status: ItineraryItem['status']) => Promise<void>;
  getItineraryByDate: (date: Date, type: ItineraryType, timeScale: TimeScale) => Itinerary | null;
}

export const useItineraryStore = create<ItineraryStore>((set, get) => ({
  itineraries: [],
  
  setItineraries: (itineraries) => set({ itineraries }),
  
  createItinerary: async (data) => {
    const docRef = await addDoc(collection(db, 'itineraries'), data);
    return docRef.id;
  },
  
  updateItemStatus: async (itineraryId, itemId, status) => {
    const itinerary = get().itineraries.find(i => i.id === itineraryId);
    if (!itinerary) return;
    
    const updatedItems = itinerary.items.map(item =>
      item.id === itemId ? { ...item, status } : item
    );
    
    await updateDoc(doc(db, 'itineraries', itineraryId), {
      items: updatedItems,
    });
  },
  
  getItineraryByDate: (date, type, timeScale) => {
    return get().itineraries.find(itinerary => 
      itinerary.type === type &&
      itinerary.timeScale === timeScale &&
      itinerary.date.toDateString() === date.toDateString()
    ) || null;
  },
})); 