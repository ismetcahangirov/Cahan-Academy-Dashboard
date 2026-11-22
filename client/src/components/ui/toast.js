// react-hot-toast options for the ornate theme (used by <Toaster> in App.jsx).
// Pages keep calling toast.success / toast.error / toast(...) as before.
// Success and error icons are both drawn in wine/white tones; the meaning is carried by the icon
// shape (check vs cross) and the message text, never by green/red.
export const toastOptions = {
  className: 'toast-ornate',
  duration: 4000,
  style: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: '1px solid var(--line-strong)',
    boxShadow: 'var(--shadow-md)',
    maxWidth: '420px',
  },
  success: {
    iconTheme: { primary: '#5C000E', secondary: '#FFFFFF' },
  },
  error: {
    iconTheme: { primary: '#5C000E', secondary: '#FFFFFF' },
    style: { borderWidth: '1.5px', borderColor: 'var(--accent-text)', fontWeight: 600 },
  },
};
