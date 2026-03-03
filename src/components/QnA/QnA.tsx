'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowUp, ArrowDown, MessageCircle, Check, Search, Plus, Code, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ---------- types ---------- */
interface Author {
  _id: string;
  fullName?: string;
  username?: string;
}

interface CodeSnippet {
  language: string;
  code: string;
}

interface QuestionData {
  _id: string;
  title: string;
  body: string;
  tags?: string[];
  subject?: string;
  codeSnippet?: CodeSnippet;
  status?: string;
  upvotes?: string[];
  downvotes?: string[];
  answerCount?: number;
  views?: number;
  isAnonymous?: boolean;
  anonymousId?: string;
  author?: Author;
  createdAt: string;
}

interface AnswerData {
  _id: string;
  body: string;
  codeSnippet?: CodeSnippet;
  upvotes?: string[];
  downvotes?: string[];
  isAccepted?: boolean;
  isAnonymous?: boolean;
  anonymousId?: string;
  author?: Author;
  createdAt: string;
}

interface TagInfo {
  _id: string;
  count: number;
}

interface FilterState {
  status: string;
  sort: string;
  search: string;
}

interface CurrentUser {
  _id: string;
  [key: string]: any;
}

/* ---------- main component ---------- */
const QnA = () => {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [filter, setFilter] = useState<FilterState>({ status: 'open', sort: 'newest', search: '' });
  const [tags, setTags] = useState<TagInfo[]>([]);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const currentUser: CurrentUser =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || '{}')
      : { _id: '' };

  const axiosConfig = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  useEffect(() => {
    fetchQuestions();
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams(filter as unknown as Record<string, string>).toString();
      const { data } = await axios.get(`/api/qna?${params}`, axiosConfig());
      setQuestions(data.questions);
    } catch {
      toast.error('Failed to load questions');
    }
  };

  const fetchTags = async () => {
    try {
      const { data } = await axios.get('/api/qna/tags', axiosConfig());
      setTags(data.tags);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchQuestion = async (questionId: string) => {
    try {
      const { data } = await axios.get(`/api/qna/${questionId}`, axiosConfig());
      setSelectedQuestion(data.question);
      setAnswers(data.answers);
    } catch {
      toast.error('Failed to load question');
    }
  };

  const createQuestion = async (formData: Record<string, any>) => {
    try {
      await axios.post('/api/qna', formData, axiosConfig());
      toast.success('Question posted successfully');
      setShowAskModal(false);
      fetchQuestions();
    } catch {
      toast.error('Failed to post question');
    }
  };

  const voteQuestion = async (questionId: string, voteType: string) => {
    try {
      await axios.post(`/api/qna/${questionId}/vote`, { voteType }, axiosConfig());
      if (selectedQuestion) fetchQuestion(questionId);
      fetchQuestions();
    } catch {
      toast.error('Failed to vote');
    }
  };

  const createAnswer = async (formData: Record<string, any>) => {
    try {
      await axios.post(`/api/qna/${selectedQuestion!._id}/answers`, formData, axiosConfig());
      toast.success('Answer posted successfully');
      setShowAnswerModal(false);
      fetchQuestion(selectedQuestion!._id);
    } catch {
      toast.error('Failed to post answer');
    }
  };

  const voteAnswer = async (answerId: string, voteType: string) => {
    try {
      await axios.post(`/api/qna/answers/${answerId}/vote`, { voteType }, axiosConfig());
      fetchQuestion(selectedQuestion!._id);
    } catch {
      toast.error('Failed to vote');
    }
  };

  const acceptAnswer = async (answerId: string) => {
    try {
      await axios.post(`/api/qna/answers/${answerId}/accept`, {}, axiosConfig());
      toast.success('Answer accepted');
      fetchQuestion(selectedQuestion!._id);
    } catch {
      toast.error('Failed to accept answer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Q&amp;A Forum</h1>
            <p className="text-gray-600 dark:text-gray-400">Ask questions, share knowledge</p>
          </div>
          <button
            onClick={() => setShowAskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Ask Question
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search questions..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="flex-1 min-w-[300px] px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="all">All Questions</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filter.sort}
            onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
            className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>

        {/* Popular Tags */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 10).map((tag, idx) => (
              <button
                key={idx}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                {tag._id} ({tag.count})
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {!selectedQuestion ? (
          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionCard
                key={question._id}
                question={question}
                onVote={voteQuestion}
                onClick={() => fetchQuestion(question._id)}
              />
            ))}
          </div>
        ) : (
          <QuestionDetail
            question={selectedQuestion}
            answers={answers}
            currentUser={currentUser}
            onVote={voteQuestion}
            onVoteAnswer={voteAnswer}
            onAcceptAnswer={acceptAnswer}
            onBack={() => setSelectedQuestion(null)}
            onAnswer={() => setShowAnswerModal(true)}
          />
        )}

        {/* Ask Question Modal */}
        {showAskModal && <AskQuestionModal onCreate={createQuestion} onClose={() => setShowAskModal(false)} />}

        {/* Answer Modal */}
        {showAnswerModal && <AnswerModal onCreate={createAnswer} onClose={() => setShowAnswerModal(false)} />}
      </div>
    </div>
  );
};

/* ---------- QuestionCard ---------- */
interface QuestionCardProps {
  question: QuestionData;
  onVote: (questionId: string, voteType: string) => void;
  onClick: () => void;
}

const QuestionCard = ({ question, onVote, onClick }: QuestionCardProps) => {
  const voteScore = (question.upvotes?.length || 0) - (question.downvotes?.length || 0);
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition cursor-pointer">
      <div className="flex gap-4">
        {/* Vote Section */}
        <div className="flex flex-col items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onVote(question._id, 'up'); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ArrowUp size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="font-semibold text-lg text-gray-900 dark:text-white">{voteScore}</span>
          <button onClick={(e) => { e.stopPropagation(); onVote(question._id, 'down'); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ArrowDown size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1" onClick={onClick}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600">{question.title}</h3>
            {question.status === 'resolved' && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                <Check size={14} /> Resolved
              </span>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{question.body}</p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-4 text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><MessageCircle size={16} /> {question.answerCount} answers</span>
              <span>{question.views} views</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {question.tags?.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">{tag}</span>
              ))}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Asked by {question.isAnonymous ? question.anonymousId : (
              <span
                className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                onClick={(e) => { e.stopPropagation(); if (question.author?.username) router.push(`/user/${question.author.username}`); }}
              >
                {question.author?.fullName || question.author?.username}
              </span>
            )} &bull; {new Date(question.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- QuestionDetail ---------- */
interface QuestionDetailProps {
  question: QuestionData;
  answers: AnswerData[];
  currentUser: CurrentUser;
  onVote: (questionId: string, voteType: string) => void;
  onVoteAnswer: (answerId: string, voteType: string) => void;
  onAcceptAnswer: (answerId: string) => void;
  onBack: () => void;
  onAnswer: () => void;
}

const QuestionDetail = ({ question, answers, currentUser, onVote, onVoteAnswer, onAcceptAnswer, onBack, onAnswer }: QuestionDetailProps) => {
  const voteScore = (question.upvotes?.length || 0) - (question.downvotes?.length || 0);
  const isAuthor = question.author?._id === currentUser._id;
  const router = useRouter();

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-blue-600 hover:underline">&larr; Back to questions</button>

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => onVote(question._id, 'up')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ArrowUp size={24} /></button>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">{voteScore}</span>
            <button onClick={() => onVote(question._id, 'down')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ArrowDown size={24} /></button>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{question.title}</h2>
            <div className="prose dark:prose-invert max-w-none mb-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{question.body}</p>
            </div>

            {question.codeSnippet?.code && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code size={16} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{question.codeSnippet.language}</span>
                </div>
                <SyntaxHighlighter language={question.codeSnippet.language} style={vscDarkPlus} customStyle={{ borderRadius: '8px' }}>
                  {question.codeSnippet.code}
                </SyntaxHighlighter>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags?.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">{tag}</span>
              ))}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Asked by {question.isAnonymous ? question.anonymousId : (
                <span
                  className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                  onClick={() => { if (question.author?.username) router.push(`/user/${question.author.username}`); }}
                >
                  {question.author?.fullName || question.author?.username}
                </span>
              )} &bull; {new Date(question.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{answers.length} Answers</h3>
          <button onClick={onAnswer} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Write Answer</button>
        </div>
        <div className="space-y-4">
          {answers.map((answer) => (
            <AnswerCard key={answer._id} answer={answer} isAuthor={isAuthor} onVote={onVoteAnswer} onAccept={onAcceptAnswer} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- AnswerCard ---------- */
interface AnswerCardProps {
  answer: AnswerData;
  isAuthor: boolean;
  onVote: (answerId: string, voteType: string) => void;
  onAccept: (answerId: string) => void;
}

const AnswerCard = ({ answer, isAuthor, onVote, onAccept }: AnswerCardProps) => {
  const voteScore = (answer.upvotes?.length || 0) - (answer.downvotes?.length || 0);
  const router = useRouter();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${answer.isAccepted ? 'border-2 border-green-500' : ''}`}>
      <div className="flex gap-6">
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => onVote(answer._id, 'up')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ArrowUp size={20} /></button>
          <span className="font-semibold text-xl text-gray-900 dark:text-white">{voteScore}</span>
          <button onClick={() => onVote(answer._id, 'down')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ArrowDown size={20} /></button>
          {isAuthor && !answer.isAccepted && (
            <button onClick={() => onAccept(answer._id)} className="mt-2 p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Accept answer">
              <Check size={20} />
            </button>
          )}
        </div>

        <div className="flex-1">
          {answer.isAccepted && (
            <div className="flex items-center gap-2 mb-3 text-green-600 font-semibold"><Check size={20} /> Accepted Answer</div>
          )}
          <div className="prose dark:prose-invert max-w-none mb-4">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{answer.body}</p>
          </div>
          {answer.codeSnippet?.code && (
            <div className="mb-4">
              <SyntaxHighlighter language={answer.codeSnippet.language} style={vscDarkPlus} customStyle={{ borderRadius: '8px' }}>
                {answer.codeSnippet.code}
              </SyntaxHighlighter>
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Answered by {answer.isAnonymous ? answer.anonymousId : (
              <span
                className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                onClick={() => { if (answer.author?.username) router.push(`/user/${answer.author.username}`); }}
              >
                {answer.author?.fullName || answer.author?.username}
              </span>
            )} &bull; {new Date(answer.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- AskQuestionModal ---------- */
interface AskQuestionModalProps {
  onCreate: (formData: Record<string, any>) => void;
  onClose: () => void;
}

interface AskFormState {
  title: string;
  body: string;
  codeSnippet: CodeSnippet;
  tags: string;
  subject: string;
  isAnonymous: boolean;
}

const AskQuestionModal = ({ onCreate, onClose }: AskQuestionModalProps) => {
  const [formData, setFormData] = useState<AskFormState>({
    title: '',
    body: '',
    codeSnippet: { language: 'javascript', code: '' },
    tags: '',
    subject: '',
    isAnonymous: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      codeSnippet: formData.codeSnippet.code ? formData.codeSnippet : null,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ask a Question</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's your question?"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Description</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Provide more details..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Code (Optional)</label>
            <select
              value={formData.codeSnippet.language}
              onChange={(e) => setFormData({ ...formData, codeSnippet: { ...formData.codeSnippet, language: e.target.value } })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="csharp">C#</option>
              <option value="typescript">TypeScript</option>
            </select>
            <textarea
              value={formData.codeSnippet.code}
              onChange={(e) => setFormData({ ...formData, codeSnippet: { ...formData.codeSnippet, code: e.target.value } })}
              placeholder="Paste your code here..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              rows={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Data Structures"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="java, algorithms, recursion"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium text-gray-900 dark:text-white">Post anonymously</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Post Question</button>
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- AnswerModal ---------- */
interface AnswerModalProps {
  onCreate: (formData: Record<string, any>) => void;
  onClose: () => void;
}

interface AnswerFormState {
  body: string;
  codeSnippet: CodeSnippet;
  isAnonymous: boolean;
}

const AnswerModal = ({ onCreate, onClose }: AnswerModalProps) => {
  const [formData, setFormData] = useState<AnswerFormState>({
    body: '',
    codeSnippet: { language: 'javascript', code: '' },
    isAnonymous: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      codeSnippet: formData.codeSnippet.code ? formData.codeSnippet : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Write Your Answer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Your Answer</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Share your knowledge..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Code (Optional)</label>
            <select
              value={formData.codeSnippet.language}
              onChange={(e) => setFormData({ ...formData, codeSnippet: { ...formData.codeSnippet, language: e.target.value } })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            <textarea
              value={formData.codeSnippet.code}
              onChange={(e) => setFormData({ ...formData, codeSnippet: { ...formData.codeSnippet, code: e.target.value } })}
              placeholder="Paste your code here..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              rows={8}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium text-gray-900 dark:text-white">Answer anonymously</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Post Answer</button>
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QnA;
