import { useState, useEffect } from 'react'
import './App.css'
import DayLog from './components/Daylog'

function App() {
  const [logs, setLogs] = useState([]);
  const [allImages, setAllImages] = useState([]);

  // Load logs from JSON file through node js backend
  useEffect(() => {
    // Load logs
    fetch('http://localhost:3001/download-json')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Backwards compatibility: transform single file -> files[]
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
      <div>
        <div className="header">
          <h1 className='header-title'>Aktivitetslogg</h1>
          <div className="header-info">
            <p>Projektgrupp 7</p>
            <p>Robin Carlsson</p>
          </div>
        </div>

        <div className="log-container">
          {logs.map((log, index) => (
            <DayLog
              key={index}
              title={log.title}
              date={log.date}
              message={log.message}
              files={log.files}
              onDelete={() => removeLog(index)}
              onUpdate={(updatedLog, changes) => saveEditedLog(index, updatedLog, changes)}
            />
          ))}
        </div>

        {/* Add new log */}
        <div className="add-log-container">
          <h2 className='error' style={{ display: 'none', color: 'red' }}>Fyll i alla fält</h2>
          <input className='title-input' type="text" placeholder="Titel" />
          <input className='date-input' type="date" />
          <textarea className='message-input' placeholder="Meddelande"/>
          <input className='file-input' type="file" accept="image/*" multiple />
          <button className='add-log-button' onClick={() => handleAddLog()}>Lägg till</button>
        </div>

        {/* Gallery of all images on server */}
        {/* <div className="all-images-gallery" style={{ marginTop: '2rem' }}>
          <h2>Alla bilder</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {allImages.map((img, i) => (
              <img key={i} src={`http://localhost:3001/images/${img}`} alt={img} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '.5rem' }} />
            ))}
          </div>
        </div> */}

        <div className='footer'>
          <p>© 2025 DBP Develop</p>
        </div>
      </div>
    </>
  )
}

export default App
