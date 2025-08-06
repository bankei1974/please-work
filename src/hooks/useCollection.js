import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';

export function useCollection(db, collectionPath, queryConstraints = [], orderByConstraints = []) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refetchIndex, setRefetchIndex] = useState(0);

    const refetch = () => setRefetchIndex(prev => prev + 1);

    useEffect(() => {
        if (!db || !collectionPath) {
            setLoading(false);
            return;
        }

        const hasUndefinedConstraint = queryConstraints.some(c => c && typeof c._where === 'object' && c._where.value === undefined);
        if (hasUndefinedConstraint) {
            setLoading(false);
            setData([]);
            return;
        }

        setLoading(true);
        const collRef = collection(db, collectionPath);
        const allConstraints = [...queryConstraints, ...orderByConstraints].filter(c => c);
        console.log('allConstraints', allConstraints);
        const q = query(collRef, ...allConstraints);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                status: Array.isArray(doc.data().status) ? doc.data().status : [],
            }));
            setData(items);
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching collection (${collectionPath}):`, error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, collectionPath, JSON.stringify(queryConstraints), JSON.stringify(orderByConstraints), refetchIndex]);

    return { data, loading, refetch };
}