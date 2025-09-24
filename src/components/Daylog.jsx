
import { useState } from 'react'
import './daylog.css'

export default function DayLog({ title, date, message, file, onDelete, onUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
  };
  const handleCancelDelete = () => {
    setIsDeleting(false);
  };
  const confirmDelete = () => {
    onDelete();
  };

  // Edit values
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedDate, setEditedDate] = useState(date);
  const [editedMessage, setEditedMessage] = useState(message);
  const [editedFile, setEditedFile] = useState(file);

  const handleEdit = () => {
    if (isEditing === false) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    console.log('Saved:', editedTitle, editedDate, editedMessage, editedFile);
    onUpdate({ title: editedTitle, date: editedDate, message: editedMessage, file: editedFile });
    setIsEditing(false);
  };

  return (
    <div className="day-log">
      {isEditing ?
        <div className="edit-container">
          <input className='edit-title' type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
          <input className='edit-date' type="date" value={editedDate} onChange={(e) => setEditedDate(e.target.value)} />
          <textarea className='edit-message' value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} />
          <input className='edit-file' type="file" onChange={(e) => setEditedFile(e.target.files[0])} />
          <div className='edit-buttons'>
            <button className='save-button' onClick={handleSave}>Spara</button>
            <button className='cancel-button' onClick={handleEdit}>Avbryt</button>
          </div>
        </div>
        :
        <div className="log-details">
          <h2 className='title'>{title}</h2>
          <p className='date'>{date}</p>
          <div className='message'>{message}</div>
        </div>
      }
      {file &&
        <>
          <div className='file'>
            <img
              className='image'
              src={`./images/${file}`}
              alt="Uploaded file"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowImageModal(true)}
            />
          </div>
          {showImageModal && (
            <div className="image-modal" onClick={() => setShowImageModal(false)}>
              <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <img
                  src={`./images/${file}`}
                  alt="Popup"
                  style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block', margin: '0 auto' }}
                />
                <button className="close-modal" onClick={() => setShowImageModal(false)}>Stäng</button>
              </div>
            </div>
          )}
        </>
      }
      {
        !isEditing &&
        <>
          <div className='edit'>
            <button className='edit-button' onClick={handleEdit}>E</button>
          </div>
          <div className='delete'>
            {isDeleting ? (
              <div className='confirm-delete-container'>
                <button className='confirm-delete-button confirm-button' onClick={confirmDelete}>Radera</button>
                <button className='confirm-delete-button cancel-button' onClick={handleCancelDelete}>Avbryt</button>
              </div>
            ) : (
              <button className='delete-button' onClick={handleDelete}>X</button>
            )}
          </div>
        </>
      }
    </div>
  )
}
