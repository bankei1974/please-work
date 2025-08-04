import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { db } from '../firebase';
import { where } from 'firebase/firestore';

const KarmaLeaderboard = ({ selectedUnits }) => {
    const query = selectedUnits.length > 0 ? [where('predominantUnitId', 'in', selectedUnits)] : [];
    const { data: staff } = useCollection(db, 'users', query);

    const sortedStaff = staff.sort((a, b) => (b.staffKarma || 0) - (a.staffKarma || 0)).slice(0, 5);

    return (
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-2xl font-semibold mb-4">Top 5 Karma Leaderboard</h3>
            <ol className="list-decimal list-inside space-y-2">
                {sortedStaff.map((member, index) => (
                    <li key={member.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                        <span>{index + 1}. {member.fullName}</span>
                        <span className="font-bold">{member.staffKarma || 0} Karma</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default KarmaLeaderboard;
