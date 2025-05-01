import React, { useState, useEffect } from 'react';
import './Documents.css'; // Import the CSS file
import { 
  File, Upload, Trash2, Eye, Download, Search, 
  Bell, Calendar, CheckSquare, FileText, Settings, 
  LogOut, Filter, AlertCircle, Clock, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

const Documents = () => {
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Offer Letter.pdf', uploadedDate: '2025-04-15', type: 'Contract', size: '420 KB' },
    { id: 2, name: 'ID Card.jpg', uploadedDate: '2025-03-22', type: 'ID Proof', size: '1.2 MB' },
    { id: 3, name: 'Performance Review Q1.pdf', uploadedDate: '2025-04-10', type: 'Review', size: '580 KB' },
    { id: 4, name: 'Medical Insurance.pdf', uploadedDate: '2025-01-30', type: 'Medical', size: '890 KB' },
    { id: 5, name: 'Emergency Contact.docx', uploadedDate: '2025-02-18', type: 'Personal', size: '340 KB' },
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update time every minute
    
    return () => clearInterval(timer);
  }, []);

  const handleFileUpload = (e) => {
    if (e.target.files.length > 0) {
      setIsUploading(true);
      // Simulate upload process
      setTimeout(() => {
        const file = e.target.files[0];
        const newDoc = {
          id: documents.length + 1,
          name: file.name,
          uploadedDate: new Date().toISOString().split('T')[0],
          type: getFileType(file.name),
          size: formatFileSize(file.size || 1024 * 1024)
        };
        
        setDocuments([newDoc, ...documents]);
        setIsUploading(false);
        showToastNotification('Document uploaded successfully!');
      }, 1500);
    }
  };

  const getFileType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'Contract';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'ID Proof';
    if (['doc', 'docx'].includes(ext)) return 'Personal';
    if (['xls', 'xlsx'].includes(ext)) return 'Medical';
    return 'Review';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = (id) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    showToastNotification('Document deleted successfully!');
  };

  const handlePreview = (document) => {
    setPreviewDocument(document);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewDocument(null);
  };

  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const filteredDocuments = documents.filter(doc => {
    let matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesType = selectedType === 'All Types' || doc.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrentDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
    <Navbar />
    <div className="documents-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <h1 className="logo">HRSystem</h1>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="nav-item" style={{ "--animation-order": 1 }}>
          <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div className="icon-container">🏠</div>
            <span>Dashboard</span>
          </Link>
          </a>
          
          <a href="#" className="nav-item" style={{ "--animation-order": 2 }}>
          <Link to="/attendance" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div className="icon-container">📅</div>
            <span>Attendance</span>
          </Link>
          </a>
          
          <a href="#" className="nav-item" style={{ "--animation-order": 3 }}>
          <Link to="/tasks" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div className="icon-container">📝</div>
            <span>Tasks</span>
          </Link>
          </a>
          
          <a href="#" className="nav-item" style={{ "--animation-order": 4 }}>
          <Link to="/calendar" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div className="icon-container">🗓️</div>
            <span>Calendar</span>
          </Link>
          </a>
          
          <a href="#" className="nav-item active" style={{ "--animation-order": 5 }}>
          <Link to="/documents" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div className="icon-container">📄</div>
            <span>Documents</span>
          </Link>
          </a>
          
          <a href="#" className="nav-item" style={{ "--animation-order": 6 }}>
          <Link to="/notifications" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div className="icon-container">🔔</div>
            <span>Notifications</span>
          </Link>
          </a>
          
          <a href="#" className="nav-item" style={{ "--animation-order": 7 }}>
          <Link to="/settings" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div className="icon-container">⚙️</div>
            <span>Settings</span>
          </Link>
          </a>
        </nav>
        
        <div className="logout-container">
          <a href="#" className="nav-item">
            <div className="icon-container">🚪</div>
            <span>Logout</span>
          </a>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        
        
        {/* Documents Content */}
        <main className="documents-content">
          <div className="welcome-banner">
            <div className="banner-content">
              <h1 className="banner-title">Documents</h1>
              <p className="banner-subtitle">Upload, view and manage your important documents</p>
              
              <div className="upload-section">
                <label htmlFor="file-upload" className="upload-button">
                  {isUploading ? (
                    <>
                      <div className="loading-animation"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="upload-icon" />
                      Upload New Document
                    </>
                  )}
                </label>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden-input" 
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.png,.docx"
                  disabled={isUploading}
                />
                <div className="upload-info">
                  Allowed formats: .pdf, .jpg, .png, .docx (Max size: 5MB)
                </div>
              </div>
            </div>
            
            <div className="banner-decoration">
              <FileText size={120} className="banner-icon" />
            </div>
          </div>
          
          <div className="documents-table-container">
            <div className="table-header">
              <h2 className="section-title">All Documents</h2>
              
              <div className="filters">
                <div className="search-documents">
                  <input 
                    type="text" 
                    placeholder="Search documents..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={18} className="search-icon" />
                </div>
                
                <select 
                  className="type-filter"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option>All Types</option>
                  <option>Contract</option>
                  <option>ID Proof</option>
                  <option>Medical</option>
                  <option>Personal</option>
                  <option>Review</option>
                </select>
              </div>
            </div>
            
            <div className="table-wrapper">
              {filteredDocuments.length > 0 ? (
                <table className="documents-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Upload Date</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="document-row" data-type={doc.type}>
                        <td className="document-name">
                          <File size={20} className="document-icon" />
                          <span>{doc.name}</span>
                        </td>
                        <td className="document-date">{formatDate(doc.uploadedDate)}</td>
                        <td className="document-type">
                          <span className="type-badge">{doc.type}</span>
                        </td>
                        <td className="document-size">{doc.size}</td>
                        <td className="document-actions">
                          <button 
                            className="action-button view-button" 
                            title="View"
                            onClick={() => handlePreview(doc)}
                          >
                            <Eye size={16} />
                          </button>
                          <button className="action-button download-button" title="Download">
                            <Download size={16} />
                          </button>
                          <button 
                            className="action-button delete-button" 
                            title="Delete"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <h3 className="empty-state-title">No documents found</h3>
                  <p className="empty-state-text">
                    Try uploading a new document or changing your search criteria.
                  </p>
                  <label htmlFor="empty-file-upload" className="empty-state-button">
                    <Plus size={16} className="mr-2" />
                    Upload Document
                  </label>
                  <input 
                    id="empty-file-upload" 
                    type="file" 
                    className="hidden-input" 
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.png,.docx"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="activity-container">
            <div className="activity-header">
              <h2 className="section-title">Recent Activities</h2>
              <button className="view-all-button">View All</button>
            </div>
            
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon upload-activity">
                  <Upload size={18} />
                </div>
                <div className="activity-details">
                  <p className="activity-text">You uploaded Medical Insurance.pdf</p>
                  <p className="activity-time">Today, 10:45 AM</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon download-activity">
                  <Download size={18} />
                </div>
                <div className="activity-details">
                  <p className="activity-text">You downloaded Performance Review Q1.pdf</p>
                  <p className="activity-time">Yesterday, 3:20 PM</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon delete-activity">
                  <Trash2 size={18} />
                </div>
                <div className="activity-details">
                  <p className="activity-text">You deleted Outdated Policy.docx</p>
                  <p className="activity-time">April 26, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Document Preview Modal */}
      {isPreviewOpen && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{previewDocument?.name}</h3>
              <button className="close-button" onClick={closePreview}>×</button>
            </div>
            <div className="preview-body">
              <div className="preview-placeholder">
                <FileText size={64} />
                <p>Preview not available. Please download the document to view it.</p>
              </div>
            </div>
            <div className="preview-footer">
              <button className="download-button">
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-icon">✓</div>
          <div className="toast-message">{toastMessage}</div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Documents;