import { useState } from 'react'
import './Daylog.css'

export default function DayLog({ title, date, message, files = [], onDelete, onUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

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
  const [editedFiles, setEditedFiles] = useState(Array.isArray(files) ? files : (files ? [files] : []));
  const [newFiles, setNewFiles] = useState([]); // File objects to upload
  const [removedFiles, setRemovedFiles] = useState([]);

  const handleEdit = () => {
    if (!isEditing) {
      // Sync edit fields with current props when opening editor
      setEditedTitle(title);
      setEditedDate(date);
      setEditedMessage(message);
      setEditedFiles(Array.isArray(files) ? files : (files ? [files] : []));
      setNewFiles([]);
      setRemovedFiles([]);
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    const payload = { title: editedTitle, date: editedDate, message: editedMessage, files: editedFiles };
    onUpdate(payload, { newFiles, removed: removedFiles });
    setIsEditing(false);
    setNewFiles([]);
    setRemovedFiles([]);
  };

  const onAddNewFiles = (fileList) => {
    const arr = Array.from(fileList || []);
    if (arr.length === 0) return;
    setNewFiles(prev => [...prev, ...arr]);
  };

  const removeExisting = (name) => {
    setEditedFiles(prev => prev.filter(f => f !== name));
    setRemovedFiles(prev => [...prev, name]);
  };

  return (
    <div className="day-log">
      {isEditing ?
        <div className="edit-container">
          <input className='edit-title' type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
          <input className='edit-date' type="date" value={editedDate} onChange={(e) => setEditedDate(e.target.value)} />
          <textarea className='edit-message' value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} />
          <div style={{ gridArea: 'file' }}>
            <input className='edit-file' type="file" accept="image/*" multiple onChange={(e) => onAddNewFiles(e.target.files)} />
            {newFiles.length > 0 && (
              <div style={{ marginTop: '.5rem', color: '#555' }}>{newFiles.length} ny(a) bild(er) kommer att laddas upp</div>
            )}
          </div>
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
      {(Array.isArray(files) && files.length > 0) || (isEditing && editedFiles.length > 0) ? (
        <>
          <div className='file'>
            <div className='file-grid' >
              {(
                isEditing ? editedFiles : files
              ).map((name, idx) => (
                <div key={name + idx} style={{ position: 'relative' }}>
                  <img
                    className='image'
                    src={`http://localhost:3001/images/${name}`}
                    alt={name}
                    onClick={() => { setModalIndex(idx); setShowImageModal(true); }}
                  />
                  {isEditing && (
                    <button
                      type="button"
                      title="Ta bort bild"
                      onClick={(e) => { e.stopPropagation(); removeExisting(name); }}
                      style={{ position: 'absolute', top: 6, right: 6, background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {showImageModal && (
            <div className="image-modal" onClick={() => setShowImageModal(false)}>
              <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <img
                  src={`http://localhost:3001/images/${(isEditing ? editedFiles : files)[modalIndex]}`}
                  alt={(isEditing ? editedFiles : files)[modalIndex]}
                  style={{ maxWidth: '100%', maxHeight: '85vh', display: 'block', margin: '0 auto' }}
                />
                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                  <button className="close-modal" onClick={() => setModalIndex((modalIndex - 1 + (isEditing ? editedFiles.length : files.length)) % (isEditing ? editedFiles.length : files.length))}>Föregående</button>
                  <button className="close-modal" onClick={() => setModalIndex((modalIndex + 1) % (isEditing ? editedFiles.length : files.length))}>Nästa</button>
                  <button className="close-modal" onClick={() => setShowImageModal(false)}>Stäng</button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
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
