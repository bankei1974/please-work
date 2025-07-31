import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
    getFirestore,
    collection,
    onSnapshot,
    addDoc,
    serverTimestamp,
    query,
    where,
    doc,
    setDoc
} from 'firebase/firestore';
import MainApp from './components/MainApp';
import LoginPage from './components/LoginPage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

export default function App() {
    const [auth, setAuth] = useState(null); const [db, setDb] = useState(null); const [user, setUser] = useState(null); const [userProfile, setUserProfile] = useState(null); const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState('');
    
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance); setDb(dbInstance);
        
        const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const usersRef = collection(dbInstance, 'users');
                const q = query(usersRef, where("email", "==", currentUser.email));

                const unsubscribeProfile = onSnapshot(q, async (snapshot) => {
                    if (snapshot.empty) {
                        try {
                            const isManager = currentUser.email === 'manager@hospital.com';
                            const newDoc = {
                                email: currentUser.email,
                                fullName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : `user_${currentUser.uid.substring(0,5)}`),
                                role: isManager ? 'Manager' : 'Staff',
                                createdAt: serverTimestamp(),
                                authUid: currentUser.uid
                            };
                            await setDoc(doc(usersRef, currentUser.uid), newDoc);
                        } catch (e) {
                            console.error("Error creating user profile document:", e);
                            setIsLoading(false);
                        }
                    } else {
                        const profileDoc = snapshot.docs[0];
                        setUserProfile({ id: profileDoc.id, ...profileDoc.data() });
                        setIsLoading(false);
                    }
                });
                return () => unsubscribeProfile();
            } else {
                setUser(null);
                setUserProfile(null);
                setIsLoading(false);
            }
        });
        
        return () => unsubscribe();
    }, []);

    const handleLogin = async (e, email, password) => {
        e.preventDefault();
        setError('');
        if (!auth) return;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                } catch (createErr) {
                    console.error("Error creating user:", createErr);
                    if (createErr.code === 'auth/operation-not-allowed') {
                        setError('Sign-up is disabled. Please enable Email/Password in your Firebase console.');
                    } else {
                        setError('Could not sign up. Please try again.');
                    }
                }
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else {
                console.error(err);
                setError('An unexpected error occurred. Please try again.');
            }
        }
    };
    
    if (isLoading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
    
        if (user && userProfile) return <MainApp auth={auth} db={db} currentUser={user} userProfile={userProfile} />;
        
        return <LoginPage onLogin={handleLogin} error={error} />;
}