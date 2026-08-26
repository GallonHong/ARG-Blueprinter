import React, { useRef } from 'react';

export function ImageUpload({ value, onChange, label, placeholder = '上传图片或输入 URL', size = 36, shape = 'square' }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const isImage = typeof value === 'string' && (
    value.startsWith('data:image/') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('blob:') ||
    ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'].some(ext => value.split('?')[0].toLowerCase().endsWith(ext))
  );

  return (
    <div className="image-upload-widget" style={{ marginTop: 6, marginBottom: 8 }}>
      {label && <label style={{ fontSize: 10, display: 'block', marginBottom: 3, fontWeight: 'bold', color: '#4a5568' }}>{label}</label>}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {isImage ? (
          <div style={{
            width: size,
            height: size,
            borderRadius: shape === 'circle' ? '50%' : 4,
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            background: '#f1f5f9',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{
            width: size,
            height: size,
            borderRadius: shape === 'circle' ? '50%' : 4,
            border: '1px dashed #cbd5e1',
            background: '#f8fafc',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.5
          }}>
            {value || '🖼️'}
          </div>
        )}
        <input
          style={{ flex: 1, fontSize: 12, padding: '5px 8px' }}
          placeholder={placeholder}
          value={isImage ? value : ''}
          onChange={e => onChange(e.target.value)}
        />
        <input
          type="file"
          accept="image/*,.ico"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="ghost"
          style={{ fontSize: 11, padding: '5px 8px', whiteSpace: 'nowrap' }}
          onClick={() => fileInputRef.current?.click()}
          title="上传本地图片（自动转为 Base64 嵌入）"
        >
          📁 上传
        </button>
        {isImage && (
          <button
            type="button"
            className="rule-remove"
            style={{ fontSize: 12 }}
            onClick={() => onChange('')}
            title="清除图片"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
