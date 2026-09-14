import { useState } from 'react';

export default function App() {
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);

  async function checkAnswer(event) {
    event.preventDefault(); // Submit with JavaScript without reloading the page.
    setChecking(true);
    setMessage('');

    try {
      const response = await fetch(`/api/check?answer=${encodeURIComponent(answer)}`);
      if (!response.ok) throw new Error('Request failed');
      const result = await response.json();
      setMessage(result.message);
    } catch {
      setMessage('Could not check your answer. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <main>
      <p className="subject">MATH PRACTICE</p>
      <h1>My first worksheet</h1>
      <p>Let's practice adding two numbers.</p>

      <form onSubmit={checkAnswer}>
        <label htmlFor="answer">2 + 3 = ?</label>
        <input
          id="answer"
          name="answer"
          type="number"
          step="1"
          placeholder="Your answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={checking}
          required
        />
        <button type="submit" disabled={checking}>
          {checking ? 'Checking...' : 'Check answer'}
        </button>
      </form>

      <p role="status" className={message ? 'feedback' : undefined}>{message}</p>
      <a href="/">Start again</a>
    </main>
  );
}
