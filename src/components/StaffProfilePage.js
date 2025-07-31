
import React from 'react';
import StaffProfile from './StaffProfile';

import { db } from '../firebase';

const StaffProfilePage = ({ staffId }) => {
    return (
        <div className="p-6">
            <StaffProfile db={db} staffId={staffId} />
        </div>
    );
};

export default StaffProfilePage;
