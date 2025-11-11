import { useState, useEffect } from 'react'
import './App.css'
import DayLog from './components/Daylog'

function App() {
  const [logs, setLogs] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null); // null = all
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load logs from JSON file through node js backend
  useEffect(() => {
    // Load logs
    fetch('http://localhost:3001/download-json')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          const normalized = data.map(l => ({
            ...l,
            files: Array.isArray(l.files) ? l.files : (l.file ? [l.file] : [])
          }));
          normalized.sort((a, b) => new Date(a.date) - new Date(b.date));
          setLogs(normalized);
        } else {
          console.error('Data fetched is not an array:', data);
        }
      })
      .catch(error => console.error('Error fetching logs:', error));

    // Load all images for gallery
    fetch('http://localhost:3001/images-list')
      .then(r => r.json())
      .then(setAllImages)
      .catch(err => console.error('Error fetching images list:', err));
  }, []);

  // Load persisted theme choice
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lia-theme');
      if (saved === 'dark') setDarkMode(true);
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist theme choice
  useEffect(() => {
    try {
      localStorage.setItem('lia-theme', darkMode ? 'dark' : 'light');
    } catch (e) {
      // ignore
    }
  }, [darkMode]);


  // Add new log
  const handleAddLog = async () => {

// Validate inputs
const title = document.querySelector('.title-input').value;
const date = document.querySelector('.date-input').value;
const message = document.querySelector('.message-input').value;

if (!title || !date || !message) {
  document.querySelector('.error').style.display = 'block';
  setTimeout(() => {
    document.querySelector('.error').style.display = 'none';
  }, 3000);
  return;
}
    const prevLogs = [...logs];

    const fileInput = document.querySelector('.file-input');
    const files = Array.from(fileInput.files || []);
    const newLog = {
      title: document.querySelector('.title-input').value,
      date: document.querySelector('.date-input').value,
      message: document.querySelector('.message-input').value,
      files: []
    };
    

    // Save image to server
    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));

      await fetch('http://localhost:3001/upload-images', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          newLog.files = data.filenames || [];
        })
        .catch(error => {
          console.error('Error uploading images:', error);
        });
    }

    // Clear input fields after adding the log
    document.querySelector('.title-input').value = '';
    document.querySelector('.date-input').value = '';
    document.querySelector('.message-input').value = '';
    document.querySelector('.file-input').value = '';

    // Add the log and sort by date ascending
    prevLogs.push(newLog);
    prevLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    setLogs(prevLogs);
    saveToJson({ xlogs: prevLogs });

    // Refresh gallery
    fetch('http://localhost:3001/images-list')
      .then(r => r.json())
      .then(setAllImages)
      .catch(() => {});
  };


  // Save to JSON file through node js backend
  const saveToJson = ({xlogs}) => {
    fetch('http://localhost:3001/upload-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(xlogs)
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  // helpers to compute week index relative to first log (1..24)
  const getStartDate = () => {
    if (logs.length === 0) 
      return new Date();
    return new Date(logs[0].date);
  };

  const getWeekIndex = (dateStr) => {
    const start = getStartDate();
    if (!start) return null;
    const d = new Date(dateStr);
    // compute full-day difference
    const diff = d.setHours(0,0,0,0) - new Date(start.getFullYear(), start.getMonth(), start.getDate()).setHours(0,0,0,0);
    const week = Math.floor(diff / (7 * 24 * 3600 * 1000)) + 1;
    if (week < 1) return 1;
    if (week > 24) return 24;
    return week;
  };

  const visibleLogs = selectedWeek ? logs.filter(l => getWeekIndex(l.date) === selectedWeek) : logs;

  // compute week ranges (start/end dates) for sidebar labels
  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('sv-SE');
    } catch (e) {
      return d;
    }
  };

  const weekRanges = (() => {
    const start = getStartDate();
    if (!start) return [];
    const ranges = [];
    const msWeek = 7 * 24 * 3600 * 1000;
    // normalize start to midnight
    const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    for (let w = 1; w <= 24; w++) {
      const s = new Date(startMid.getTime() + (w - 1) * msWeek);
      const e = new Date(s.getTime() + msWeek - 1);
      ranges.push({ week: w, start: s, end: e });
    }
    return ranges;
  })();

  const removeLog = (index) => {
    const toRemove = logs[index];
    const updatedLogs = [...logs];
    updatedLogs.splice(index, 1);
    updatedLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    setLogs(updatedLogs);
    saveToJson({ xlogs: updatedLogs });

    // Delete associated images (best-effort)
    const files = Array.isArray(toRemove?.files) ? toRemove.files : (toRemove?.file ? [toRemove.file] : []);
    files.forEach(name => {
      fetch(`http://localhost:3001/delete-image/${encodeURIComponent(name)}`, { method: 'DELETE' }).catch(() => {});
    });
  }

  // Save edited log and remove old image if it was changed
  const saveEditedLog = async (index, editedLog, changes = { newFiles: [], removed: [] }) => {
    const updatedLogs = [...logs];

    // Upload any newly added files
    if (changes.newFiles && changes.newFiles.length > 0) {
      const formData = new FormData();
      changes.newFiles.forEach(f => formData.append('images', f));
      await fetch('http://localhost:3001/upload-images', {
        method: 'POST',
        body: formData
      })
        .then(r => r.json())
        .then(data => {
          const uploaded = data.filenames || [];
          editedLog.files = [...(editedLog.files || []), ...uploaded];
        })
        .catch(err => console.error('Error uploading images:', err));
    }

    // Delete any removed files
    if (changes.removed && changes.removed.length > 0) {
      await Promise.allSettled(
        changes.removed.map(name => fetch(`http://localhost:3001/delete-image/${encodeURIComponent(name)}`, { method: 'DELETE' }))
      );
    }

    updatedLogs[index] = editedLog;
    updatedLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    setLogs(updatedLogs);
    saveToJson({ xlogs: updatedLogs });

    // Refresh gallery
    fetch('http://localhost:3001/images-list')
      .then(r => r.json())
      .then(setAllImages)
      .catch(() => {});
  };


  return (
    <>
      <div className={`app-root ${darkMode ? 'dark' : 'light'}`}>
        <header className="header">
          <div className="header-left">
            <h1 className='header-title'>LIA-LOGG</h1>
            <p className="header-sub">WIN24 | Robin Carlsson</p>
          </div>
          <div className="header-actions">
            <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}>{darkMode ? 'Tema - Mörkt' : 'Tema - Ljust'}</button>
          </div>
        </header>

        <div className="app-body">
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-section">
              <h3>Veckor</h3>
              <button className={`week-btn ${selectedWeek === null ? 'active' : ''}`} onClick={() => { setSelectedWeek(null); setSidebarOpen(false); }}>Alla</button>
              <div className="weeks-list">
                {weekRanges.map(wr => (
                  <button
                    key={wr.week}
                    className={`week-btn ${selectedWeek === wr.week ? 'active' : ''}`}
                    onClick={() => { setSelectedWeek(wr.week); setSidebarOpen(false); }}
                    title={`${formatDate(wr.start)} — ${formatDate(wr.end)}`}
                  >
                    <div className="week-label">Vecka {wr.week}</div>
                    <div className="week-dates">{formatDate(wr.start)} — {formatDate(wr.end)}</div>
                  </button>
                ))}
              </div>
              <div className='footer'>
                <p>© 2025 DBP Develop</p>
              </div>
            </div>
          </aside>

          <main className="main-content">
            <div className="mobile-controls">
              <button className="sidebar-toggle" onClick={() => setSidebarOpen(s => !s)}>{sidebarOpen ? 'Stäng veckor' : 'Visa veckor'}</button>
              <div style={{ flex: 1 }} />
              <div className="mobile-selected">{selectedWeek ? `Vecka ${selectedWeek}` : 'Alla'}</div>
            </div>

            <div className="log-container">
              {visibleLogs.length === 0 ? (
                <div className="empty">Ingen logg för vald vecka</div>
              ) : (
                visibleLogs.map((log, index) => (
                  <DayLog
                    key={index}
                    title={log.title}
                    date={log.date}
                    message={log.message}
                    files={log.files}
                    onDelete={() => removeLog(index)}
                    onUpdate={(updatedLog, changes) => saveEditedLog(index, updatedLog, changes)}
                  />
                ))
              )}
            </div>

            <div>
              <div className="add-log-container">
                <h2 className='error' style={{ display: 'none', color: 'var(--danger)' }}>Fyll i alla fält</h2>
                <input className='title-input' type="text" placeholder="Titel" />
                <input className='date-input' type="date" value={new Date().toISOString().split('T')[0]} />
                <textarea className='message-input' placeholder="Meddelande"/>
                <input className='file-input' type="file" accept="image/*" multiple />
                <button className='add-log-button' onClick={() => handleAddLog()}>Lägg till</button>
              </div>

              
            </div>
          </main>
        </div>

        
      </div>
    </>
  )
}

export default App
