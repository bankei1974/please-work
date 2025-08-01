import React, { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { collection, getDocs, query } from 'firebase/firestore';
import { Sparkles } from 'lucide-react';

import { db } from '../firebase';

const AIInsightsPage = () => {
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [question, setQuestion] = useState('');

    const { data: shifts } = useCollection(db, 'shifts');
    const { data: users } = useCollection(db, 'users');
    const { data: units } = useCollection(db, 'units');
    const { data: jobTitles } = useCollection(db, 'jobTitles');
    const { data: statuses } = useCollection(db, 'statuses');
    const { data: staffingLevels } = useCollection(db, 'staffingLevels');
    const { data: patientCensus } = useCollection(db, 'patientCensus');

    const handleAnalyze = async () => {
        setIsLoading(true);
        setAnalysisResult('');
        
        // We now have all the data from the hooks.
        // We will construct the prompt in the next step.
        const shiftsData = shifts;
        const usersData = users;
        const unitsData = units;
        const jobTitlesData = jobTitles;
        const statusesData = statuses;
        const staffingLevelsData = staffingLevels;
        const patientCensusData = patientCensus;

        const prompt = `
            Based on the following data, please answer the user's question.
            
            Shifts: ${JSON.stringify(shiftsData)}
            Users: ${JSON.stringify(usersData)}
            Units: ${JSON.stringify(unitsData)}
            Job Titles: ${JSON.stringify(jobTitlesData)}
            Statuses: ${JSON.stringify(statusesData)}
            Staffing Levels: ${JSON.stringify(staffingLevelsData)}
            Patient Census: ${JSON.stringify(patientCensusData)}
            
            Question: ${question}
        `;
        
        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                setAnalysisResult(result.candidates[0].content.parts[0].text);
            } else {
                setAnalysisResult("Could not get a valid analysis from the AI. The response might be empty or malformed.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setAnalysisResult("An error occurred while trying to analyze the data.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <main className="p-8 overflow-y-auto flex-1 flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">AI Insights</h1>
            </div>
             <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                 <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Sparkles className="text-purple-400"/> AI-Powered Insights</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Simplified controls for now */}
                    <input type="date" className="input-style" />
                    <input type="date" className="input-style" />
                    <select className="input-style"><option>Workload Scores</option><option>Call-Outs</option></select>
                 </div>
                 <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about the selected data..." className="input-style w-full min-h-[80px] mb-4"></textarea>
                 <button onClick={handleAnalyze} className="btn-primary flex items-center gap-2" disabled={isLoading}>{isLoading ? 'Analyzing...' : 'Analyze'}</button>
                 {analysisResult && <div className="mt-4 p-4 bg-gray-700/50 rounded-lg whitespace-pre-wrap"><p>{analysisResult}</p></div>}
            </div>
        </main>
    )
}

export default AIInsightsPage;