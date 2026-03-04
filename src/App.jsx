// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';

// --- Inline SVG Icons (Replaces lucide-react to prevent React context errors) ---
const Upload = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const Search = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const ChevronDown = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>;
const ChevronUp = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="18 15 12 9 6 15"></polyline></svg>;
const Clock = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const MapPin = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const User = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const Tag = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;
const Download = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const Radio = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>;

// --- CSV Parsing Helper ---
// Handles quotes and commas inside fields properly
const parseCSV = (str) => {
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // Skip the escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // Skip \r in \r\n
      currentRow.push(currentValue.trim());
      if (currentRow.some(val => val !== '')) rows.push(currentRow);
      currentRow = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  if (currentValue !== '' || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }
  return rows;
};

// --- Main Application ---
export default function App() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(new Date());
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [error, setError] = useState('');

  // Update current time every 10 seconds to keep live pinning accurate
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = parseCSV(text);
        
        if (rows.length < 2) throw new Error("CSV appears to be empty or missing headers.");
        
        // Find column indices based on headers
        // FIXED: The regex below had a typo ([^a-z0-origin]) which causes a SyntaxError build failure
        const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const colIdx = {
          sessionName: headers.findIndex(h => h.includes('session')),
          start: headers.findIndex(h => h.includes('start')),
          end: headers.findIndex(h => h.includes('end')),
          location: headers.findIndex(h => h.includes('location') || h.includes('room')),
          title: headers.findIndex(h => h.includes('title') || h.includes('presentation')),
          presenter: headers.findIndex(h => h.includes('presenter') || h.includes('speaker')),
          tags: headers.findIndex(h => h.includes('tag') || h.includes('subject'))
        };

        // Ensure required columns exist
        if (colIdx.sessionName === -1 || colIdx.start === -1 || colIdx.end === -1) {
          throw new Error("CSV must contain 'Session Name', 'Start Time', and 'End Time' columns.");
        }

        const sessionsMap = new Map();

        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 3) continue; // Skip empty/malformed rows

          const sessionName = row[colIdx.sessionName];
          const startTimeStr = row[colIdx.start];
          const endTimeStr = row[colIdx.end];
          
          if (!sessionName || !startTimeStr || !endTimeStr) continue;

          // Standardize date parsing (assume YYYY-MM-DD HH:mm or similar valid format)
          const start = new Date(startTimeStr);
          const end = new Date(endTimeStr);

          // Group by session
          if (!sessionsMap.has(sessionName)) {
            sessionsMap.set(sessionName, {
              id: sessionName + startTimeStr,
              name: sessionName,
              start: start,
              end: end,
              location: colIdx.location !== -1 ? row[colIdx.location] : '',
              presentations: []
            });
          }

          // Add presentation to session
          if (colIdx.title !== -1 && row[colIdx.title]) {
            sessionsMap.get(sessionName).presentations.push({
              id: `pres-${i}`,
              title: row[colIdx.title],
              presenter: colIdx.presenter !== -1 ? row[colIdx.presenter] : '',
              tags: colIdx.tags !== -1 ? row[colIdx.tags].split(';').map(t => t.trim()) : []
            });
          }
        }

        const parsedSessions = Array.from(sessionsMap.values());
        setData(parsedSessions);
        
        // Auto-expand all sessions initially
        setExpandedSessions(new Set(parsedSessions.map(s => s.id)));
      } catch (err) {
        setError(err.message || "Error parsing CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `Session Name,Start Time,End Time,Location,Presentation Title,Presenter,Tags\nMorning Keynote,2026-03-04 09:00,2026-03-04 10:30,Main Hall,Opening Remarks,Jane Doe,Keynote;Welcome\nMorning Keynote,2026-03-04 09:00,2026-03-04 10:30,Main Hall,The Future of AI,Dr. Smith,Tech;AI\nWorkshop Alpha,2026-03-04 10:45,2026-03-04 12:00,Room 101,Hands-on React,Alice Jones,Web;Frontend`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clas_schedule_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleSession = (id) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Process data: Filter, remove past, and sort
  const processedSessions = useMemo(() => {
    const query = search.toLowerCase().trim();

    return data
      .map(session => {
        // Filter presentations based on search
        let filteredPresentations = session.presentations;
        if (query) {
          filteredPresentations = session.presentations.filter(p => 
            p.presenter.toLowerCase().includes(query) || 
            p.tags.some(t => t.toLowerCase().includes(query)) ||
            p.title.toLowerCase().includes(query)
          );
        }
        return { ...session, presentations: filteredPresentations };
      })
      // Keep sessions that match the search (either via presentation or session name itself)
      .filter(session => {
        if (query) {
          const sessionMatches = session.name.toLowerCase().includes(query);
          if (!sessionMatches && session.presentations.length === 0) return false;
        }
        return true; // Keep all if no query, or if it matched
      })
      // Core Logic: Hide past sessions
      .filter(session => now < session.end)
      // Sort logic
      .sort((a, b) => {
        const aActive = now >= a.start && now < a.end;
        const bActive = now >= b.start && now < b.end;

        // Core Logic: Pin active sessions to the top
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        // Otherwise sort chronologically
        return a.start.getTime() - b.start.getTime();
      });
  }, [data, search, now]);

  // Format times elegantly
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };
  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">CLAS Live Schedule</h1>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" /> 
                Live System Time: {formatDate(now)} at {formatTime(now)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm shadow-sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
              {data.length === 0 && (
                <button onClick={downloadTemplate} className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors text-sm shadow-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          {data.length > 0 && (
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Presenter, Subject Tag, or Title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          )}
        </header>

        {/* Empty State */}
        {data.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
            <Radio className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Schedule Uploaded</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Upload a CSV file containing your CLAS schedule to get started. Active sessions will automatically pin to the top.
            </p>
            <button onClick={downloadTemplate} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              Download example CSV file
            </button>
          </div>
        )}

{/* Schedule List */}
<div className="space-y-4 overflow-x-auto">
  <div className="min-w-[320px]">
    {processedSessions.map(session => {
      const isActive = now >= session.start && now < session.end;
      const isExpanded = expandedSessions.has(session.id);

      return (
        <div
          key={session.id}
          className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
            isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'
          }`}
        >
          {/* Session Header */}
          <button
            onClick={() => toggleSession(session.id)}
            className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{session.name}</h2>
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    LIVE NOW
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {formatTime(session.start)} - {formatTime(session.end)}
                </span>
                {session.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {session.location}
                  </span>
                )}
              </div>
            </div>

            {/* Expand/Collapse Chevron */}
            <div className="text-slate-400 p-2 flex-shrink-0">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {/* Expanded Presentations */}
          {isExpanded && session.presentations.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5 sm:pl-8 md:pl-12">
              <div className="space-y-4 border-l-2 border-slate-200 pl-4">
                {session.presentations.map(pres => (
                  <div key={pres.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-300 border-2 border-slate-50"></div>

                    <h3 className="font-semibold text-slate-900 leading-snug text-sm sm:text-base">{pres.title}</h3>

                    {(pres.presenter || pres.tags.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
                        {pres.presenter && (
                          <div className="flex items-center text-xs sm:text-sm text-slate-600">
                            <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {pres.presenter}
                          </div>
                        )}

                        {pres.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap text-xs sm:text-sm">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            {pres.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty Search Result Fallback */}
          {isExpanded && session.presentations.length === 0 && (
            <div className="border-t border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 italic text-center">
              No presentations match your search criteria.
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>
