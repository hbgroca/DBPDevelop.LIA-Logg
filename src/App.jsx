import { useState, useEffect } from 'react'
import './App.css'
import DayLog from './components/daylog'

function App() {
  const [logs, setLogs] = useState([]);

  // Load logs from JSON file through node js backend
  useEffect(() => {
    fetch('http://localhost:3001/download-json')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          data.sort((a, b) => new Date(a.date) - new Date(b.date));
          setLogs(data);
          // console.log('Fetched logs:', data);
        } else {
          console.error('Data fetched is not an array:', data);
        }
      })
      .catch(error => console.error('Error fetching logs:', error));
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
    const file = fileInput.files[0];
    const newLog = {
          title: document.querySelector('.title-input').value,
          date: document.querySelector('.date-input').value,
          message: document.querySelector('.message-input').value,
          file: file ? file.name : ""
        };
    

    // Save image to server
    if (file) {
      const formData = new FormData();
      formData.append('image', file);

      await fetch('http://localhost:3001/upload-image', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          newLog.file = data.filename; 
        })
        .catch(error => {
          console.error('Error uploading image:', error);
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
    const updatedLogs = [...logs];
    updatedLogs.splice(index, 1);
    updatedLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    setLogs(updatedLogs);
    saveToJson({ xlogs: updatedLogs });
  }

  // Save edited log and remove old image if it was changed
  const saveEditedLog = async (index, editedLog, oldFile) => {
    const updatedLogs = [...logs];
    
  
    // Save new image to server if it was changed
    if (editedLog.file && editedLog.file !== oldFile) {
      const fileInput = document.querySelector('.edit-file');
      const file = fileInput.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        
        await fetch('http://localhost:3001/upload-image', {
          method: 'POST',
          body: formData
        })
          .then(response => response.json())
          .then(data => {
            console.log(data);
            editedLog.file = data.filename;
          })
          .catch(error => {
            console.error('Error uploading image:', error);
          });
      }
    }

    // If the file was changed, delete the old file from the server
    if (oldFile && oldFile !== editedLog.file) {
      fetch(`http://localhost:3001/delete-image/${oldFile}`, {
        method: 'DELETE'
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
        })
        .catch(error => {
          console.error('Error deleting image:', error);
        });
    }
    updatedLogs[index] = editedLog;
    updatedLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    setLogs(updatedLogs);
    saveToJson({ xlogs: updatedLogs });
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
            <DayLog key={index} title={log.title} date={log.date} message={log.message} file={log.file} onDelete={() => removeLog(index)} onUpdate={(updatedLog) => saveEditedLog(index, updatedLog, log.file)} />
          ))}
        </div>

        {/* Add new log */}
        <div className="add-log-container">
          <h2 className='error' style={{ display: 'none', color: 'red' }}>Fyll i alla fält</h2>
          <input className='title-input' type="text" placeholder="Titel" />
          <input className='date-input' type="date" />
          <textarea className='message-input' placeholder="Meddelande"/>
          <input className='file-input' type="file" />
          <button className='add-log-button' onClick={() => handleAddLog()}>Lägg till</button>
        </div>
      </div>
    </>
  )
}

export default App
