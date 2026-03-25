import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Flame, Star, BookOpen, Trophy, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const LEVELS = [
  { name: 'Rookie', min: 0, color: 'text-gray-500', bg: 'bg-gray-100' },
  { name: 'Learner', min: 50, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Trader', min: 150, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'Analyst', min: 350, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { name: 'Expert', min: 700, color: 'text-green-600', bg: 'bg-green-100' },
];

function getLevel(pts) {
  return [...LEVELS].reverse().find(l => pts >= l.min) || LEVELS[0];
}

function getNextLevel(pts) {
  return LEVELS.find(l => l.min > pts) || null;
}

export default function Learning() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [streakMessage, setStreakMessage] = useState('');

  useEffect(() => {
    if (user) initProgress();
  }, [user]);

  const initProgress = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const records = await base44.entities.UserProgress.filter({ created_by: user.email });
    let record = records[0];

    if (!record) {
      record = await base44.entities.UserProgress.create({
        knowledge_points: 0,
        streak_days: 1,
        last_login_date: today,
        quizzes_completed: 0,
      });
      setStreakMessage('🎉 Welcome! Your streak starts today!');
    } else if (record.last_login_date !== today) {
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      const newStreak = record.last_login_date === yesterday ? (record.streak_days || 0) + 1 : 1;
      record = await base44.entities.UserProgress.update(record.id, {
        last_login_date: today,
        streak_days: newStreak,
      });
      setStreakMessage(newStreak > 1 ? `🔥 ${newStreak}-day streak! Keep it up!` : '👋 Streak reset. Come back daily to build it up!');
    }
    setProgress(record);
  };

  const generateQuiz = async () => {
    setLoadingQuiz(true);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setEarnedPoints(0);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: 'Generate 3 multiple-choice quiz questions about stock market concepts or recent financial market news. Each question should have 4 options (A, B, C, D) and one correct answer. Make questions educational and suitable for beginner investors.',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'object', properties: { A: { type: 'string' }, B: { type: 'string' }, C: { type: 'string' }, D: { type: 'string' } } },
                correct: { type: 'string' },
                explanation: { type: 'string' }
              }
            }
          }
        }
      }
    });
    setQuiz(res);
    setLoadingQuiz(false);
  };

  const submitQuiz = async () => {
    if (!quiz || !progress) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    const pts = correct * 10;
    setEarnedPoints(pts);
    setSubmitted(true);
    const updated = await base44.entities.UserProgress.update(progress.id, {
      knowledge_points: (progress.knowledge_points || 0) + pts,
      quizzes_completed: (progress.quizzes_completed || 0) + 1,
      last_quiz_date: today,
    });
    setProgress(updated);
  };

  const alreadyQuizzedToday = progress?.last_quiz_date === format(new Date(), 'yyyy-MM-dd') && submitted === false && quiz === null;
  const level = progress ? getLevel(progress.knowledge_points || 0) : LEVELS[0];
  const nextLevel = progress ? getNextLevel(progress.knowledge_points || 0) : LEVELS[1];
  const ptsToNext = nextLevel ? nextLevel.min - (progress?.knowledge_points || 0) : 0;
  const levelPct = nextLevel
    ? Math.round(((progress?.knowledge_points || 0) - getLevel(progress?.knowledge_points || 0).min) / (nextLevel.min - getLevel(progress?.knowledge_points || 0).min) * 100)
    : 100;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Build your investing knowledge every day</p>
      </div>

      {streakMessage && (
        <div className="bg-accent/20 border border-accent/40 rounded-xl px-4 py-3 text-sm font-medium text-foreground">
          {streakMessage}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{progress?.streak_days || 0}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{progress?.knowledge_points || 0}</p>
          <p className="text-xs text-muted-foreground">Knowledge Points</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{progress?.quizzes_completed || 0}</p>
          <p className="text-xs text-muted-foreground">Quizzes Done</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${level.bg} border-transparent`}>
          <Trophy className={`w-6 h-6 mx-auto mb-1 ${level.color}`} />
          <p className={`text-lg font-bold ${level.color}`}>{level.name}</p>
          <p className="text-xs text-muted-foreground">Current Level</p>
        </div>
      </div>

      {/* Level progress */}
      {nextLevel && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Progress to <span className={`font-bold ${getLevel((progress?.knowledge_points || 0) + ptsToNext).color}`}>{nextLevel.name}</span></span>
            <span className="text-muted-foreground">{ptsToNext} pts to go</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${levelPct}%` }} />
          </div>
        </div>
      )}

      {/* Quiz section */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Daily Market Quiz</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Answer 3 questions — earn up to 30 Knowledge Points</p>
          </div>
          {!quiz && (
            <Button onClick={generateQuiz} disabled={loadingQuiz} className="gap-2">
              {loadingQuiz ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              {loadingQuiz ? 'Loading...' : 'Start Quiz'}
            </Button>
          )}
        </div>

        {loadingQuiz && (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Fetching today's market questions...</p>
          </div>
        )}

        {quiz && !submitted && (
          <div className="space-y-6">
            {quiz.questions?.map((q, i) => (
              <div key={i} className="space-y-3">
                <p className="text-sm font-semibold">Q{i + 1}. {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(q.options || {}).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setAnswers(p => ({ ...p, [i]: key }))}
                      className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-all ${answers[i] === key ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/50 hover:bg-muted'}`}
                    >
                      <span className="font-semibold mr-2">{key}.</span>{val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button
              onClick={submitQuiz}
              disabled={Object.keys(answers).length < 3}
              className="w-full"
            >
              Submit Answers
            </Button>
          </div>
        )}

        {submitted && quiz && (
          <div className="space-y-5">
            <div className="text-center py-4 space-y-2">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-accent" />
              </div>
              <p className="text-xl font-bold">+{earnedPoints} Knowledge Points!</p>
              <p className="text-sm text-muted-foreground">{earnedPoints === 30 ? '🏆 Perfect score!' : earnedPoints > 0 ? '👍 Good effort!' : '📚 Keep studying!'}</p>
            </div>
            {quiz.questions?.map((q, i) => {
              const correct = answers[i] === q.correct;
              return (
                <div key={i} className={`rounded-xl p-4 border ${correct ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}`}>
                  <div className="flex items-start gap-2">
                    {correct ? <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="text-xs text-muted-foreground">Correct answer: <span className="font-semibold text-foreground">{q.correct}. {q.options?.[q.correct]}</span></p>
                      {q.explanation && <p className="text-xs text-muted-foreground italic mt-1">{q.explanation}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" className="w-full gap-2" onClick={generateQuiz}>
              <RefreshCw className="w-4 h-4" /> Try Another Quiz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}