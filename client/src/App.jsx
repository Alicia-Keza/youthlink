import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

function Home() {
  return (
    <section>
      <h1>YouthLink</h1>
      <p>Transforming ideas into real businesses through youth collaboration.</p>
    </section>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
