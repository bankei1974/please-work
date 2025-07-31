import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';

export function useCollection(db, collectionPath, queryConstraints = []) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !collectionPath || !queryConstraints) { setLoading(false); return; };
        const hasUndefined = queryConstraints.some(c => c && typeof c._where === 'object' && c._where.value === undefined);
        if (hasUndefined) { setLoading(false); setData([]); return; }
        setLoading(true);
        const collRef = collection(db, collectionPath);
        const q = query(collRef, ...queryConstraints);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    status: Array.isArray(data.status) ? data.status : []
                };
            });
            setData(items);
            setLoading(false);
        }, (error) => { console.error(`Error fetching collection (${collectionPath}):`, error); setLoading(false); });
        return () => unsubscribe();
    }, [db, collectionPath, JSON.stringify(queryConstraints)]);
    return { data, loading };
}