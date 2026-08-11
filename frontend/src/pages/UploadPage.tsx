import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, X, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadDataset } from '../services/api';
import type { UploadResponse } from '../services/api';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Reset state
    setResult(null);
    
    // UX pre-check
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setResult({
        error: 'Invalid File Type',
        message: 'Please select a valid CSV file.'
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    
    setIsValidating(true);
    setResult(null);
    
    try {
      const response = await uploadDataset(selectedFile);
      setResult(response);
    } catch (err) {
      console.error('Validation request failed', err);
      setResult({
        error: 'Validation Failed',
        message: 'Unable to communicate with the validation server. Please try again later.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="header-flex" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <UploadCloud size={28} className="text-primary" /> Data Upload & Validation
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', margin: 0 }}>
          Validate a CustomerPulse-compatible CSV payload without mutating production.
        </p>
      </div>

      {/* Safety Notice */}
      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <ShieldAlert size={20} className="text-danger" />
        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
          <strong>Validation Only:</strong> This upload mechanism performs authoritative schema validation only. The production MySQL database and ML pipelines will <strong>not</strong> be modified.
        </p>
      </div>

      {/* Upload Zone */}
      {!selectedFile && !result?.error && (
        <div 
          className={`card ${isDragging ? 'drag-active' : ''}`}
          style={{
            border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'var(--card-bg)'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
          <UploadCloud size={48} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Drag & Drop CSV here</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>or click to browse your files</p>
          <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Choose CSV
          </button>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '1.5rem', opacity: 0.7 }}>
            Maximum file type: CSV
          </p>
        </div>
      )}

      {/* Selected File State */}
      {selectedFile && !result && !isValidating && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
            <FileText size={32} className="text-primary" />
            <div style={{ flexGrow: 1 }}>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>{selectedFile.name}</h4>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{formatFileSize(selectedFile.size)} • CSV File</p>
            </div>
            <button 
              className="btn-icon text-muted" 
              onClick={clearSelection}
              aria-label="Remove file"
            >
              <X size={20} />
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn-secondary" onClick={clearSelection}>Cancel</button>
            <button className="btn-primary" onClick={handleValidate}>Validate CSV</button>
          </div>
        </div>
      )}

      {/* Validating State */}
      {isValidating && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Activity size={48} className="spinner text-primary" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Validating CSV...</h3>
          <p className="text-muted">Analyzing file schema and row count against CustomerPulse requirements.</p>
        </div>
      )}

      {/* Result States */}
      {result && !isValidating && (
        <div className={`card`} style={{ borderTop: `4px solid ${result.error ? 'var(--danger-color)' : 'var(--success-color)'}` }}>
          
          {/* Success */}
          {result.status === 'success' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <CheckCircle2 size={32} className="text-success" />
                <h2 style={{ margin: 0 }}>Validation Successful</h2>
              </div>
              
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="text-muted">File:</span>
                  <span className="fw-500">{selectedFile?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="text-muted">Valid Rows Found:</span>
                  <span className="fw-500">{result.row_count?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="text-muted">Schema Validation:</span>
                  <span className="fw-500 text-success">✓ Passed</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Status:</span>
                  <span className="fw-500">{result.message}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn-secondary" onClick={clearSelection}>Upload Another File</button>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/dashboard')}>
                  Go to Dashboard <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            /* Error */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <AlertCircle size={32} className="text-danger" />
                <h2 style={{ margin: 0 }}>{result.error || 'Validation Failed'}</h2>
              </div>
              
              <div style={{ padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{result.message}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={clearSelection}>Try Different File</button>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default UploadPage;
