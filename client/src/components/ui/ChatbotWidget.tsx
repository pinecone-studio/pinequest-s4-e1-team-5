import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  solveTutorProblem,
  type TutorSolveResponse,
  type TutorSubject
} from '../../lib/api';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  details?: {
    formula?: string;
    steps?: string[];
  };
  status?: 'error';
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Сайн уу. Бодлогоо бичээд явуулаарай, би алхмаар тайлбарлая.'
  }
];

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toAssistantMessage(result: TutorSolveResponse): ChatMessage {
  return {
    id: createMessageId(),
    role: 'assistant',
    text: result.answer.finalAnswer,
    details: {
      formula: result.answer.formulaUsed,
      steps: result.answer.solutionSteps.slice(0, 3)
    }
  };
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState<TutorSubject>('math');
  const [grade, setGrade] = useState(11);
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const el = messagesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [isOpen, messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problem = draft.trim();
    if (!problem || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      text: problem
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setIsSending(true);

    try {
      const result = await solveTutorProblem({
        problem,
        grade,
        subject
      });
      setMessages((current) => [...current, toAssistantMessage(result)]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Tutor solve request failed';
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          status: 'error',
          text: `${message}. Server log, API key, DB, Wolfram тохиргоог шалгаарай.`
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className={`chatbot-widget ${isOpen ? 'open' : ''}`} aria-label="AI Tutor chat">
      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-label="AI Tutor">
          <header className="chatbot-header">
            <div>
              <strong>AI Tutor</strong>
              <span>Бүх өрөөнд туслах чат</span>
            </div>
            <button
              aria-label="Close AI Tutor"
              className="chatbot-icon-button"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </header>

          <div className="chatbot-messages" ref={messagesRef}>
            {messages.map((message) => (
              <article
                className={`chatbot-message ${message.role} ${message.status ?? ''}`}
                key={message.id}
              >
                <p>{message.text}</p>
                {message.details?.formula && (
                  <small>Томьёо: {message.details.formula}</small>
                )}
                {message.details?.steps && message.details.steps.length > 0 && (
                  <ol>
                    {message.details.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                )}
              </article>
            ))}
            {isSending && (
              <article className="chatbot-message assistant pending">
                <p>Бодож байна...</p>
              </article>
            )}
          </div>

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <div className="chatbot-controls">
              <label>
                <span>Subject</span>
                <select
                  value={subject}
                  onChange={(event) => setSubject(event.target.value as TutorSubject)}
                >
                  <option value="math">Math</option>
                  <option value="physics">Physics</option>
                  <option value="geometry">Geometry</option>
                  <option value="chemistry">Chemistry</option>
                </select>
              </label>
              <label>
                <span>Grade</span>
                <input
                  max={12}
                  min={1}
                  onChange={(event) => setGrade(Number(event.target.value) || 11)}
                  type="number"
                  value={grade}
                />
              </label>
            </div>

            <textarea
              aria-label="Chat message"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Бодлогоо энд бич..."
              rows={3}
              value={draft}
            />

            <button disabled={!draft.trim() || isSending} type="submit">
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <button
        aria-expanded={isOpen}
        aria-label="Open AI Tutor chat"
        className="chatbot-toggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        AI Tutor
      </button>
    </aside>
  );
}
