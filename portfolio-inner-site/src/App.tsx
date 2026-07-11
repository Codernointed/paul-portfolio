import './App.css';
import { Analytics } from '@vercel/analytics/react';
import Desktop from './components/os/Desktop';

function App() {
    return (
        <div className="App">
            <Desktop />
            <Analytics />
        </div>
    );
}

export default App;
