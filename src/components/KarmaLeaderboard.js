import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { db } from '../firebase';
import { where } from 'firebase/firestore';

const KarmaLeaderboard = ({ selectedUnits }) => {
    const query = selectedUnits.length > 0 ? [where('predominantUnitId', 'in', selectedUnits)] : [];
    const { data: staff } = useCollection(db, 'users', query);

    const sortedStaff = staff.sort((a, b) => (b.staffKarma || 0) - (a.staffKarma || 0)).slice(0, 5);

    return (
        <div className="bg-gray-800 p-4 rounded-lg h-full">
            <h3 className="text-lg font-semibold mb-2">Top 5 Karma</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
                {sortedStaff.map((member, index) => (
                    <li key={member.id} className="flex justify-between items-center bg-gray-700/50 p-1 rounded-md">
                        <span>{index + 1}. {member.fullName}</span>
                        <span className="font-bold">{member.staffKarma || 0}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default KarmaLeaderboard;
