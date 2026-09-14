import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './style.css';

// Places the React page inside the root element in index.html.
createRoot(document.getElementById('root')).render(<App />);
